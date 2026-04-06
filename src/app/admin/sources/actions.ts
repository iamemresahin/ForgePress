'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { requireAdminSession, requireEditorOrAbove } from '@/lib/auth'
import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'

const sourceSchema = z.object({
  siteId: z.string().uuid(),
  label: z.string().min(3).max(160),
  type: z.enum(['rss', 'sitemap', 'manual_url', 'custom_feed']),
  url: z.string().url(),
  locale: z.string().min(2).max(16),
  pollMinutes: z.coerce.number().int().min(1).max(10080),
  isActive: z.enum(['true', 'false']),
})

function normalizeSourceInput(formData: FormData) {
  return sourceSchema.safeParse({
    siteId: formData.get('siteId'),
    label: formData.get('label'),
    type: formData.get('type'),
    url: formData.get('url'),
    locale: formData.get('locale'),
    pollMinutes: formData.get('pollMinutes'),
    isActive: formData.get('isActive'),
  })
}

export async function createSourceAction(_: { error?: string } | undefined, formData: FormData) {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  const parsed = normalizeSourceInput(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the source form and try again.' }
  }

  await db.insert(sources).values({
    siteId: parsed.data.siteId,
    label: parsed.data.label,
    type: parsed.data.type,
    url: parsed.data.url,
    locale: parsed.data.locale,
    pollMinutes: parsed.data.pollMinutes,
    isActive: parsed.data.isActive === 'true',
  })

  revalidatePath('/admin/sources')
  return { error: undefined }
}

export async function updateSourceAction(
  sourceId: string,
  _: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  const parsed = normalizeSourceInput(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the source form and try again.' }
  }

  await db
    .update(sources)
    .set({
      siteId: parsed.data.siteId,
      label: parsed.data.label,
      type: parsed.data.type,
      url: parsed.data.url,
      locale: parsed.data.locale,
      pollMinutes: parsed.data.pollMinutes,
      isActive: parsed.data.isActive === 'true',
    })
    .where(eq(sources.id, sourceId))

  revalidatePath('/admin/sources')
  revalidatePath(`/admin/sources/${sourceId}`)
  return { error: undefined }
}

export async function deleteSourceAction(sourceId: string) {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  await db.delete(sources).where(eq(sources.id, sourceId))

  revalidatePath('/admin/sources')
}
