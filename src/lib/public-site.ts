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
        topicLabelOverrides: sites.topicLabelOverrides,
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

export type DerivedTopic = {
  slug: string
  label: string
  articles: PublicArticleSummary[]
}

const TOPIC_RULES: Array<{ slug: string; label: string; pattern: RegExp }> = [
  { slug: 'ai', label: 'AI', pattern: /\b(ai|agent|agents|gpt|llm|model|models|prompt|prompts)\b/i },
  { slug: 'tools', label: 'Tools', pattern: /\b(tool|tools|stack|stacks|workflow|workflows|automation|automations)\b/i },
  { slug: 'startups', label: 'Startups', pattern: /\b(startup|startups|founder|founders|funding|launch|launched)\b/i },
  { slug: 'development', label: 'Development', pattern: /\b(dev|developer|developers|build|builder|builders|code|coding|software)\b/i },
  { slug: 'design', label: 'Design', pattern: /\b(design|designer|designers|ui|ux|brand|branding)\b/i },
  { slug: 'technology', label: 'Technology', pattern: /\b(tech|technology|platform|platforms|product|products)\b/i },
]

export function deriveTopicForArticle(
  article: Pick<PublicArticleSummary, 'title' | 'excerpt'>,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  const haystack = `${article.title} ${article.excerpt ?? ''} ${siteNiche ?? ''}`.trim()

  for (const topic of TOPIC_RULES) {
    if (topic.pattern.test(haystack)) {
      return {
        slug: topic.slug,
        label: topicLabelOverrides?.[topic.slug] ?? topic.label,
      }
    }
  }

  return { slug: 'latest', label: topicLabelOverrides?.latest ?? 'Latest' }
}

export function buildDerivedTopics(
  articles: PublicArticleSummary[],
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  const groups = new Map<string, DerivedTopic>()

  for (const article of articles) {
    const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides)
    const current = groups.get(topic.slug)

    if (current) {
      current.articles.push(article)
      continue
    }

    groups.set(topic.slug, {
      slug: topic.slug,
      label: topic.label,
      articles: [article],
    })
  }

  return Array.from(groups.values())
    .filter((topic) => topic.articles.length > 0)
    .sort((left, right) => right.articles.length - left.articles.length)
}

export function getDerivedTopicBySlug(
  articles: PublicArticleSummary[],
  topicSlug: string,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  return (
    buildDerivedTopics(articles, siteNiche, topicLabelOverrides).find((topic) => topic.slug === topicSlug) ??
    null
  )
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
      topicLabelOverrides: sites.topicLabelOverrides,
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

export type PublicArticleDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedArticleBySiteAndSlug>>
>
