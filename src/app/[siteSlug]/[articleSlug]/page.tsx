import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

import { PublicArticlePage as PublicArticleSurface } from '@/components/public/public-article-page'
import { getPublicReaderSession } from '@/lib/auth'
import {
  getArticleLocalizations,
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

  const origin = await getPublicOriginForSite({ id: site.id, slug: site.slug })
  const canonicalUrl = `${origin}/${articleSlug}`

  // Build hreflang alternates from all localizations of this article
  const localizations = await getArticleLocalizations(article.id)
  const languageAlternates: Record<string, string> = {}
  for (const loc of localizations) {
    const locOrigin = await getPublicOriginForSite({ id: loc.siteId, slug: loc.siteSlug })
    languageAlternates[loc.locale] = `${locOrigin}/${loc.slug}`
  }
  if (localizations.length > 1) {
    languageAlternates['x-default'] = canonicalUrl
  }

  // JSON-LD NewsArticle schema
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? '',
    url: canonicalUrl,
    datePublished: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    dateModified: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    inLanguage: article.locale,
    image: article.imageUrl
      ? [{ '@type': 'ImageObject', url: article.imageUrl }]
      : undefined,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: site.name,
      url: origin,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? `${article.title} on ${site.name}`,
    alternates: {
      canonical: canonicalUrl,
      ...(Object.keys(languageAlternates).length > 0 && { languages: languageAlternates }),
    },
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? `${article.title} on ${site.name}`,
      url: canonicalUrl,
      siteName: site.name,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      ...(article.imageUrl && { images: [{ url: article.imageUrl }] }),
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

  const origin = await getPublicOriginForSite({ id: site.id, slug: site.slug })
  const canonicalUrl = `${origin}/${articleSlug}`

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? '',
    url: canonicalUrl,
    datePublished: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    dateModified: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    inLanguage: article.locale,
    ...(article.imageUrl && { image: [{ '@type': 'ImageObject', url: article.imageUrl }] }),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: site.name,
      url: origin,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      {article.adsensePublisherId && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${article.adsensePublisherId}`}
          crossOrigin="anonymous"
        />
      )}
      <PublicArticleSurface
        article={article}
        theme={resolveSiteTheme(article)}
        nextArticle={nextArticle}
        relatedArticles={relatedArticles}
        currentReader={currentReader}
        comments={comments}
      />
    </>
  )
}
