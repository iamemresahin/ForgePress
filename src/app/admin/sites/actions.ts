'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { requireAdminSession, requirePlatformAdminRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'

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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form fields and try again.' }
  }

  const supportedLocales = parseLocales(parsed.data.supportedLocales)

  if (!supportedLocales.includes(parsed.data.defaultLocale)) {
    supportedLocales.unshift(parsed.data.defaultLocale)
  }

  try {
    await db.insert(sites).values({
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
      createdByAdminId: session.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create site.'
    return { error: message.includes('sites_slug_idx') ? 'This slug is already in use.' : message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/sites')

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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form fields and try again.' }
  }

  const supportedLocales = parseLocales(parsed.data.supportedLocales)
  if (!supportedLocales.includes(parsed.data.defaultLocale)) {
    supportedLocales.unshift(parsed.data.defaultLocale)
  }

  try {
    await db
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
        updatedAt: new Date(),
      })
      .where(eq(sites.id, siteId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update site.'
    return { error: message.includes('sites_slug_idx') ? 'This slug is already in use.' : message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/sites')
  revalidatePath(`/admin/sites/${siteId}`)

  return { error: undefined }
}
