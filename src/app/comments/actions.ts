'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  authenticateSiteMember,
  createPublicReaderSession,
  getPublicReaderSession,
  registerSiteMember,
} from '@/lib/auth'
import { db } from '@/lib/db'
import { articleComments } from '@/lib/db/schema'

const authSchema = z.object({
  siteId: z.string().uuid(),
  siteName: z.string().min(1).max(160),
  displayName: z.string().min(2).max(160).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  redirectPath: z.string().min(1),
})

const commentSchema = z.object({
  articleId: z.string().uuid(),
  siteId: z.string().uuid(),
  body: z.string().min(3).max(2000),
  redirectPath: z.string().min(1),
})

export async function publicReaderSignInAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = authSchema.safeParse({
    siteId: formData.get('siteId'),
    siteName: formData.get('siteName'),
    email: formData.get('email'),
    password: formData.get('password'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success) {
    return { error: 'Enter a valid email and password.' }
  }

  const member = await authenticateSiteMember(
    parsed.data.siteId,
    parsed.data.email,
    parsed.data.password,
  )

  if (!member) {
    return { error: 'Email or password is incorrect.' }
  }

  await createPublicReaderSession({
    id: member.id,
    email: member.email,
    displayName: member.displayName,
    siteId: member.siteId,
  })

  revalidatePath(parsed.data.redirectPath)

  return { success: `Signed in to ${parsed.data.siteName}.` }
}

export async function publicReaderSignUpAction(
  _: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  const parsed = authSchema.safeParse({
    siteId: formData.get('siteId'),
    siteName: formData.get('siteName'),
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    redirectPath: formData.get('redirectPath'),
  })

  if (!parsed.success || !parsed.data.displayName) {
    return { error: 'Enter a display name, email, and password.' }
  }

  const member = await registerSiteMember(
    parsed.data.siteId,
    parsed.data.displayName,
    parsed.data.email,
    parsed.data.password,
  )

  if (!member) {
    return { error: 'This email is already registered for this site.' }
  }

  await createPublicReaderSession({
    id: member.id,
    email: member.email,
    displayName: member.displayName,
    siteId: member.siteId,
  })

  revalidatePath(parsed.data.redirectPath)

  return { success: `Account created for ${parsed.data.siteName}.` }
}

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
