import { createHash } from 'crypto'
import { Queue, Worker } from 'bullmq'
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

function optionalEnv(name, fallback = '') {
  return process.env[name] || fallback
}

const databaseUrl = requireEnv('DATABASE_URL')
const queueUrl = requireEnv('QUEUE_URL')
const openaiApiKey = optionalEnv('OPENAI_API_KEY')
const openaiTextModel = optionalEnv('OPENAI_TEXT_MODEL', 'gpt-5.4-mini')
const openaiImageModel = optionalEnv('OPENAI_IMAGE_MODEL', 'gpt-image-1-mini')
const openaiModerationModel = optionalEnv('OPENAI_MODERATION_MODEL', 'omni-moderation-latest')

const redis = new IORedis(queueUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

const queue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
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

function computeContentHash(title, body) {
  const normalized = `${(title || '').trim().toLowerCase()}||${(body || '').slice(0, 1000).trim().toLowerCase()}`
  return createHash('sha256').update(normalized).digest('hex')
}

async function articleExistsForSource(client, siteId, sourceUrl, contentHash) {
  const result = await client.query(
    `
      select 1
      from articles
      where site_id = $1 and (source_url = $2 or (content_hash = $3 and content_hash is not null))
      limit 1
    `,
    [siteId, sourceUrl, contentHash],
  )

  return result.rowCount > 0
}

async function createDraftArticleFromCandidate(client, source, candidate, supportedLocales = []) {
  const contentHash = computeContentHash(candidate.title, candidate.body)

  if (await articleExistsForSource(client, source.site_id, candidate.url, contentHash)) {
    return { created: false, reason: 'duplicate' }
  }

  const articleInsert = await client.query(
    `
      insert into articles (site_id, source_id, canonical_topic, source_url, content_hash, status)
      values ($1, $2, $3, $4, $5, 'review')
      returning id
    `,
    [source.site_id, source.id, source.label, candidate.url, contentHash],
  )

  const articleId = articleInsert.rows[0]?.id
  const baseSlug = slugify(candidate.title || source.label || 'imported-story') || `imported-${Date.now()}`
  const slug = `${baseSlug}-${String(Date.now()).slice(-6)}`

  // Primary localization in the source's locale
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

  // Stub localizations for other supported locales so the localization worker can translate them
  const otherLocales = supportedLocales.filter((l) => l !== source.locale)
  for (const locale of otherLocales) {
    const stubSlug = `${baseSlug}-${locale}-${String(Date.now()).slice(-6)}`
    await client.query(
      `
        insert into article_localizations (article_id, locale, title, slug, excerpt, body)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (article_id, locale) do nothing
      `,
      [
        articleId,
        locale,
        candidate.title || source.label,
        stubSlug,
        candidate.excerpt?.slice(0, 500) || null,
        candidate.body,
      ],
    )
  }

  return { created: true, articleId, slug }
}

// ---------------------------------------------------------------------------
// OpenAI helpers
// ---------------------------------------------------------------------------

function requireOpenAi() {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured. AI workers cannot run without it.')
  }
}

function openaiHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${openaiApiKey}`,
  }
}

function extractOutputText(json) {
  const output = Array.isArray(json.output) ? json.output : []
  const chunks = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray(item.content) ? item.content : []
    for (const part of content) {
      if (part && typeof part === 'object' && typeof part.text === 'string') {
        chunks.push(part.text)
      }
    }
  }

  if (chunks.length === 0) {
    throw new Error('OpenAI response did not include text output.')
  }

  return chunks.join('\n')
}

async function callOpenAiText(systemPrompt, userPayload, schema) {
  const body = {
    model: openaiTextModel,
    reasoning: { effort: 'medium' },
    input: [
      { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(userPayload) }] },
    ],
  }

  if (schema) {
    body.text = { format: { type: 'json_schema', ...schema } }
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: openaiHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${text}`)
  }

  const json = await response.json()
  return extractOutputText(json)
}

