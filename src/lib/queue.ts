import { Queue } from 'bullmq'
import IORedis from 'ioredis'

import { env } from '@/lib/env'

const globalForQueue = globalThis as typeof globalThis & {
  forgepressRedis?: IORedis
  forgepressQueues?: Map<string, Queue>
}

const redis =
  globalForQueue.forgepressRedis ??
  new IORedis(env.QUEUE_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

if (env.NODE_ENV !== 'production') {
  globalForQueue.forgepressRedis = redis
}

const queues = globalForQueue.forgepressQueues ?? new Map<string, Queue>()

if (env.NODE_ENV !== 'production') {
  globalForQueue.forgepressQueues = queues
}

export function getQueue(name: string) {
  const existing = queues.get(name)
  if (existing) return existing

  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5_000,
      },
    },
  })

  queues.set(name, queue)
  return queue
}

export { redis }
