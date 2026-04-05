'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

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
