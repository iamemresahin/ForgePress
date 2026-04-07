'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { env } from '@/lib/env'

import { requireAdminSession, requirePlatformAdminRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { siteDomains, sites } from '@/lib/db/schema'
import { parseHostnameList } from '@/lib/site-domain'

const createSiteSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens only.'),
  defaultLocale: z.string().min(2).max(16),
  supportedLocales: z.string().min(2),
  niche: z.string().max(160).optional(),
  toneGuide: z.string().max(2000).optional(),
  editorialGuidelines: z.string().max(4000).optional(),
  adsensePolicyNotes: z.string().max(4000).optional(),
  prohibitedTopics: z.string().max(2000).optional(),
  requiredSections: z.string().max(2000).optional(),
  reviewChecklist: z.string().max(2000).optional(),
  topicLabelOverrides: z.string().max(2000).optional(),
  featuredNavLabel: z.string().max(120).optional(),
  allNavLabel: z.string().max(120).optional(),
  navTopicSlugs: z.string().max(1000).optional(),
  authBrandName: z.string().max(160).optional(),
  googleClientId: z.string().max(400).optional(),
  adsensePublisherId: z.string().max(64).optional(),
  adsenseSlotId: z.string().max(32).optional(),
  primaryHostname: z.string().max(255).optional(),
  additionalHostnames: z.string().max(2000).optional(),
  themePreset: z.enum([
    'forge_blue',
    'editorial_glow',
    'news_sand',
    'midnight_signal',
    'kantan_editorial',
  ]),
  homepageLayout: z.enum(['spotlight', 'digest']),
  articleLayout: z.enum(['editorial', 'feature']),
  themePrimary: z.string().regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional().or(z.literal('')),
  themeAccent: z.string().regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional().or(z.literal('')),
  themeBackground: z.string().regex(/^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional().or(z.literal('')),
})

function parseLocales(rawLocales: string) {
  const locales = rawLocales
    .split(',')
    .map((locale) => locale.trim())
    .filter(Boolean)

  return Array.from(new Set(locales))
}

