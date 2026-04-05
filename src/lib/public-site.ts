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
        featuredNavLabel: sites.featuredNavLabel,
        allNavLabel: sites.allNavLabel,
        navTopicSlugs: sites.navTopicSlugs,
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

export function estimateReadTimeMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 180))
}

export function isTurkishLocale(locale: string) {
  return locale.toLowerCase().startsWith('tr')
}

export function getPublicCopy(locale: string) {
  const tr = isTurkishLocale(locale)

  return {
    featured: tr ? 'Öne Çıkanlar' : 'Featured',
    all: tr ? 'Tümü' : 'All',
    otherCategories: tr ? 'Diğer Kategoriler' : 'More Categories',
    latestStories: tr ? 'Son Haberler' : 'Latest Stories',
    publishedStories: tr ? 'yayınlanmış haber' : 'published stories',
    newStoryAlert: tr ? '1 yeni haber okunmayı bekliyor' : '1 new story is waiting to be read',
    liveSurface: tr ? 'Canlı Yüzey' : 'Live Surface',
    publishFirstStory: tr
      ? 'İlk haberi admin panelinden yayınlayın; bu editoryal ön yüz otomatik dolacaktır.'
      : 'Publish the first story from the admin workspace and this editorial front page will populate automatically.',
    flowMode: tr ? 'Akış Modu' : 'Flow Mode',
    signIn: tr ? 'Giriş' : 'Sign in',
    signInToComment: tr ? 'Yorum yapmak için giriş yap' : 'Sign in to comment',
    comments: tr ? 'Yorumlar' : 'Comments',
    commentsLocked: tr
      ? 'Yazıya yorum bırakmak için oturum açmanız gerekiyor.'
      : 'You need to sign in before joining the discussion.',
    continueToLogin: tr ? 'Giriş sayfasına git' : 'Continue to login',
    backHome: tr ? 'Geri Dön' : 'Back',
    sourceContext: tr ? 'Kaynak Bağlamı' : 'Source Context',
    source: tr ? 'Kaynak' : 'Source',
    openOriginalCoverage: tr ? 'Orijinal haberi aç' : 'Open original coverage',
    sourceUnavailable: tr
      ? 'Bu haber için henüz harici kaynak bağlantısı yok.'
      : 'External source link is not available for this article yet.',
    relatedStories: tr ? 'İlgili Haberler' : 'Related Stories',
    keepReading: tr ? 'Okumaya devam et' : 'Keep reading',
    readStory: tr ? 'Haberi aç' : 'Read story',
    storyInfo: tr ? 'Haber Bilgisi' : 'Story Info',
    nextStory: tr ? 'Sonraki Haber' : 'Next Story',
    readNext: tr ? 'Sonrakini oku' : 'Read next',
  }
}

export function formatFreshnessLabel(date: Date | null) {
  if (!date) return 'Fresh'

  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24))
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return 'Archive'
}

export type PublicArticleSummary = Awaited<ReturnType<typeof getPublishedArticlesForSite>>[number]

export type DerivedTopic = {
  slug: string
  label: string
  articles: PublicArticleSummary[]
}

const TOPIC_RULES: Array<{ slug: string; label: { tr: string; en: string }; pattern: RegExp }> = [
  { slug: 'startups', label: { tr: 'Girişimler', en: 'Startups' }, pattern: /\b(startup|startups|founder|founders|funding|launch|launched)\b/i },
  { slug: 'tools', label: { tr: 'Araçlar', en: 'Tools' }, pattern: /\b(tool|tools|stack|stacks|workflow|workflows|automation|automations)\b/i },
  { slug: 'development', label: { tr: 'Geliştirme', en: 'Development' }, pattern: /\b(dev|developer|developers|build|builder|builders|code|coding|software)\b/i },
  { slug: 'design', label: { tr: 'Tasarım', en: 'Design' }, pattern: /\b(design|designer|designers|ui|ux|brand|branding)\b/i },
  { slug: 'technology', label: { tr: 'Teknoloji', en: 'Technology' }, pattern: /\b(tech|technology|platform|platforms|product|products)\b/i },
  { slug: 'ai', label: { tr: 'Yapay Zeka', en: 'AI' }, pattern: /\b(ai|agent|agents|gpt|llm|model|models|prompt|prompts)\b/i },
]

