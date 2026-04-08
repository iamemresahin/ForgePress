import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'
import { getPublicReaderSession } from '@/lib/auth'
import { PublicArticlePage } from '@/components/public/public-article-page'
import { PublicSiteHome } from '@/components/public/public-site-home'
import {
  getCommentsForArticle,
  findSiteByHostname,
  getRelatedArticles,
  getNextPublishedArticleForSite,
  getPublicOriginForSite,
  getPublishedArticleBySiteAndSlug,
  getPublishedArticlesForSite,
} from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string }>
}): Promise<Metadata> {
  const { siteSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)
    if (!site) return {}

    const article = await getPublishedArticleBySiteAndSlug(site.id, siteSlug)
    if (!article) return {}

    const canonical = `https://${hostname}/${siteSlug}`

    return {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? `${article.title} on ${site.name}`,
      alternates: {
        canonical,
      },
      openGraph: {
        title: article.seoTitle ?? article.title,
        description: article.seoDescription ?? `${article.title} on ${site.name}`,
        url: canonical,
        siteName: site.name,
        type: 'article',
      },
    }
  }

  const [site] = await db.select().from(sites).where(eq(sites.slug, siteSlug)).limit(1)
  if (!site) return {}

  const origin = await getPublicOriginForSite(site)
  const canonical = origin.startsWith('http') ? origin : `https://${origin}`

  return {
    title: site.name,
    description: site.niche ?? `${site.name} publishing surface`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: site.name,
      description: site.niche ?? `${site.name} publishing surface`,
      url: canonical,
      siteName: site.name,
      type: 'website',
    },
  }
}

export default async function PublicSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { siteSlug } = await params
  const { lang } = await searchParams
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)
    if (!site) {
      notFound()
    }

    const article = await getPublishedArticleBySiteAndSlug(site.id, siteSlug)
    if (!article) {
      notFound()
    }

    const nextArticle = await getNextPublishedArticleForSite(site.id, article.id)
    const publishedArticles = await getPublishedArticlesForSite(site.id, 12)
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
      <PublicArticlePage
        article={article}
        theme={resolveSiteTheme(article)}
        useHostRouting
        nextArticle={nextArticle}
        relatedArticles={relatedArticles}
        currentReader={currentReader}
        comments={comments}
      />
    )
  }

  const [site] = await db.select().from(sites).where(eq(sites.slug, siteSlug)).limit(1)

  if (!site) {
    notFound()
  }

  const theme = resolveSiteTheme(site)
  const articles = await getPublishedArticlesForSite(site.id, 12)
  const currentReader = await getPublicReaderSession(site.id)

  return <PublicSiteHome site={site} theme={theme} articles={articles} currentReader={currentReader} activeLocale={lang ?? null} />
}
