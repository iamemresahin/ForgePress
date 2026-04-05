'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleComments } from '@/lib/db/schema'

const moderationSchema = z.object({
  commentId: z.string().uuid(),
  approved: z.enum(['true', 'false']),
  publicPath: z.string().min(1).optional(),
  hostPath: z.string().min(1).optional(),
})

const deleteSchema = z.object({
  commentId: z.string().uuid(),
  publicPath: z.string().min(1).optional(),
  hostPath: z.string().min(1).optional(),
})

async function revalidateCommentSurfaces(publicPath?: string, hostPath?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
  if (publicPath) revalidatePath(publicPath)
  if (hostPath) revalidatePath(hostPath)
}

export async function setCommentApprovalAction(formData: FormData) {
  await requireAdminSession()

  const parsed = moderationSchema.safeParse({
    commentId: formData.get('commentId'),
    approved: formData.get('approved'),
    publicPath: formData.get('publicPath'),
    hostPath: formData.get('hostPath'),
  })

  if (!parsed.success) {
    throw new Error('Comment moderation request is invalid.')
  }

  await db
    .update(articleComments)
    .set({
      isApproved: parsed.data.approved === 'true',
      updatedAt: new Date(),
    })
    .where(eq(articleComments.id, parsed.data.commentId))

  await revalidateCommentSurfaces(parsed.data.publicPath, parsed.data.hostPath)

}

export async function deleteCommentAction(formData: FormData) {
  await requireAdminSession()

  const parsed = deleteSchema.safeParse({
    commentId: formData.get('commentId'),
    publicPath: formData.get('publicPath'),
    hostPath: formData.get('hostPath'),
  })

  if (!parsed.success) {
    throw new Error('Comment deletion request is invalid.')
  }

  await db.delete(articleComments).where(eq(articleComments.id, parsed.data.commentId))
  await revalidateCommentSurfaces(parsed.data.publicPath, parsed.data.hostPath)

}
