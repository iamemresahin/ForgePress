'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { generateArticleDraft } from '@/lib/openai'
import { publishArticle } from '@/lib/publishing'

const articleSchema = z.object({
  siteId: z.string().uuid(),
  locale: z.string().min(2).max(16),
  canonicalTopic: z.string().min(3).max(255),
  title: z.string().min(3).max(255),
  slug: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens only.'),
  sourceUrl: z.string().url().optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(40),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'rejected']),
})

const assistedDraftSchema = z.object({
  siteId: z.string().uuid(),
  locale: z.string().min(2).max(16),
  canonicalTopic: z.string().min(3).max(255),
  sourceUrl: z.string().url().optional(),
  sourceNotes: z.string().max(4000).optional(),
})

function normalizeArticleInput(formData: FormData) {
  return articleSchema.safeParse({
    siteId: formData.get('siteId'),
    locale: formData.get('locale'),
    canonicalTopic: formData.get('canonicalTopic'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    sourceUrl: formData.get('sourceUrl') || undefined,
    excerpt: formData.get('excerpt') || undefined,
    body: formData.get('body'),
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    status: formData.get('status'),
  })
}

export async function createArticleAction(_: { error?: string } | undefined, formData: FormData) {
  await requireAdminSession()

  const parsed = normalizeArticleInput(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the article form and try again.' }
  }

  const article = parsed.data

  const [createdArticle] = await db
    .insert(articles)
    .values({
      siteId: article.siteId,
      canonicalTopic: article.canonicalTopic,
      sourceUrl: article.sourceUrl,
      status: article.status,
    })
    .returning()

  await db.insert(articleLocalizations).values({
    articleId: createdArticle.id,
    locale: article.locale,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    body: article.body,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
  })

  revalidatePath('/admin/articles')
  revalidatePath(`/admin/articles/${createdArticle.id}`)

  return { error: undefined }
}

export async function updateArticleAction(
  articleId: string,
  _: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession()

  const parsed = normalizeArticleInput(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the article form and try again.' }
  }

  const article = parsed.data

  await db
    .update(articles)
    .set({
      siteId: article.siteId,
      canonicalTopic: article.canonicalTopic,
      sourceUrl: article.sourceUrl,
      status: article.status,
      updatedAt: new Date(),
      publishedAt: article.status === 'published' ? new Date() : null,
    })
    .where(eq(articles.id, articleId))

  await db
    .update(articleLocalizations)
    .set({
      locale: article.locale,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      updatedAt: new Date(),
    })
    .where(eq(articleLocalizations.articleId, articleId))

  revalidatePath('/admin/articles')
  revalidatePath(`/admin/articles/${articleId}`)

  return { error: undefined }
}

export async function createAssistedDraftAction(
  _: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession()

  const parsed = assistedDraftSchema.safeParse({
    siteId: formData.get('siteId'),
    locale: formData.get('locale'),
    canonicalTopic: formData.get('canonicalTopic'),
    sourceUrl: formData.get('sourceUrl') || undefined,
    sourceNotes: formData.get('sourceNotes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the assisted draft fields and try again.' }
  }

  const [site] = await db.select().from(sites).where(eq(sites.id, parsed.data.siteId)).limit(1)
  if (!site) {
    return { error: 'Selected site could not be found.' }
  }

  let draft

  try {
    draft = await generateArticleDraft({
      siteName: site.name,
      locale: parsed.data.locale,
      canonicalTopic: parsed.data.canonicalTopic,
      toneGuide: site.toneGuide,
      editorialGuidelines: site.editorialGuidelines,
      adsensePolicyNotes: site.adsensePolicyNotes,
      prohibitedTopics: site.prohibitedTopics,
      requiredSections: site.requiredSections,
      reviewChecklist: site.reviewChecklist,
      niche: site.niche,
      sourceUrl: parsed.data.sourceUrl,
      sourceNotes: parsed.data.sourceNotes,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'OpenAI draft generation failed.',
    }
  }

  const [createdArticle] = await db
    .insert(articles)
    .values({
      siteId: site.id,
      canonicalTopic: parsed.data.canonicalTopic,
      sourceUrl: parsed.data.sourceUrl,
      status: 'review',
      riskFlags: draft.moderation.flagged ? draft.moderation.categories : [],
    })
    .returning()

  await db.insert(articleLocalizations).values({
    articleId: createdArticle.id,
    locale: parsed.data.locale,
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    body: draft.body,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
  })

  revalidatePath('/admin/articles')
  revalidatePath(`/admin/articles/${createdArticle.id}`)

  return { error: undefined }
}

export async function publishArticleAction(articleId: string) {
  await requireAdminSession()

  const published = await publishArticle(articleId)

  revalidatePath('/admin/articles')
  revalidatePath(`/admin/articles/${articleId}`)
  revalidatePath(`/${published.siteSlug}`)
  revalidatePath(`/${published.siteSlug}/${published.slug}`)
}
