'use server'

import { revalidatePath } from 'next/cache'
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