export function deriveTopicForArticle(
  article: Pick<PublicArticleSummary, 'title' | 'excerpt'>,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
  locale = 'en',
) {
  const tr = isTurkishLocale(locale)
  const haystack = `${article.title} ${article.excerpt ?? ''}`.trim()

  for (const topic of TOPIC_RULES) {
    if (topic.pattern.test(haystack)) {
      return {
        slug: topic.slug,
        label: topicLabelOverrides?.[topic.slug] ?? (tr ? topic.label.tr : topic.label.en),
      }
    }
  }

  return { slug: 'latest', label: topicLabelOverrides?.latest ?? (tr ? 'Son Haberler' : 'Latest') }
}

function hashString(input: string) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

const EDITORIAL_PALETTES = [
  { start: '#1d4ed8', end: '#0f172a', glow: '#38bdf8' },
  { start: '#0f766e', end: '#111827', glow: '#2dd4bf' },
  { start: '#7c3aed', end: '#111827', glow: '#a78bfa' },
  { start: '#ea580c', end: '#111827', glow: '#fb923c' },
  { start: '#be123c', end: '#111827', glow: '#fb7185' },
]

export function buildEditorialImageDataUri(
  article: Pick<PublicArticleSummary, 'title' | 'excerpt'>,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides)
  const hash = hashString(`${article.title}-${topic.slug}`)
  const palette = EDITORIAL_PALETTES[hash % EDITORIAL_PALETTES.length]
  const angle = hash % 360
  const accentX = 18 + (hash % 48)
  const accentY = 20 + (hash % 30)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-label="${article.title}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
        <radialGradient id="glow" cx="${accentX}%" cy="${accentY}%" r="48%">
          <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.72" />
          <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#bg)" />
      <rect width="1200" height="760" fill="url(#glow)" />
      <g opacity="0.18" transform="rotate(${angle} 600 380)">
        <rect x="810" y="-120" width="220" height="1040" rx="110" fill="#ffffff" />
        <rect x="930" y="-160" width="120" height="1080" rx="60" fill="#ffffff" />
      </g>
      <g opacity="0.14">
        <circle cx="170" cy="126" r="72" fill="#ffffff" />
        <circle cx="228" cy="182" r="14" fill="#ffffff" />
      </g>
      <g opacity="0.16">
        <rect x="78" y="590" width="240" height="12" rx="6" fill="#ffffff" />
        <rect x="78" y="620" width="170" height="12" rx="6" fill="#ffffff" />
      </g>
      <circle cx="1030" cy="116" r="84" fill="rgba(255,255,255,0.08)" />
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function buildDerivedTopics(
  articles: PublicArticleSummary[],
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
  locale = 'en',
) {
  const groups = new Map<string, DerivedTopic>()

  for (const article of articles) {
    const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides, locale)
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

function scoreArticleForTrending(
  article: PublicArticleSummary,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
      const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides)
  const readTime = estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''}`)
  const freshness = article.publishedAt ? Math.max(1, 96 - (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60)) : 24
  const titleWeight = Math.min(article.title.length / 12, 8)
  const excerptWeight = Math.min((article.excerpt?.length ?? 0) / 40, 5)
  const topicWeight = topic.slug === 'latest' ? 0.8 : 1.4

  return freshness + titleWeight + excerptWeight + readTime * 0.6 + topicWeight
}

export function getTrendingArticles(
  articles: PublicArticleSummary[],
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
  limit = 4,
) {
  return [...articles]
    .sort(
      (left, right) =>
        scoreArticleForTrending(right, siteNiche, topicLabelOverrides) -
        scoreArticleForTrending(left, siteNiche, topicLabelOverrides),
    )
    .slice(0, limit)
}

export function getDerivedTopicBySlug(
  articles: PublicArticleSummary[],
  topicSlug: string,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
  locale = 'en',
) {
  return (
    buildDerivedTopics(articles, siteNiche, topicLabelOverrides, locale).find((topic) => topic.slug === topicSlug) ??
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
      featuredNavLabel: sites.featuredNavLabel,
      allNavLabel: sites.allNavLabel,
      navTopicSlugs: sites.navTopicSlugs,
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
      featuredNavLabel: sites.featuredNavLabel,
      allNavLabel: sites.allNavLabel,
      navTopicSlugs: sites.navTopicSlugs,
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
