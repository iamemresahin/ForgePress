import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

import { PublicArticlePage as PublicArticleSurface } from '@/components/public/public-article-page'
import { getPublicReaderSession } from '@/lib/auth'
import {
  getCommentsForArticle,
  getRelatedArticles,
  getNextPublishedArticleForSite,
  getPublicOriginForSite,
  getPublishedArticleBySiteAndSlug,
  getPublishedArticlesForSite,
  getSiteBySlug,
} from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string; articleSlug: string }>
}) {
  const { siteSlug, articleSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    return {}
  }

  const site = await getSiteBySlug(siteSlug)
  if (!site) {
    return {}
  }

  const article = await getPublishedArticleBySiteAndSlug(site.id, articleSlug)
  if (!article) return {}

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? `${article.title} on ${site.name}`,
    alternates: {
      canonical: `${await getPublicOriginForSite({ id: site.id, slug: site.slug })}/${articleSlug}`,
    },
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? `${article.title} on ${site.name}`,
      url: `${await getPublicOriginForSite({ id: site.id, slug: site.slug })}/${articleSlug}`,
      siteName: site.name,
      type: 'article',
    },
  }
}

export default async function PublicArticleRoute({
  params,
}: {
  params: Promise<{ siteSlug: string; articleSlug: string }>
}) {
  const { siteSlug, articleSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    notFound()
  }

  const site = await getSiteBySlug(siteSlug)
  if (!site) {
    notFound()
  }

  const article = await getPublishedArticleBySiteAndSlug(site.id, articleSlug)
  if (!article) {
    notFound()
  }

  const nextArticle = await getNextPublishedArticleForSite(site.id, article.id)
  const publishedArticles = await getPublishedArticlesForSite(site.id)
  const currentReader = await getPublicReaderSession(site.id)
  const comments = await getCommentsForArticle(article.id, article.locale)
  const relatedArticles = getRelatedArticles(
    article,
    publishedArticles,
    site.niche,
    site.topicLabelOverrides,
    site.defaultLocale,
  )

  return (
    <PublicArticleSurface
      article={article}
      theme={resolveSiteTheme(article)}
      nextArticle={nextArticle}
      relatedArticles={relatedArticles}
      currentReader={currentReader}
      comments={comments}
    />
  )
}
