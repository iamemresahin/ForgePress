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
          payload = coalesce(payload, '{}'::jsonb) || $2::jsonb
      where id = $1
    `,
    [jobId, JSON.stringify(note)],
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

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180)
}

function stripHtml(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  }

function normalizeText(value = '') {
  return decodeEntities(stripHtml(value))
}

function extractTagContent(input, tag) {
  const match = input.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match?.[1] ? normalizeText(match[1]) : ''
}

function extractMetaContent(input, name) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return decodeEntities(input.match(pattern)?.[1] ?? '').trim()
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'ForgePressBot/1.0 (+https://www.forgepress.cc)',
      accept: 'text/html,application/xml,text/xml,application/json;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`)
  }

  return response.text()
}

async function fetchHtmlCandidate(url) {
  const html = await fetchText(url)
  const title = extractTagContent(html, 'title') || url
  const excerpt =
    extractMetaContent(html, 'description') ||
    normalizeText(html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '') ||
    `Imported source candidate from ${url}`

  return {
    url,
    title,
    excerpt,
    body: `# ${title}\n${excerpt}\n\n## Source intake\nImported automatically from ${url}.\n\n## Editorial next step\nReview this draft, confirm the source details, and expand the article before publishing.`,
  }
}

function parseRssItems(xml) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]

  return items.slice(0, 5).map((match) => {
    const item = match[0]
    return {
      title: extractTagContent(item, 'title'),
      url: extractTagContent(item, 'link'),
      excerpt: extractTagContent(item, 'description'),
    }
  }).filter((item) => item.title && item.url)
}

function parseSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .slice(0, 5)
    .map((match) => decodeEntities(match[1]).trim())
    .filter(Boolean)
}

function parseCustomFeed(text) {
  try {
    const parsed = JSON.parse(text)
    const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : []
    return entries
      .map((item) => ({
        title: typeof item.title === 'string' ? item.title : '',
        url: typeof item.url === 'string' ? item.url : typeof item.link === 'string' ? item.link : '',
        excerpt:
          typeof item.excerpt === 'string'
            ? item.excerpt
            : typeof item.description === 'string'
              ? item.description
              : '',
      }))
      .filter((item) => item.title && item.url)
      .slice(0, 5)
  } catch {
    return parseRssItems(text)
  }
}

async function fetchSourceCandidates(source) {
  if (source.type === 'manual_url') {
    return [await fetchHtmlCandidate(source.url)]
  }

  if (source.type === 'rss') {
    const xml = await fetchText(source.url)
    return parseRssItems(xml).map((item) => ({
      ...item,
      body: `# ${item.title}\n${item.excerpt || `Imported from ${item.url}.`}\n\n## Source intake\nImported automatically from RSS feed ${source.label}.\n\n## Editorial next step\nReview this draft, confirm the source details, and expand the article before publishing.`,
    }))
  }

  if (source.type === 'sitemap') {
    const xml = await fetchText(source.url)
    const urls = parseSitemapUrls(xml)
    const candidates = []

    for (const url of urls.slice(0, 3)) {
      candidates.push(await fetchHtmlCandidate(url))
    }

    return candidates
  }

  const feedText = await fetchText(source.url)
  return parseCustomFeed(feedText).map((item) => ({
    ...item,
    body: `# ${item.title}\n${item.excerpt || `Imported from ${item.url}.`}\n\n## Source intake\nImported automatically from custom feed ${source.label}.\n\n## Editorial next step\nReview this draft, confirm the source details, and expand the article before publishing.`,
  }))
}

async function articleExistsForSource(client, siteId, sourceUrl) {
  const result = await client.query(
    `
      select 1
      from articles
      where site_id = $1 and source_url = $2
      limit 1
    `,
    [siteId, sourceUrl],
  )

  return result.rowCount > 0
}

async function createDraftArticleFromCandidate(client, source, candidate) {
  if (await articleExistsForSource(client, source.site_id, candidate.url)) {
    return { created: false, reason: 'duplicate' }
  }

  const articleInsert = await client.query(
    `
      insert into articles (site_id, source_id, canonical_topic, source_url, status)
      values ($1, $2, $3, $4, 'review')
      returning id
    `,
    [source.site_id, source.id, source.label, candidate.url],
  )

  const articleId = articleInsert.rows[0]?.id
  const baseSlug = slugify(candidate.title || source.label || 'imported-story') || `imported-${Date.now()}`
  const slug = `${baseSlug}-${String(Date.now()).slice(-6)}`

  await client.query(
    `
      insert into article_localizations (article_id, locale, title, slug, excerpt, body)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [
      articleId,
      source.locale,
      candidate.title || source.label,
      slug,
      candidate.excerpt?.slice(0, 500) || null,
      candidate.body,
    ],
  )

  return { created: true, articleId, slug }
}

async function runIngestion(client, queueJob) {
  const siteId = queueJob.data?.siteId

  if (!siteId) {
    throw new Error('Ingestion job is missing siteId.')
  }

  const sourcesResult = await client.query(
    `
      select id, site_id, label, type, url, locale
      from sources
      where site_id = $1 and is_active = true
      order by created_at desc
    `,
    [siteId],
  )

  if (sourcesResult.rowCount === 0) {
    return {
      workerNote: 'No active sources found for this site.',
      createdArticles: 0,
      skippedArticles: 0,
      processedSources: 0,
    }
  }

  let createdArticles = 0
  let skippedArticles = 0
  const processedSources = []

  for (const source of sourcesResult.rows) {
    try {
      const candidates = await fetchSourceCandidates(source)
      let sourceCreated = 0
      let sourceSkipped = 0

      for (const candidate of candidates) {
        const result = await createDraftArticleFromCandidate(client, source, candidate)
        if (result.created) {
          createdArticles += 1
          sourceCreated += 1
        } else {
          skippedArticles += 1
          sourceSkipped += 1
        }
      }

      processedSources.push({
        sourceId: source.id,
        label: source.label,
        type: source.type,
        created: sourceCreated,
        skipped: sourceSkipped,
      })
    } catch (error) {
      processedSources.push({
        sourceId: source.id,
        label: source.label,
        type: source.type,
        error: error instanceof Error ? error.message : 'Source ingestion failed.',
      })
    }
  }

  return {
    workerNote: `Ingestion processed ${processedSources.length} source(s).`,
    createdArticles,
    skippedArticles,
    processedSources,
  }
}

async function handleJobRecord(client, queueJob) {
  const recordId = queueJob.data?.id

  if (!recordId) {
    throw new Error('Queue job payload is missing the persistent job id.')
  }

  await markJobRunning(client, recordId)

  switch (queueJob.name) {
    case 'ingestion':
      await markJobCompleted(client, recordId, await runIngestion(client, queueJob))
      return
    case 'rewrite':
      await markJobCompleted(client, recordId, { workerNote: 'Rewrite worker consumed the queue record.' })
      return
    case 'localization':
      await markJobCompleted(client, recordId, { workerNote: 'Localization worker consumed the queue record.' })
      return
    case 'image':
      await markJobCompleted(client, recordId, { workerNote: 'Image worker consumed the queue record.' })
      return
    case 'publish':
      await markJobCompleted(client, recordId, { workerNote: 'Publish worker consumed the queue record.' })
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
