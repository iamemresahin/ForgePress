import { and, asc, desc, eq, isNotNull } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, siteDomains, sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

function getAppOrigin() {
  return env.APP_URL.replace(/\/$/, '')
}

export async function getPrimaryDomainForSite(siteId: string) {
  const [domain] = await db
    .select({ hostname: siteDomains.hostname })
    .from(siteDomains)
    .where(and(eq(siteDomains.siteId, siteId), eq(siteDomains.isPrimary, true)))
    .limit(1)

  return domain?.hostname ?? null
}

export async function getPublicOriginForSite(site: { id: string; slug: string }) {
  const primaryDomain = await getPrimaryDomainForSite(site.id)
  return primaryDomain ? `https://${primaryDomain}` : `${getAppOrigin()}/${site.slug}`
}

export async function findSiteByHostname(hostname: string) {
  const normalized = normalizeHostname(hostname)
  if (!normalized || isPlatformHost(normalized)) {
    return null
  }

  const candidateHostnames = Array.from(
    new Set([
      normalized,
      normalized.startsWith('www.') ? normalized.replace(/^www\./, '') : `www.${normalized}`,
    ]),
  )

  for (const candidate of candidateHostnames) {
    const [site] = await db
      .select({
        id: sites.id,
        name: sites.name,
        slug: sites.slug,
        defaultLocale: sites.defaultLocale,
        supportedLocales: sites.supportedLocales,
        niche: sites.niche,
        toneGuide: sites.toneGuide,
        themePreset: sites.themePreset,
        homepageLayout: sites.homepageLayout,
        articleLayout: sites.articleLayout,
        themePrimary: sites.themePrimary,
        themeAccent: sites.themeAccent,
        themeBackground: sites.themeBackground,
      })
      .from(siteDomains)
      .innerJoin(sites, eq(sites.id, siteDomains.siteId))
      .where(eq(siteDomains.hostname, candidate))
      .limit(1)

    if (site) {
      return site
    }
  }

  return null
}

export async function getPublishedArticlesForSite(siteId: string) {
  const publishedArticles = await db
    .select({
      id: articles.id,
      title: articleLocalizations.title,
      slug: articleLocalizations.slug,
      excerpt: articleLocalizations.excerpt,
      imageUrl: articleLocalizations.imageUrl,
      locale: articleLocalizations.locale,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .where(eq(articles.siteId, siteId))
    .orderBy(desc(articles.publishedAt), asc(articleLocalizations.locale))

  return publishedArticles.filter((article) => article.publishedAt)
}

export type PublicArticleSummary = Awaited<ReturnType<typeof getPublishedArticlesForSite>>[number]

export async function getSiteBySlug(siteSlug: string) {
  const [site] = await db
    .select({
      id: sites.id,
      name: sites.name,
      slug: sites.slug,
      defaultLocale: sites.defaultLocale,
      supportedLocales: sites.supportedLocales,
      niche: sites.niche,
      toneGuide: sites.toneGuide,
      themePreset: sites.themePreset,
      homepageLayout: sites.homepageLayout,
      articleLayout: sites.articleLayout,
      themePrimary: sites.themePrimary,
      themeAccent: sites.themeAccent,
      themeBackground: sites.themeBackground,
    })
    .from(sites)
    .where(eq(sites.slug, siteSlug))
    .limit(1)

  return site ?? null
}

export async function getPublishedArticleBySiteAndSlug(siteId: string, articleSlug: string) {
  const [article] = await db
    .select({
      id: articles.id,
      title: articleLocalizations.title,
      seoTitle: articleLocalizations.seoTitle,
      seoDescription: articleLocalizations.seoDescription,
      excerpt: articleLocalizations.excerpt,
      body: articleLocalizations.body,
      imageUrl: articleLocalizations.imageUrl,
      locale: articleLocalizations.locale,
      slug: articleLocalizations.slug,
      siteName: sites.name,
      siteSlug: sites.slug,
      sourceUrl: articles.sourceUrl,
      publishedAt: articles.publishedAt,
      status: articles.status,
      siteId: sites.id,
      themePreset: sites.themePreset,
      homepageLayout: sites.homepageLayout,
      articleLayout: sites.articleLayout,
      themePrimary: sites.themePrimary,
      themeAccent: sites.themeAccent,
      themeBackground: sites.themeBackground,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(
      and(
        eq(articles.siteId, siteId),
        eq(articleLocalizations.slug, articleSlug),
        eq(articles.status, 'published'),
        isNotNull(articles.publishedAt),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(1)

  if (!article) {
    return null
  }

  return article
}

export type PublicArticleDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedArticleBySiteAndSlug>>
>
