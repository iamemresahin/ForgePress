import { env } from '@/lib/env'

type ArticleDraftRequest = {
  siteName: string
  locale: string
  canonicalTopic: string
  toneGuide?: string | null
  editorialGuidelines?: string | null
  adsensePolicyNotes?: string | null
  prohibitedTopics?: string[]
  requiredSections?: string[]
  reviewChecklist?: string[]
  niche?: string | null
  sourceUrl?: string | null
  sourceNotes?: string | null
}

type ArticleDraftResponse = {
  title: string
  slug: string
  excerpt: string
  body: string
  seoTitle: string
  seoDescription: string
  imagePrompt: string
}

type OpenAiModerationResult = {
  flagged: boolean
  categories: string[]
}

function requireOpenAiKey() {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  return env.OPENAI_API_KEY
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${requireOpenAiKey()}`,
  }
}

async function parseJsonResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${text}`)
  }

  return response.json()
}

function extractOutputText(responseJson: Record<string, unknown>) {
  const output = Array.isArray(responseJson.output) ? responseJson.output : []
  const chunks: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content: unknown[] }).content ?? [])
      : []

    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const maybeText = (part as { text?: unknown }).text
      if (typeof maybeText === 'string') {
        chunks.push(maybeText)
      }
    }
  }

  if (chunks.length === 0) {
    throw new Error('OpenAI response did not include text output.')
  }

  return chunks.join('\n')
}

export async function moderateText(input: string): Promise<OpenAiModerationResult> {
  if (!env.OPENAI_API_KEY) {
    return { flagged: false, categories: [] }
  }

  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: env.OPENAI_MODERATION_MODEL,
      input,
    }),
  })

  const json = (await parseJsonResponse(response)) as {
    results?: Array<{
      flagged?: boolean
      categories?: Record<string, boolean>
    }>
  }

  const firstResult = json.results?.[0]
  const categories = Object.entries(firstResult?.categories ?? {})
    .filter(([, active]) => active)
    .map(([category]) => category)

  return {
    flagged: Boolean(firstResult?.flagged),
    categories,
  }
}

export async function generateArticleDraft(
  request: ArticleDraftRequest,
): Promise<ArticleDraftResponse & { moderation: OpenAiModerationResult }> {
  const moderationInput = [request.canonicalTopic, request.sourceNotes, request.sourceUrl]
    .filter(Boolean)
    .join('\n')
  const inputModeration = await moderateText(moderationInput)

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: env.OPENAI_TEXT_MODEL,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                `You write high-quality editorial drafts for a multi-site publishing platform. Output only JSON matching the provided schema. Keep claims cautious, useful, and review-friendly. CRITICAL: You MUST write ALL text (title, slug, excerpt, body, seoTitle, seoDescription) exclusively in the locale specified in the request. Never mix languages. Never use any other language even for headings or labels. Body must be markdown with clear English-style section headings appropriate for the target locale.`,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                siteName: request.siteName,
                locale: request.locale,
                canonicalTopic: request.canonicalTopic,
                niche: request.niche,
                toneGuide: request.toneGuide,
                editorialGuidelines: request.editorialGuidelines,
                adsensePolicyNotes: request.adsensePolicyNotes,
                prohibitedTopics: request.prohibitedTopics,
                requiredSections: request.requiredSections,
                reviewChecklist: request.reviewChecklist,
                sourceUrl: request.sourceUrl,
                sourceNotes: request.sourceNotes,
                requirements: {
                  wordCountTarget: '700-1100 words',
                  includeSummary: request.requiredSections?.includes('Summary') ?? true,
                  includeContextSection: request.requiredSections?.includes('Context') ?? true,
                  includeWhatToWatchSection: request.requiredSections?.includes('What to watch') ?? true,
                },
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'forgepress_article_draft',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'title',
              'slug',
              'excerpt',
              'body',
              'seoTitle',
              'seoDescription',
              'imagePrompt',
            ],
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
      },
    }),
  })

  const json = (await parseJsonResponse(response)) as Record<string, unknown>
  const responseText = extractOutputText(json)
  const parsed = JSON.parse(responseText) as ArticleDraftResponse
  const outputModeration = await moderateText([parsed.title, parsed.excerpt, parsed.body].join('\n'))

  return {
    ...parsed,
    moderation: {
      flagged: inputModeration.flagged || outputModeration.flagged,
      categories: Array.from(new Set([...inputModeration.categories, ...outputModeration.categories])),
    },
  }
}
