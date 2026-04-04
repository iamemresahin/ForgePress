'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { getQueue } from '@/lib/queue'

const createJobSchema = z.object({
  siteId: z.string().uuid(),
  kind: z.enum(['ingestion', 'rewrite', 'localization', 'image', 'publish']),
})

export async function createJobAction(_: { error?: string } | undefined, formData: FormData) {
  await requireAdminSession()

  const parsed = createJobSchema.safeParse({
    siteId: formData.get('siteId'),
    kind: formData.get('kind'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the job form and try again.' }
  }

  const payload = {
    siteId: parsed.data.siteId,
    requestedAt: new Date().toISOString(),
    trigger: 'admin_manual',
  }

  const [jobRecord] = await db
    .insert(jobs)
    .values({
      siteId: parsed.data.siteId,
      kind: parsed.data.kind,
      status: 'queued',
      payload,
    })
    .returning()

  try {
    await getQueue('forgepress-jobs').add(parsed.data.kind, {
      id: jobRecord.id,
      ...payload,
    })
  } catch (error) {
    await db
      .update(jobs)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Queue enqueue failed.',
        finishedAt: new Date(),
      })
      .where(eq(jobs.id, jobRecord.id))

    return { error: 'Job record was created, but the queue backend could not accept the task.' }
  }

  revalidatePath('/admin/jobs')
  return { error: undefined }
}