function parseList(rawValue?: string) {
  if (!rawValue) return []

  return Array.from(
    new Set(
      rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function parseTopicLabelOverrides(rawValue?: string) {
  if (!rawValue) return {}

  const entries = rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [slug, ...labelParts] = item.split(':')
      const normalizedSlug = slug?.trim().toLowerCase()
      const label = labelParts.join(':').trim()
      if (!normalizedSlug || !label) return null
      return [normalizedSlug, label] as const
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry))

  return Object.fromEntries(entries)
}

export async function createSiteAction(_: { error?: string } | undefined, formData: FormData) {
  const session = await requireAdminSession()
  requirePlatformAdminRole(session)

  const parsed = createSiteSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    defaultLocale: formData.get('defaultLocale'),
    supportedLocales: formData.get('supportedLocales'),
    niche: formData.get('niche') || undefined,
    toneGuide: formData.get('toneGuide') || undefined,
    editorialGuidelines: formData.get('editorialGuidelines') || undefined,
    adsensePolicyNotes: formData.get('adsensePolicyNotes') || undefined,
    prohibitedTopics: formData.get('prohibitedTopics') || undefined,
    requiredSections: formData.get('requiredSections') || undefined,
    reviewChecklist: formData.get('reviewChecklist') || undefined,
    topicLabelOverrides: formData.get('topicLabelOverrides') || undefined,
    featuredNavLabel: formData.get('featuredNavLabel') || undefined,
    allNavLabel: formData.get('allNavLabel') || undefined,
    navTopicSlugs: formData.get('navTopicSlugs') || undefined,
    authBrandName: formData.get('authBrandName') || undefined,
    googleClientId: formData.get('googleClientId') || undefined,
    adsensePublisherId: formData.get('adsensePublisherId') || undefined,
    adsenseSlotId: formData.get('adsenseSlotId') || undefined,
    primaryHostname: formData.get('primaryHostname') || undefined,
    additionalHostnames: formData.get('additionalHostnames') || undefined,
    themePreset: formData.get('themePreset'),
    homepageLayout: formData.get('homepageLayout'),
    articleLayout: formData.get('articleLayout'),
    themePrimary: formData.get('themePrimary') || undefined,
    themeAccent: formData.get('themeAccent') || undefined,
    themeBackground: formData.get('themeBackground') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form fields and try again.' }
  }

  const supportedLocales = parseLocales(parsed.data.supportedLocales)

  if (!supportedLocales.includes(parsed.data.defaultLocale)) {
    supportedLocales.unshift(parsed.data.defaultLocale)
  }

  const hostnames = [
    ...parseHostnameList(parsed.data.primaryHostname),
    ...parseHostnameList(parsed.data.additionalHostnames),
  ]

  try {
    await db.transaction(async (tx) => {
      const [site] = await tx
        .insert(sites)
        .values({
          name: parsed.data.name,
          slug: parsed.data.slug,
          defaultLocale: parsed.data.defaultLocale,
          supportedLocales,
          niche: parsed.data.niche,
          toneGuide: parsed.data.toneGuide,
          editorialGuidelines: parsed.data.editorialGuidelines,
          adsensePolicyNotes: parsed.data.adsensePolicyNotes,
          prohibitedTopics: parseList(parsed.data.prohibitedTopics),
          requiredSections: parseList(parsed.data.requiredSections),
          reviewChecklist: parseList(parsed.data.reviewChecklist),
          topicLabelOverrides: parseTopicLabelOverrides(parsed.data.topicLabelOverrides),
          featuredNavLabel: parsed.data.featuredNavLabel?.trim() || null,
          allNavLabel: parsed.data.allNavLabel?.trim() || null,
          navTopicSlugs: parseList(parsed.data.navTopicSlugs).map((slug) => slug.toLowerCase()),
          authBrandName: parsed.data.authBrandName?.trim() || null,
          googleClientId: parsed.data.googleClientId?.trim() || null,
          adsensePublisherId: parsed.data.adsensePublisherId?.trim() || null,
          adsenseSlotId: parsed.data.adsenseSlotId?.trim() || null,
          themePreset: parsed.data.themePreset,
          homepageLayout: parsed.data.homepageLayout,
          articleLayout: parsed.data.articleLayout,
          themePrimary: parsed.data.themePrimary || null,
          themeAccent: parsed.data.themeAccent || null,
          themeBackground: parsed.data.themeBackground || null,
          createdByAdminId: session.id,
        })
        .returning({ id: sites.id })

      if (hostnames.length > 0) {
        await tx.insert(siteDomains).values(
          hostnames.map((hostname, index) => ({
            siteId: site.id,
            hostname,
            isPrimary: index === 0,
          })),
        )
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create site.'
    if (message.includes('sites_slug_idx')) return { error: 'This slug is already in use.' }
    if (message.includes('site_domains_hostname_idx')) return { error: 'This hostname is already connected to another site.' }
    return { error: message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/sites')
  revalidatePath('/')
  revalidatePath(`/${parsed.data.slug}`)

  return { error: undefined }
}

export async function updateSiteAction(
  siteId: string,
  _: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await requireAdminSession()
  requirePlatformAdminRole(session)

  const parsed = createSiteSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    defaultLocale: formData.get('defaultLocale'),
    supportedLocales: formData.get('supportedLocales'),
    niche: formData.get('niche') || undefined,
    toneGuide: formData.get('toneGuide') || undefined,
    editorialGuidelines: formData.get('editorialGuidelines') || undefined,
    adsensePolicyNotes: formData.get('adsensePolicyNotes') || undefined,
    prohibitedTopics: formData.get('prohibitedTopics') || undefined,
    requiredSections: formData.get('requiredSections') || undefined,
    reviewChecklist: formData.get('reviewChecklist') || undefined,
    topicLabelOverrides: formData.get('topicLabelOverrides') || undefined,
    featuredNavLabel: formData.get('featuredNavLabel') || undefined,
    allNavLabel: formData.get('allNavLabel') || undefined,
    navTopicSlugs: formData.get('navTopicSlugs') || undefined,
    authBrandName: formData.get('authBrandName') || undefined,
    googleClientId: formData.get('googleClientId') || undefined,
    adsensePublisherId: formData.get('adsensePublisherId') || undefined,
    adsenseSlotId: formData.get('adsenseSlotId') || undefined,
    primaryHostname: formData.get('primaryHostname') || undefined,
    additionalHostnames: formData.get('additionalHostnames') || undefined,
    themePreset: formData.get('themePreset'),
    homepageLayout: formData.get('homepageLayout'),
    articleLayout: formData.get('articleLayout'),
    themePrimary: formData.get('themePrimary') || undefined,
    themeAccent: formData.get('themeAccent') || undefined,
    themeBackground: formData.get('themeBackground') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form fields and try again.' }
  }

  const supportedLocales = parseLocales(parsed.data.supportedLocales)
  if (!supportedLocales.includes(parsed.data.defaultLocale)) {
    supportedLocales.unshift(parsed.data.defaultLocale)
  }
  const hostnames = [
    ...parseHostnameList(parsed.data.primaryHostname),
    ...parseHostnameList(parsed.data.additionalHostnames),
  ]

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(sites)
        .set({
          name: parsed.data.name,
          slug: parsed.data.slug,
          defaultLocale: parsed.data.defaultLocale,
          supportedLocales,
          niche: parsed.data.niche,
          toneGuide: parsed.data.toneGuide,
          editorialGuidelines: parsed.data.editorialGuidelines,
          adsensePolicyNotes: parsed.data.adsensePolicyNotes,
          prohibitedTopics: parseList(parsed.data.prohibitedTopics),
          requiredSections: parseList(parsed.data.requiredSections),
          reviewChecklist: parseList(parsed.data.reviewChecklist),
          topicLabelOverrides: parseTopicLabelOverrides(parsed.data.topicLabelOverrides),
          featuredNavLabel: parsed.data.featuredNavLabel?.trim() || null,
          allNavLabel: parsed.data.allNavLabel?.trim() || null,
          navTopicSlugs: parseList(parsed.data.navTopicSlugs).map((slug) => slug.toLowerCase()),
          authBrandName: parsed.data.authBrandName?.trim() || null,
          googleClientId: parsed.data.googleClientId?.trim() || null,
          adsensePublisherId: parsed.data.adsensePublisherId?.trim() || null,
          adsenseSlotId: parsed.data.adsenseSlotId?.trim() || null,
          themePreset: parsed.data.themePreset,
          homepageLayout: parsed.data.homepageLayout,
          articleLayout: parsed.data.articleLayout,
          themePrimary: parsed.data.themePrimary || null,
          themeAccent: parsed.data.themeAccent || null,
          themeBackground: parsed.data.themeBackground || null,
          updatedAt: new Date(),
        })
        .where(eq(sites.id, siteId))

      await tx.delete(siteDomains).where(eq(siteDomains.siteId, siteId))

      if (hostnames.length > 0) {
        await tx.insert(siteDomains).values(
          hostnames.map((hostname, index) => ({
            siteId,
            hostname,
            isPrimary: index === 0,
          })),
        )
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update site.'
    if (message.includes('sites_slug_idx')) return { error: 'This slug is already in use.' }
    if (message.includes('site_domains_hostname_idx')) return { error: 'This hostname is already connected to another site.' }
    return { error: message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/sites')
  revalidatePath(`/admin/sites/${siteId}`)
  revalidatePath('/')
  revalidatePath(`/${parsed.data.slug}`)
  revalidatePath(`/topics`)
  revalidatePath(`/${parsed.data.slug}/topics`)

  return { error: undefined }
}

// ---------------------------------------------------------------------------
// Quick site creation — only name + niche + locales, AI fills the rest
// ---------------------------------------------------------------------------

async function generateSiteConfig(name: string, niche: string, locales: string[]): Promise<{
  slug: string
  toneGuide: string
  editorialGuidelines: string
  adsensePolicyNotes: string
  prohibitedTopics: string[]
  requiredSections: string[]
  reviewChecklist: string[]
}> {
  if (!env.OPENAI_API_KEY) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return {
      slug,
      toneGuide: 'Clear, factual, and reader-friendly.',
      editorialGuidelines: 'Prioritize accuracy and source attribution.',
      adsensePolicyNotes: 'Avoid clickbait, misleading claims, and sensitive topics without proper context.',
      prohibitedTopics: ['misinformation', 'hate speech'],
      requiredSections: ['Summary', 'Context', 'What to watch'],
      reviewChecklist: ['verify source attribution', 'confirm headline accuracy', 'confirm AdSense-safe page quality'],
    }
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.OPENAI_TEXT_MODEL ?? 'gpt-4o-mini',
      input: [
        {
          role: 'developer',
          content: [{ type: 'input_text', text: 'You configure editorial publishing sites. Output only JSON matching the provided schema. Be concise and practical. All content must be in English.' }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: JSON.stringify({ siteName: name, niche, languages: locales }) }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'site_config',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['slug', 'toneGuide', 'editorialGuidelines', 'adsensePolicyNotes', 'prohibitedTopics', 'requiredSections', 'reviewChecklist'],
            properties: {
              slug: { type: 'string', description: 'URL-safe lowercase slug using only letters, numbers, hyphens' },
              toneGuide: { type: 'string', description: '1-2 sentence tone description' },
              editorialGuidelines: { type: 'string', description: '2-4 sentence editorial guidelines' },
              adsensePolicyNotes: { type: 'string', description: '1-3 sentence AdSense compliance notes' },
              prohibitedTopics: { type: 'array', items: { type: 'string' } },
              requiredSections: { type: 'array', items: { type: 'string' } },
              reviewChecklist: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI config generation failed: ${response.status}`)
  }

  const json = await response.json() as Record<string, unknown>
  const output = Array.isArray(json.output) ? json.output : []
  let text = ''
  for (const item of output) {
    for (const part of (item as { content?: Array<{ text?: string }> }).content ?? []) {
      if (part.text) text += part.text
    }
  }

  return JSON.parse(text)
}

export async function quickCreateSiteAction(_: { error?: string } | undefined, formData: FormData) {
  const session = await requireAdminSession()
  requirePlatformAdminRole(session)

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const niche = (formData.get('niche') as string | null)?.trim() ?? ''
  const localesRaw = (formData.get('supportedLocales') as string | null) ?? 'en'
  const defaultLocale = (formData.get('defaultLocale') as string | null)?.trim() ?? 'en'

  if (!name || name.length < 2) return { error: 'Site adı en az 2 karakter olmalı.' }

  const supportedLocales = Array.from(new Set(
    localesRaw.split(',').map((l) => l.trim()).filter(Boolean)
  ))
  if (!supportedLocales.includes(defaultLocale)) supportedLocales.unshift(defaultLocale)

  let config: Awaited<ReturnType<typeof generateSiteConfig>>
  try {
    config = await generateSiteConfig(name, niche, supportedLocales)
  } catch {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    config = {
      slug,
      toneGuide: '',
      editorialGuidelines: '',
      adsensePolicyNotes: '',
      prohibitedTopics: [],
      requiredSections: ['Summary', 'Context', 'What to watch'],
      reviewChecklist: ['verify source attribution', 'confirm headline accuracy'],
    }
  }

  let siteId: string
  try {
    const [site] = await db
      .insert(sites)
      .values({
        name,
        slug: config.slug,
        defaultLocale,
        supportedLocales,
        niche: niche || null,
        toneGuide: config.toneGuide,
        editorialGuidelines: config.editorialGuidelines,
        adsensePolicyNotes: config.adsensePolicyNotes,
        prohibitedTopics: config.prohibitedTopics,
        requiredSections: config.requiredSections,
        reviewChecklist: config.reviewChecklist,
        createdByAdminId: session.id,
      })
      .returning({ id: sites.id })

    siteId = site.id
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create site.'
    if (message.includes('sites_slug_idx')) return { error: 'Bu slug zaten kullanımda, site adını biraz değiştirin.' }
    return { error: message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/sites')
  revalidatePath('/')

  redirect(`/admin/sites/${siteId}`)
}

export async function generateSiteRulesAction(
  name: string,
  niche: string,
  locales: string[],
): Promise<{
  error?: string
  toneGuide?: string
  editorialGuidelines?: string
  adsensePolicyNotes?: string
  prohibitedTopics?: string[]
  requiredSections?: string[]
  reviewChecklist?: string[]
}> {
  await requireAdminSession()

  if (!name || name.length < 2) return { error: 'Site name is required.' }

  try {
    const config = await generateSiteConfig(name, niche || name, locales.length > 0 ? locales : ['en'])
    return {
      toneGuide: config.toneGuide,
      editorialGuidelines: config.editorialGuidelines,
      adsensePolicyNotes: config.adsensePolicyNotes,
      prohibitedTopics: config.prohibitedTopics,
      requiredSections: config.requiredSections,
      reviewChecklist: config.reviewChecklist,
    }
  } catch {
    return { error: 'AI rule generation failed. Check your OpenAI key and try again.' }
  }
}
