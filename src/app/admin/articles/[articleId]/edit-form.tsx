'use client'

import { ArticleForm } from '../article-form'

type SiteOption = {
  id: string
  name: string
  defaultLocale: string
}

type ArticleValues = {
  siteId: string
  locale: string
  canonicalTopic: string
  title: string
  slug: string
  sourceUrl: string
  excerpt: string
  body: string
  seoTitle: string
  seoDescription: string
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'rejected'
}

export function EditArticleForm({
  articleId,
  siteOptions,
  initialValues,
  action,
}: {
  articleId: string
  siteOptions: SiteOption[]
  initialValues: ArticleValues
  action: (
    articleId: string,
    state: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>
}) {
  return (
    <ArticleForm
      submitLabel="Save article changes"
      description="Update body copy, SEO metadata, status, and publishing context from the same editing surface."
      siteOptions={siteOptions}
      initialValues={initialValues}
      action={action.bind(null, articleId)}
    />
  )
}