async function callOpenAiImage(prompt, size = '1536x1024') {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: openaiImageModel,
      prompt,
      n: 1,
      size,
      quality: 'low',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI image request failed (${response.status}): ${text}`)
  }

  const json = await response.json()
  const imageData = json.data?.[0]

  if (!imageData) {
    throw new Error('OpenAI image response did not include image data.')
  }

  return imageData
}

// ---------------------------------------------------------------------------
// Rewrite worker
// ---------------------------------------------------------------------------

async function runRewrite(client, queueJob) {
  requireOpenAi()
  const siteId = queueJob.data?.siteId
  if (!siteId) throw new Error('Rewrite job is missing siteId.')

  // Fetch site config for editorial context
  const siteResult = await client.query(
    `select name, default_locale, niche, tone_guide, editorial_guidelines,
            adsense_policy_notes, prohibited_topics, required_sections, review_checklist
     from sites where id = $1`,
    [siteId],
  )
  const site = siteResult.rows[0]
  if (!site) throw new Error('Site not found.')

  // Find articles in 'review' status that need rewriting
  const articlesResult = await client.query(
    `select a.id as article_id, a.canonical_topic, a.source_url,
            al.id as loc_id, al.locale, al.title, al.excerpt, al.body
     from articles a
     inner join article_localizations al on al.article_id = a.id
     where a.site_id = $1 and a.status = 'review'
     order by a.created_at asc
     limit 10`,
    [siteId],
  )

  if (articlesResult.rowCount === 0) {
    return { workerNote: 'No articles in review status to rewrite.', rewrittenArticles: 0 }
  }

  let rewrittenCount = 0
  const results = []

  for (const row of articlesResult.rows) {
    try {
      const responseText = await callOpenAiText(
        'You are an expert editorial rewriter for a multi-site publishing platform. ' +
        'Given a rough draft article and site editorial context, produce a polished, ' +
        'publication-ready version. Output only JSON matching the provided schema. ' +
        'Keep claims cautious and well-sourced. Write in the requested locale. ' +
        'Body must be markdown with clear section headings. Target 700-1100 words.',
        {
          siteName: site.name,
          locale: row.locale,
          niche: site.niche,
          toneGuide: site.tone_guide,
          editorialGuidelines: site.editorial_guidelines,
          adsensePolicyNotes: site.adsense_policy_notes,
          prohibitedTopics: site.prohibited_topics,
          requiredSections: site.required_sections,
          reviewChecklist: site.review_checklist,
          canonicalTopic: row.canonical_topic,
          sourceUrl: row.source_url,
          originalTitle: row.title,
          originalExcerpt: row.excerpt,
          originalBody: row.body,
        },
        {
          name: 'forgepress_rewrite',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'slug', 'excerpt', 'body', 'seoTitle', 'seoDescription', 'imagePrompt'],
            properties: {
              title: { type: 'string' },
              slug: { type: 'string' },
              excerpt: { type: 'string' },
              body: { type: 'string' },
              seoTitle: { type: 'string' },
              seoDescription: { type: 'string' },
              imagePrompt: { type: 'string' },
            },
          },
        },
      )

      const parsed = JSON.parse(responseText)
      const finalSlug = `${slugify(parsed.slug || parsed.title || row.title)}-${String(Date.now()).slice(-6)}`

      await client.query(
        `update article_localizations
         set title = $1, slug = $2, excerpt = $3, body = $4,
             seo_title = $5, seo_description = $6, updated_at = now()
         where id = $7`,
        [parsed.title, finalSlug, parsed.excerpt, parsed.body, parsed.seoTitle, parsed.seoDescription, row.loc_id],
      )

      // Move article from 'review' to 'draft' (editor-ready)
      await client.query(
        `update articles set status = 'draft', updated_at = now() where id = $1`,
        [row.article_id],
      )

      rewrittenCount += 1
      results.push({ articleId: row.article_id, title: parsed.title, status: 'rewritten' })
    } catch (error) {
      results.push({
        articleId: row.article_id,
        title: row.title,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Rewrite failed.',
      })
    }
  }

  return {
    workerNote: `Rewrite processed ${articlesResult.rowCount} article(s). ${rewrittenCount} rewritten successfully.`,
    rewrittenArticles: rewrittenCount,
    totalProcessed: articlesResult.rowCount,
    results,
  }
}

// ---------------------------------------------------------------------------
// Localization worker
// ---------------------------------------------------------------------------

async function runLocalization(client, queueJob) {
  requireOpenAi()
  const siteId = queueJob.data?.siteId
  if (!siteId) throw new Error('Localization job is missing siteId.')

  const siteResult = await client.query(
    `select name, default_locale, supported_locales, niche, tone_guide, editorial_guidelines
     from sites where id = $1`,
    [siteId],
  )
  const site = siteResult.rows[0]
  if (!site) throw new Error('Site not found.')

  const supportedLocales = Array.isArray(site.supported_locales) ? site.supported_locales : ['en']
  if (supportedLocales.length <= 1) {
    return { workerNote: 'Site has only one locale configured. Nothing to localize.', localizedArticles: 0 }
  }

  // Find the primary (most-content) localization for each draft/published article
  // that still needs real translation — either locale rows are missing, OR the row
  // is a stub (body identical to another locale, copied verbatim during ingestion).
  const articlesResult = await client.query(
    `select distinct on (a.id)
            a.id as article_id, a.canonical_topic, a.source_url,
            al.locale as base_locale, al.title, al.slug, al.excerpt, al.body,
            al.seo_title, al.seo_description
     from articles a
     inner join article_localizations al on al.article_id = a.id
     inner join sites s on s.id = a.site_id
     where a.site_id = $1
       and a.status in ('draft', 'published')
       and jsonb_array_length(s.supported_locales) > 1
       and (
         -- Completely missing a locale
         exists (
           select 1 from jsonb_array_elements_text(s.supported_locales) as loc
           where not exists (
             select 1 from article_localizations al2
             where al2.article_id = a.id and al2.locale = loc
           )
         )
         OR
         -- Or has at least one stub (body identical to this row's body in a different locale)
         exists (
           select 1 from article_localizations al_stub
           where al_stub.article_id = a.id
             and al_stub.locale != al.locale
             and al_stub.body = al.body
         )
       )
     order by a.id, length(al.body) desc
     limit 10`,
    [siteId],
  )

  if (articlesResult.rowCount === 0) {
    return { workerNote: 'No articles need localization.', localizedArticles: 0 }
  }

  let localizedCount = 0
  const results = []

  for (const article of articlesResult.rows) {
    const articleId = article.article_id

    // Determine which locales need real translation:
    // - locales completely missing, OR
    // - locales that are stubs (body == primary body)
    const existingResult = await client.query(
      `select locale, body from article_localizations where article_id = $1`,
      [articleId],
    )
    const targetLocales = supportedLocales.filter((l) => {
      if (l === article.base_locale) return false
      const existing = existingResult.rows.find((r) => r.locale === l)
      return !existing || existing.body === article.body
    })
    if (targetLocales.length === 0) continue

    for (const targetLocale of targetLocales) {
      try {
        const responseText = await callOpenAiText(
          'You are a professional editorial translator for a multi-site publishing platform. ' +
          'Translate the article faithfully into the target locale while maintaining editorial ' +
          'quality, SEO effectiveness, and the original tone. Output only JSON matching the schema. ' +
          'Body must be markdown with clear section headings.',
          {
            siteName: site.name,
            sourceLocale: article.base_locale,
            targetLocale,
            niche: site.niche,
            toneGuide: site.tone_guide,
            editorialGuidelines: site.editorial_guidelines,
            originalTitle: article.title,
            originalExcerpt: article.excerpt,
            originalBody: article.body,
            originalSeoTitle: article.seo_title,
            originalSeoDescription: article.seo_description,
          },
          {
            name: 'forgepress_localization',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'slug', 'excerpt', 'body', 'seoTitle', 'seoDescription'],
              properties: {
                title: { type: 'string' },
                slug: { type: 'string' },
                excerpt: { type: 'string' },
                body: { type: 'string' },
                seoTitle: { type: 'string' },
                seoDescription: { type: 'string' },
              },
            },
          },
        )

        const parsed = JSON.parse(responseText)
        const finalSlug = `${slugify(parsed.slug || parsed.title)}-${String(Date.now()).slice(-6)}`

        await client.query(
          `insert into article_localizations (article_id, locale, title, slug, excerpt, body, seo_title, seo_description)
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           on conflict (article_id, locale) do update
             set title = excluded.title,
                 slug = excluded.slug,
                 excerpt = excluded.excerpt,
                 body = excluded.body,
                 seo_title = excluded.seo_title,
                 seo_description = excluded.seo_description,
                 updated_at = now()`,
          [articleId, targetLocale, parsed.title, finalSlug, parsed.excerpt, parsed.body, parsed.seoTitle, parsed.seoDescription],
        )

        localizedCount += 1
        results.push({ articleId, locale: targetLocale, title: parsed.title, status: 'localized' })
      } catch (error) {
        results.push({
          articleId,
          locale: targetLocale,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Localization failed.',
        })
      }
    }
  }

  return {
    workerNote: `Localization created ${localizedCount} new locale variant(s).`,
    localizedArticles: localizedCount,
    results,
  }
}

// ---------------------------------------------------------------------------
// Image worker
// ---------------------------------------------------------------------------

async function runImage(client, queueJob) {
  requireOpenAi()
  const siteId = queueJob.data?.siteId
  if (!siteId) throw new Error('Image job is missing siteId.')

  const siteResult = await client.query(
    `select name, niche from sites where id = $1`,
    [siteId],
  )
  const site = siteResult.rows[0]
  if (!site) throw new Error('Site not found.')

  // Find article localizations that have no image
  const locsResult = await client.query(
    `select al.id as loc_id, al.article_id, al.title, al.excerpt, al.locale
     from article_localizations al
     inner join articles a on a.id = al.article_id
     where a.site_id = $1 and a.status in ('draft', 'review', 'scheduled')
       and (al.image_url is null or al.image_url = '')
     order by al.created_at asc
     limit 5`,
    [siteId],
  )

  if (locsResult.rowCount === 0) {
    return { workerNote: 'No articles need images.', generatedImages: 0 }
  }

  let generatedCount = 0
  const results = []

  for (const row of locsResult.rows) {
    try {
      // Build a concise image prompt from article context
      const imagePrompt =
        `Editorial illustration for an article titled "${row.title}" ` +
        `in the ${site.niche || 'general news'} niche. ` +
        `Clean, modern editorial style. No text overlays. ` +
        `Suitable as a hero image for a publishing platform.`

      const imageData = await callOpenAiImage(imagePrompt)

      // gpt-image-1 returns b64_json by default; store as data URI or use URL if provided
      let imageUrl = imageData.url || null

      if (!imageUrl && imageData.b64_json) {
        // Store base64 as a data URI for now; a future upgrade can push to object storage
        imageUrl = `data:image/png;base64,${imageData.b64_json}`
      }

      if (!imageUrl) {
        throw new Error('No image URL or data returned from OpenAI.')
      }

      await client.query(
        `update article_localizations set image_url = $1, updated_at = now() where id = $2`,
        [imageUrl, row.loc_id],
      )

      generatedCount += 1
      results.push({ locId: row.loc_id, articleId: row.article_id, status: 'generated' })
    } catch (error) {
      results.push({
        locId: row.loc_id,
        articleId: row.article_id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Image generation failed.',
      })
    }
  }

  return {
    workerNote: `Image worker generated ${generatedCount} image(s) for ${locsResult.rowCount} article(s).`,
    generatedImages: generatedCount,
    totalProcessed: locsResult.rowCount,
    results,
  }
}

// ---------------------------------------------------------------------------
// Publish worker
// ---------------------------------------------------------------------------

async function runPublish(client, queueJob) {
  const siteId = queueJob.data?.siteId
  if (!siteId) throw new Error('Publish job is missing siteId.')

  const siteResult = await client.query(
    `select slug as site_slug, name from sites where id = $1`,
    [siteId],
  )
  const site = siteResult.rows[0]
  if (!site) throw new Error('Site not found.')

  // Find articles that are in 'scheduled' status or 'draft' with complete content
  const articlesResult = await client.query(
    `select a.id as article_id, a.status,
            al.locale, al.title, al.slug, al.body, al.seo_title, al.seo_description
     from articles a
     inner join article_localizations al on al.article_id = a.id
     where a.site_id = $1 and a.status = 'scheduled'
     order by a.created_at asc
     limit 20`,
    [siteId],
  )

  if (articlesResult.rowCount === 0) {
    return { workerNote: 'No scheduled articles to publish.', publishedArticles: 0 }
  }

  let publishedCount = 0
  const results = []
  const now = new Date()

  // Group by article_id to publish once per article
  const articleIds = [...new Set(articlesResult.rows.map((r) => r.article_id))]

  for (const articleId of articleIds) {
    const rows = articlesResult.rows.filter((r) => r.article_id === articleId)
    const primary = rows[0]

    // Validate minimum publish requirements
    if (!primary.title || !primary.slug || !primary.body) {
      results.push({ articleId, status: 'skipped', reason: 'Missing required fields (title, slug, or body).' })
      continue
    }

    try {
      await client.query(
        `update articles
         set status = 'published', published_at = $2, updated_at = $2
         where id = $1`,
        [articleId, now.toISOString()],
      )

      // Generate schema.org NewsArticle markup for each localization
      for (const row of rows) {
        const schemaJson = {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: row.title,
          description: row.seo_description || row.excerpt || '',
          datePublished: now.toISOString(),
          inLanguage: row.locale,
          url: `/${site.site_slug}/${row.slug}`,
          publisher: {
            '@type': 'Organization',
            name: site.name,
          },
        }

        await client.query(
          `update article_localizations
           set schema_json = $1, updated_at = now()
           where article_id = $2 and locale = $3`,
          [JSON.stringify(schemaJson), articleId, row.locale],
        )
      }

      publishedCount += 1
      results.push({
        articleId,
        title: primary.title,
        slug: primary.slug,
        route: `/${site.site_slug}/${primary.slug}`,
        locales: rows.map((r) => r.locale),
        status: 'published',
      })
    } catch (error) {
      results.push({
        articleId,
        title: primary.title,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Publish failed.',
      })
    }
  }

  return {
    workerNote: `Published ${publishedCount} article(s) out of ${articleIds.length} scheduled.`,
    publishedArticles: publishedCount,
    totalScheduled: articleIds.length,
    results,
  }
}

// ---------------------------------------------------------------------------
// Ingestion worker (existing)
// ---------------------------------------------------------------------------

async function runIngestion(client, queueJob) {
  const siteId = queueJob.data?.siteId

  if (!siteId) {
    throw new Error('Ingestion job is missing siteId.')
  }

  const siteResult = await client.query(
    `select supported_locales from sites where id = $1`,
    [siteId],
  )
  const supportedLocales = Array.isArray(siteResult.rows[0]?.supported_locales)
    ? siteResult.rows[0].supported_locales
    : []

  const sourcesResult = await client.query(
    `
      select id, site_id, label, type, url, locale, poll_minutes, last_fetched_at
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

  const now = new Date()

  for (const source of sourcesResult.rows) {
    // Per-source rate limiting: skip if not enough time has passed since last fetch
    if (source.last_fetched_at) {
      const minutesSinceFetch = (now.getTime() - new Date(source.last_fetched_at).getTime()) / 60_000
      if (minutesSinceFetch < source.poll_minutes) {
        processedSources.push({
          sourceId: source.id,
          label: source.label,
          type: source.type,
          skippedRateLimit: true,
          nextFetchInMinutes: Math.ceil(source.poll_minutes - minutesSinceFetch),
        })
        continue
      }
    }

    try {
      const candidates = await fetchSourceCandidates(source)
      let sourceCreated = 0
      let sourceSkipped = 0

      for (const candidate of candidates) {
        const result = await createDraftArticleFromCandidate(client, source, candidate, supportedLocales)
        if (result.created) {
          createdArticles += 1
          sourceCreated += 1
        } else {
          skippedArticles += 1
          sourceSkipped += 1
        }
      }

      // Update last_fetched_at after successful fetch
      await client.query(
        `update sources set last_fetched_at = $1 where id = $2`,
        [now.toISOString(), source.id],
      )

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
      await markJobCompleted(client, recordId, await runRewrite(client, queueJob))
      return
    case 'localization':
      await markJobCompleted(client, recordId, await runLocalization(client, queueJob))
      return
    case 'image':
      await markJobCompleted(client, recordId, await runImage(client, queueJob))
      return
    case 'publish':
      await markJobCompleted(client, recordId, await runPublish(client, queueJob))
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

// ---------------------------------------------------------------------------
// Auto-scheduler: full pipeline automation
//
// Every tick (60s) we check each active site and queue whichever job is
// appropriate based on the current article states:
//
//   ingestion  → runs on source poll cadence, creates "review" articles
//   rewrite    → runs when review articles exist (no pending rewrite)
//   localization → runs when draft/published articles are missing locale variants
//   image      → runs when articles are missing images
//   publish    → runs when articles are in "scheduled" status
//
// Each job kind is skipped if one is already queued/running for the site.
// ---------------------------------------------------------------------------

async function maybeQueueJob(client, siteId, kind, now) {
  const pendingResult = await client.query(
    `select 1 from jobs
     where site_id = $1 and kind = $2 and status in ('queued', 'running')
     limit 1`,
    [siteId, kind],
  )
  if (pendingResult.rowCount > 0) return false

  const payload = { siteId, requestedAt: now.toISOString(), trigger: 'auto_scheduler' }
  const insertResult = await client.query(
    `insert into jobs (site_id, kind, status, payload)
     values ($1, $2, 'queued', $3)
     returning id`,
    [siteId, kind, JSON.stringify(payload)],
  )
  const jobId = insertResult.rows[0]?.id
  if (!jobId) return false

  await queue.add(kind, { id: jobId, ...payload })
  console.log(`[scheduler] queued ${kind} for site ${siteId}`)
  return true
}

async function isAutopilotEnabled(client) {
  try {
    const result = await client.query(
      `select value from platform_settings where key = 'autopilot' limit 1`,
    )
    return result.rows[0]?.value === true
  } catch {
    return false
  }
}

// ── Ingestion tick (every 60s): respects per-source poll cadence ─────────────
async function ingestionTick() {
  try {
    await withClient(async (client) => {
      const now = new Date()
      const sitesResult = await client.query(
        `select s.id as site_id, min(so.poll_minutes) as poll_minutes
         from sites s
         inner join sources so on so.site_id = s.id and so.is_active = true
         where s.status = 'active'
         group by s.id`,
      )

      for (const row of sitesResult.rows) {
        const siteId = row.site_id
        const pollMinutes = Number(row.poll_minutes)

        const lastResult = await client.query(
          `select finished_at from jobs
           where site_id = $1 and kind = 'ingestion' and status = 'completed'
           order by finished_at desc limit 1`,
          [siteId],
        )
        const lastFinishedAt = lastResult.rows[0]?.finished_at
        const minutesSinceLast = lastFinishedAt
          ? (now.getTime() - new Date(lastFinishedAt).getTime()) / 60_000
          : Infinity

        if (minutesSinceLast >= pollMinutes) {
          await maybeQueueJob(client, siteId, 'ingestion', now)
        }
      }
    })
  } catch (error) {
    console.error('[ingestion-tick] error:', error instanceof Error ? error.message : error)
  }
}

// ── Pipeline tick (every 5 min): rewrite → localize → image → publish ────────
// Only runs when autopilot is enabled.
async function pipelineTick() {
  try {
    await withClient(async (client) => {
      const autopilot = await isAutopilotEnabled(client)
      if (!autopilot) return

      const now = new Date()
      const sitesResult = await client.query(
        `select id as site_id from sites where status = 'active'`,
      )

      for (const row of sitesResult.rows) {
        const siteId = row.site_id

        // Rewrite: articles in 'review'
        const reviewResult = await client.query(
          `select 1 from articles where site_id = $1 and status = 'review' limit 1`,
          [siteId],
        )
        if (reviewResult.rowCount > 0) {
          await maybeQueueJob(client, siteId, 'rewrite', now)
        }

        // Localization: draft/published articles that have stub localizations
        // (stubs are rows where the body is identical to another locale's body for
        //  the same article — created during ingestion as placeholders).
        // Also catches cases where locale rows are completely absent.
        const needsLocalizationResult = await client.query(
          `select 1
           from articles a
           join sites s on s.id = a.site_id
           where a.site_id = $1
             and a.status in ('draft', 'published')
             and jsonb_array_length(s.supported_locales) > 1
             and exists (
               select 1
               from jsonb_array_elements_text(s.supported_locales) target_loc
               left join article_localizations al_target
                 on al_target.article_id = a.id and al_target.locale = target_loc
               left join article_localizations al_primary
                 on al_primary.article_id = a.id and al_primary.locale != target_loc
               where al_target.id is null
                  or (al_primary.id is not null and al_target.body = al_primary.body)
             )
           limit 1`,
          [siteId],
        )
        if (needsLocalizationResult.rowCount > 0) {
          await maybeQueueJob(client, siteId, 'localization', now)
        }

        // Auto-schedule: draft articles where all supported locales have
        // distinct translated content and at least one image exists.
        // Move them to 'scheduled' so the publish worker can pick them up.
        const autoScheduleResult = await client.query(
          `select a.id
           from articles a
           join sites s on s.id = a.site_id
           where a.site_id = $1
             and a.status = 'draft'
             -- All supported locales have a real localization row
             and not exists (
               select 1 from jsonb_array_elements_text(s.supported_locales) as loc
               where not exists (
                 select 1 from article_localizations al
                 where al.article_id = a.id and al.locale = loc
               )
             )
             -- No locale is still a stub (body identical to another locale)
             and not exists (
               select 1
               from article_localizations al1
               join article_localizations al2
                 on al2.article_id = al1.article_id and al2.locale != al1.locale
               where al1.article_id = a.id and al1.body = al2.body
             )
             -- At least one localization has an image
             and exists (
               select 1 from article_localizations al
               where al.article_id = a.id
                 and al.image_url is not null and al.image_url != ''
             )`,
          [siteId],
        )
        if (autoScheduleResult.rowCount > 0) {
          const ids = autoScheduleResult.rows.map((r) => r.id)
          await client.query(
            `update articles set status = 'scheduled', updated_at = now()
             where id = any($1::uuid[])`,
            [ids],
          )
          console.log(`[scheduler] auto-scheduled ${ids.length} article(s) for site ${siteId}`)
        }

        // Image: article localizations missing images
        const missingImageResult = await client.query(
          `select 1
           from article_localizations al
           join articles a on a.id = al.article_id
           where a.site_id = $1
             and a.status in ('draft', 'review', 'scheduled')
             and (al.image_url is null or al.image_url = '')
           limit 1`,
          [siteId],
        )
        if (missingImageResult.rowCount > 0) {
          await maybeQueueJob(client, siteId, 'image', now)
        }

        // Publish: articles in 'scheduled'
        const scheduledResult = await client.query(
          `select 1 from articles where site_id = $1 and status = 'scheduled' limit 1`,
          [siteId],
        )
        if (scheduledResult.rowCount > 0) {
          await maybeQueueJob(client, siteId, 'publish', now)
        }
      }
    })
  } catch (error) {
    console.error('[pipeline-tick] error:', error instanceof Error ? error.message : error)
  }
}

const INGESTION_INTERVAL_MS  = 60_000        //  1 minute  — checks cadence, usually skips
const PIPELINE_INTERVAL_MS   = 5 * 60_000    //  5 minutes — rewrite/loc/image/publish

setTimeout(() => { void ingestionTick() },  10_000)
setTimeout(() => { void pipelineTick() },   15_000)

const ingestionInterval = setInterval(() => { void ingestionTick() },  INGESTION_INTERVAL_MS)
const pipelineInterval  = setInterval(() => { void pipelineTick() },   PIPELINE_INTERVAL_MS)

// ---------------------------------------------------------------------------
// Shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal) {
  console.log(`[worker] shutting down on ${signal}`)
  clearInterval(ingestionInterval)
  clearInterval(pipelineInterval)
  await worker.close()
  await queue.close()
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
console.log('[scheduler] full pipeline automation active — ingestion → rewrite → localization → image → publish (60s tick)')
