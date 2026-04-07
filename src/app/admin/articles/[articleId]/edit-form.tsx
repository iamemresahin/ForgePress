'use client'

import { ArticleForm } from '../article-form'
import type { InterfaceLocale } from '@/lib/interface-locale'

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
  videoUrl: string
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
  locale,
}: {
  articleId: string
  siteOptions: SiteOption[]
  initialValues: ArticleValues
  locale: InterfaceLocale
  action: (
    articleId: string,
    state: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>
}) {
  return (
    <ArticleForm
      locale={locale}
      submitLabel={locale === 'tr' ? 'Makale değişikliklerini kaydet' : 'Save article changes'}
      description={
        locale === 'tr'
          ? 'Gövde metnini, SEO metaverisini, durumu ve yayın bağlamını aynı düzenleme yüzeyinden güncelleyin.'
          : 'Update body copy, SEO metadata, status, and publishing context from the same editing surface.'
      }
      siteOptions={siteOptions}
      initialValues={initialValues}
      action={action.bind(null, articleId)}
    />
  )
}
