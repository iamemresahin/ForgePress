import { and, asc, desc, eq, ilike, isNotNull, lt, or } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleComments, articleLocalizations, articles, siteDomains, siteMembers, sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

export type {
  PublicArticleSummary,
  DerivedTopic,
} from '@/lib/public-site-utils'
export {
  estimateReadTimeMinutes,
  isTurkishLocale,
  getPublicCopy,
  formatFreshnessLabel,
  deriveTopicForArticle,
  buildEditorialImageDataUri,
  buildDerivedTopics,
  getTrendingArticles,
  getDerivedTopicBySlug,
} from '@/lib/public-site-utils'
import type { PublicArticleSummary, DerivedTopic } from '@/lib/public-site-utils'
import {
  estimateReadTimeMinutes,
  isTurkishLocale,
  deriveTopicForArticle,
} from '@/lib/public-site-utils'

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
        topicLabelOverrides: sites.topicLabelOverrides,
        featuredNavLabel: sites.featuredNavLabel,
        allNavLabel: sites.allNavLabel,
        navTopicSlugs: sites.navTopicSlugs,
        authBrandName: sites.authBrandName,
        googleClientId: sites.googleClientId,
        adsensePublisherId: sites.adsensePublisherId,
        adsenseSlotId: sites.adsenseSlotId,
        gtagId: sites.gtagId,
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

export async function getPublishedArticlesForSite(siteId: string, limit = 9999) {
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
    .limit(limit)

  return publishedArticles.filter((article) => article.publishedAt)
}

export async function getMorePublishedArticles(
  siteId: string,
  cursor: string, // ISO date string — publishedAt of last loaded article
  limit = 12,
) {
  const rows = await db
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
    .where(
      and(
        eq(articles.siteId, siteId),
        isNotNull(articles.publishedAt),
        lt(articles.publishedAt, new Date(cursor)),
      ),
    )
    .orderBy(desc(articles.publishedAt), asc(articleLocalizations.locale))
    .limit(limit)

  return rows.filter((r) => r.publishedAt)
}

export async function searchPublishedArticles(siteId: string, query: string, limit = 24) {
  const q = `%${query.trim()}%`
  const rows = await db
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
    .where(
      and(
        eq(articles.siteId, siteId),
        isNotNull(articles.publishedAt),
        or(
          ilike(articleLocalizations.title, q),
          ilike(articleLocalizations.excerpt, q),
        ),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  return rows.filter((r) => r.publishedAt)
}

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
      topicLabelOverrides: sites.topicLabelOverrides,
      featuredNavLabel: sites.featuredNavLabel,
      allNavLabel: sites.allNavLabel,
      navTopicSlugs: sites.navTopicSlugs,
      authBrandName: sites.authBrandName,
      googleClientId: sites.googleClientId,
      adsensePublisherId: sites.adsensePublisherId,
      adsenseSlotId: sites.adsenseSlotId,
      gtagId: sites.gtagId,
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
      videoUrl: articleLocalizations.videoUrl,
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
      topicLabelOverrides: sites.topicLabelOverrides,
      featuredNavLabel: sites.featuredNavLabel,
      allNavLabel: sites.allNavLabel,
      navTopicSlugs: sites.navTopicSlugs,
      authBrandName: sites.authBrandName,
      googleClientId: sites.googleClientId,
      adsensePublisherId: sites.adsensePublisherId,
      adsenseSlotId: sites.adsenseSlotId,
      gtagId: sites.gtagId,
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

export async function getNextPublishedArticleForSite(siteId: string, currentArticleId: string) {
  const publishedArticles = await getPublishedArticlesForSite(siteId)
  const currentIndex = publishedArticles.findIndex((article) => article.id === currentArticleId)

  if (currentIndex === -1) {
    return publishedArticles[0] ?? null
  }

  return publishedArticles[currentIndex + 1] ?? publishedArticles[0] ?? null
}

export function getRelatedArticles(
  currentArticle: Pick<PublicArticleDetail, 'id' | 'title' | 'excerpt'>,
  articles: PublicArticleSummary[],
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
  locale = 'en',
  limit = 3,
) {
  const currentTopic = deriveTopicForArticle(currentArticle, siteNiche, topicLabelOverrides, locale)

  return articles
    .filter((article) => article.id !== currentArticle.id)
    .sort((left, right) => {
      const leftTopic = deriveTopicForArticle(left, siteNiche, topicLabelOverrides, locale)
      const rightTopic = deriveTopicForArticle(right, siteNiche, topicLabelOverrides, locale)
      const leftTopicScore = leftTopic.slug === currentTopic.slug ? 2 : 0
      const rightTopicScore = rightTopic.slug === currentTopic.slug ? 2 : 0
      const leftDate = left.publishedAt?.getTime() ?? 0
      const rightDate = right.publishedAt?.getTime() ?? 0

      if (rightTopicScore !== leftTopicScore) {
        return rightTopicScore - leftTopicScore
      }

      return rightDate - leftDate
    })
    .slice(0, limit)
}

export type PublicArticleDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedArticleBySiteAndSlug>>
>

export async function getArticleLocalizations(articleId: string) {
  const rows = await db
    .select({
      locale: articleLocalizations.locale,
      slug: articleLocalizations.slug,
      siteId: articles.siteId,
      siteSlug: sites.slug,
    })
    .from(articleLocalizations)
    .innerJoin(articles, eq(articles.id, articleLocalizations.articleId))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(eq(articleLocalizations.articleId, articleId))

  return rows
}

export async function getPublishedArticlesForRssFeed(siteId: string, limit = 20) {
  const rows = await db
    .select({
      id: articles.id,
      title: articleLocalizations.title,
      slug: articleLocalizations.slug,
      excerpt: articleLocalizations.excerpt,
      body: articleLocalizations.body,
      locale: articleLocalizations.locale,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .where(and(eq(articles.siteId, siteId), eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)

  return rows.filter((r) => r.publishedAt)
}

export async function getCommentsForArticle(articleId: string, locale: string) {
  const comments = await db
    .select({
      id: articleComments.id,
      body: articleComments.body,
      memberId: articleComments.memberId,
      createdAt: articleComments.createdAt,
      displayName: siteMembers.displayName,
    })
    .from(articleComments)
    .innerJoin(siteMembers, eq(siteMembers.id, articleComments.memberId))
    .where(and(eq(articleComments.articleId, articleId), eq(articleComments.isApproved, true)))
    .orderBy(desc(articleComments.createdAt))

  return comments.map((comment) => ({
    ...comment,
    createdAtLabel: formatCommentDate(comment.createdAt, locale),
  }))
}

function formatCommentDate(date: Date, locale: string) {
  try {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return date.toLocaleDateString('en-US')
  }
}
