import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import pg from 'pg'

const { Client } = pg
const QUEUE_NAME = 'forgepress-jobs'

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required to run the ForgePress worker.`)
  }

  return value
}

const databaseUrl = requireEnv('DATABASE_URL')
const queueUrl = requireEnv('QUEUE_URL')

const redis = new IORedis(queueUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

function createClient() {
  return new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  })
}

async function withClient(fn) {
  const client = createClient()
  await client.connect()

  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

async function markJobRunning(client, jobId) {
  await client.query(
    `
      update jobs
      set status = 'running',
          attempts = attempts + 1,
          started_at = now(),
          error_message = null
      where id = $1
    `,
    [jobId],
  )
}

async function markJobCompleted(client, jobId, note) {
  await client.query(
    `
      update jobs
      set status = 'completed',
          finished_at = now(),
          updated_at = now(),
          payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('workerNote', $2)
      where id = $1
    `,
    [jobId, note],
  )
}

async function markJobFailed(client, jobId, errorMessage) {
  await client.query(
    `
      update jobs
      set status = 'failed',
          finished_at = now(),
          updated_at = now(),
          error_message = $2
      where id = $1
    `,
    [jobId, errorMessage],
  )
}

async function handleJobRecord(client, queueJob) {
  const recordId = queueJob.data?.id

  if (!recordId) {
    throw new Error('Queue job payload is missing the persistent job id.')
  }

  await markJobRunning(client, recordId)

  switch (queueJob.name) {
    case 'ingestion':
      await markJobCompleted(client, recordId, 'Ingestion worker consumed the queue record.')
      return
    case 'rewrite':
      await markJobCompleted(client, recordId, 'Rewrite worker consumed the queue record.')
      return
    case 'localization':
      await markJobCompleted(client, recordId, 'Localization worker consumed the queue record.')
      return
    case 'image':
      await markJobCompleted(client, recordId, 'Image worker consumed the queue record.')
      return
    case 'publish':
      await markJobCompleted(client, recordId, 'Publish worker consumed the queue record.')
      return
    default:
      throw new Error(`Unsupported job kind: ${queueJob.name}`)
  }
}

const worker = new Worker(
  QUEUE_NAME,
  async (queueJob) =>
    withClient(async (client) => {
      try {
        await handleJobRecord(client, queueJob)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Worker failed unexpectedly.'
        if (queueJob.data?.id) {
          await markJobFailed(client, queueJob.data.id, message)
        }

        throw error
      }
    }),
  {
    connection: redis,
    concurrency: 4,
  },
)

worker.on('completed', (job) => {
  console.log(`[worker] completed ${job.name} (${job.data?.id ?? 'unknown'})`)
})

worker.on('failed', (job, error) => {
  console.error(`[worker] failed ${job?.name ?? 'unknown'} (${job?.data?.id ?? 'unknown'})`, error)
})

async function shutdown(signal) {
  console.log(`[worker] shutting down on ${signal}`)
  await worker.close()
  await redis.quit()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

console.log(`[worker] listening on queue ${QUEUE_NAME}`)
