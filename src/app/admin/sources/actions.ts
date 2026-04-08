'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  redirect('/admin/sources')
}

export async function deleteSourceByIdAction(formData: FormData) {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  const sourceId = formData.get('sourceId') as string
  if (!sourceId) return

  await db.delete(sources).where(eq(sources.id, sourceId))
  revalidatePath('/admin/sources')
  redirect('/admin/sources')
}

export async function deleteSourceAction(sourceId: string) {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  await db.delete(sources).where(eq(sources.id, sourceId))

  revalidatePath('/admin/sources')
}

type BulkSourceRow = {
  label: string
  url: string
  type: 'rss' | 'sitemap' | 'manual_url' | 'custom_feed'
  locale: string
  pollMinutes: number
}

export async function bulkCreateSourcesAction(
  siteId: string,
  rows: BulkSourceRow[],
): Promise<{ imported: number; skipped: number; error?: string }> {
  const session = await requireAdminSession()
  requireEditorOrAbove(session)

  if (!siteId) return { imported: 0, skipped: 0, error: 'Site seçilmedi.' }
  if (!rows.length) return { imported: 0, skipped: 0, error: 'İçe aktarılacak satır yok.' }

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.label || !row.url) { skipped++; continue }
    try {
      new URL(row.url)
    } catch {
      skipped++
      continue
    }

    try {
      await db.insert(sources).values({
        siteId,
        label: row.label.slice(0, 160),
        type: row.type,
        url: row.url,
        locale: row.locale,
        pollMinutes: row.pollMinutes,
        isActive: true,
      })
      imported++
    } catch {
      skipped++
    }
  }

  revalidatePath('/admin/sources')
  return { imported, skipped }
}
