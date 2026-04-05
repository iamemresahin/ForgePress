'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  clearPublicReaderSession,
  getPublicReaderSession,
} from '@/lib/auth'
import { db } from '@/lib/db'
import { articleComments } from '@/lib/db/schema'

const commentSchema = z.object({
  articleId: z.string().uuid(),
  siteId: z.string().uuid(),
  body: z.string().min(3).max(2000),
  redirectPath: z.string().min(1),
})

const ownCommentSchema = z.object({
  commentId: z.string().uuid(),
  siteId: z.string().uuid(),
  redirectPath: z.string().min(1),
})

const ownCommentUpdateSchema = ownCommentSchema.extend({
  body: z.string().min(3).max(2000),
})

export async function submitCommentAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = commentSchema.safeParse({
    articleId: formData.get('articleId'),
    siteId: formData.get('siteId'),
    body: formData.get('body'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success) {
    return { error: 'Write a longer comment before posting.' }
  }

  const session = await getPublicReaderSession(parsed.data.siteId)
  if (!session) {
    return { error: 'Sign in before posting a comment.' }
  }

  await db.insert(articleComments).values({
    articleId: parsed.data.articleId,
    siteId: parsed.data.siteId,
    memberId: session.id,
    body: parsed.data.body.trim(),
  })

  revalidatePath(parsed.data.redirectPath)

  return { success: 'Your comment is live.' }
}

export async function updateOwnCommentAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = ownCommentUpdateSchema.safeParse({
    commentId: formData.get('commentId'),
    siteId: formData.get('siteId'),
    body: formData.get('body'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success) {
    return { error: 'Write a longer comment before saving.' }
  }

  const session = await getPublicReaderSession(parsed.data.siteId)
  if (!session) {
    return { error: 'Sign in before editing your comment.' }
  }

  const [comment] = await db
    .select({
      id: articleComments.id,
      memberId: articleComments.memberId,
    })
    .from(articleComments)
    .where(eq(articleComments.id, parsed.data.commentId))
    .limit(1)

  if (!comment || comment.memberId !== session.id) {
    return { error: 'You can only edit your own comment.' }
  }

  await db
    .update(articleComments)
    .set({
      body: parsed.data.body.trim(),
      updatedAt: new Date(),
    })
    .where(eq(articleComments.id, parsed.data.commentId))

  revalidatePath(parsed.data.redirectPath)

  return { success: 'Your comment has been updated.' }
}

const signOutSchema = z.object({
  siteId: z.string().uuid(),
  redirectPath: z.string().min(1),
})

export async function signOutPublicReaderAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = signOutSchema.safeParse({
    siteId: formData.get('siteId'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success) {
    return { error: 'Could not sign out of this reader session.' }
  }

  await clearPublicReaderSession(parsed.data.siteId)
  revalidatePath(parsed.data.redirectPath)

  return { success: 'Signed out successfully.' }
}

export async function deleteOwnCommentAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = ownCommentSchema.safeParse({
    commentId: formData.get('commentId'),
    siteId: formData.get('siteId'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success) {
    return { error: 'Comment deletion request is invalid.' }
  }

  const session = await getPublicReaderSession(parsed.data.siteId)
  if (!session) {
    return { error: 'Sign in before deleting your comment.' }
  }

  const [comment] = await db
    .select({
      id: articleComments.id,
      memberId: articleComments.memberId,
    })
    .from(articleComments)
    .where(eq(articleComments.id, parsed.data.commentId))
    .limit(1)

  if (!comment || comment.memberId !== session.id) {
    return { error: 'You can only delete your own comment.' }
  }

  await db.delete(articleComments).where(eq(articleComments.id, parsed.data.commentId))
  revalidatePath(parsed.data.redirectPath)

  return { success: 'Your comment has been deleted.' }
}
