import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'

import {
  buildEditorialImageDataUri,
  buildDerivedTopics,
  deriveTopicForArticle,
  estimateReadTimeMinutes,
  formatFreshnessLabel,
  getPublicCopy,
  type PublicArticleSummary,
} from '@/lib/public-site'
import { type ResolvedSiteTheme } from '@/lib/site-theme'
import { PublicNewsAlert } from '@/components/public/public-news-alert'
import { PublicSiteHeader } from '@/components/public/public-site-header'

type PublicSiteHomeProps = {
  site: {
    id: string
    name: string
    slug: string
    defaultLocale: string
    supportedLocales: string[]
    niche: string | null
    toneGuide: string | null
    topicLabelOverrides?: Record<string, string>
    featuredNavLabel?: string | null
    allNavLabel?: string | null
    navTopicSlugs?: string[]
    homepageLayout: 'spotlight' | 'digest'
  }
  theme: ResolvedSiteTheme
  articles: PublicArticleSummary[]
  useHostRouting?: boolean
  activeTopicSlug?: string | null
  currentReader?: { id: string; email: string; displayName: string } | null
}

function formatPublishedDate(date: Date | null, locale: string) {
  if (!date) return null

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

function getArticleHref(siteSlug: string, articleSlug: string, useHostRouting: boolean) {
  return useHostRouting ? `/${articleSlug}` : `/${siteSlug}/${articleSlug}`
}

function getTopicHref(siteSlug: string, topicSlug: string, useHostRouting: boolean) {
  return useHostRouting ? `/topics/${topicSlug}` : `/${siteSlug}/topics/${topicSlug}`
}

function ArticleImage({
  imageUrl,
  title,
  heightClassName,
  accent,
}: {
  imageUrl?: string | null
  title: string
  heightClassName: string
  accent: string
}) {
  if (imageUrl) {
    return (
      <div className={`overflow-hidden rounded-[22px] ${heightClassName}`}>
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-[22px] ${heightClassName}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%), radial-gradient(circle at top right, ${accent}, transparent 34%), #171717`,
      }}
    />
  )
}

function EditorialFeatureCard({
  href,
  article,
  locale,
  siteNiche,
  topicLabelOverrides,
  accent,
  size = 'small',
}: {
  href: string
  article: PublicArticleSummary
  locale: string
  siteNiche?: string | null
  topicLabelOverrides?: Record<string, string>
  accent: string
  size?: 'small' | 'large'
}) {
  const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides, locale)
  const imageUrl = resolveArticleVisual(article, siteNiche, topicLabelOverrides)
  const publishedLabel = formatPublishedDate(article.publishedAt, locale) ?? 'Live'

  return (
    <Link href={href} className="group">
      <article
        className={`relative overflow-hidden rounded-[28px] border border-white/12 bg-[#080809] ${
          size === 'large' ? 'min-h-[470px] md:min-h-[510px]' : 'min-h-[225px] md:min-h-[245px]'
        }`}
      >
        <img
          src={imageUrl}
          alt={article.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              size === 'large'
                ? `linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.84) 100%), radial-gradient(circle at bottom left, ${accent}, transparent 34%)`
                : `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 42%, rgba(0,0,0,0.9) 100%)`
          }}
        />
        <div
          className={`absolute inset-x-0 bottom-0 z-10 flex flex-col ${
            size === 'large' ? 'gap-4 p-7 md:p-8' : 'gap-1.5 p-4 md:p-4.5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-[10px] bg-[#ff5a4f] px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">
              {topic.label}
            </span>
          </div>
          <h2
            className={`max-w-5xl font-semibold tracking-tight text-white ${
              size === 'large'
                ? 'max-w-[44rem] text-[clamp(2.15rem,3.9vw,3.75rem)] leading-[1.02]'
                : 'line-clamp-3 max-w-[15rem] text-[clamp(0.92rem,1vw,1.28rem)] leading-[1.08]'
            }`}
          >
            {article.title}
          </h2>
          {size === 'large' && article.excerpt ? (
            <p
              className={`max-w-4xl text-white/82 ${
                size === 'large' ? 'text-[0.95rem] leading-7 md:text-[1rem]' : 'hidden'
              }`}
            >
              {article.excerpt}
            </p>
          ) : null}
          <p className={size === 'large' ? 'text-sm text-white/58' : 'text-[0.72rem] text-white/46'}>{publishedLabel}</p>
        </div>
      </article>
    </Link>
  )
}

function EditorialMeta({
  article,
  locale,
  muted,
  siteNiche,
  topicLabelOverrides,
}: {
  article: PublicArticleSummary
  locale: string
  muted: string
  siteNiche?: string | null
  topicLabelOverrides?: Record<string, string>
}) {
  const readTime = estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''}`)
  const freshness = formatFreshnessLabel(article.publishedAt)
  const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides, locale)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.24em]">
      <span style={{ color: '#fb923c' }}>{topic.label}</span>
      <span style={{ color: muted }}>{formatPublishedDate(article.publishedAt, locale) ?? 'Live'}</span>
      <span style={{ color: muted }}>{readTime} min read</span>
      <span style={{ color: muted }}>{freshness}</span>
    </div>
  )
}

function EditorialStoryCard({
  article,
  site,
  theme,
  useHostRouting,
}: {
  article: PublicArticleSummary
  site: PublicSiteHomeProps['site']
  theme: ResolvedSiteTheme
  useHostRouting: boolean
}) {
  const copy = getPublicCopy(site.defaultLocale)

  return (
    <Link href={getArticleHref(site.slug, article.slug, useHostRouting)} className="group">
      <article className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#121214] transition duration-300 hover:-translate-y-0.5 hover:border-white/16">
        <ArticleImage
          imageUrl={resolveArticleVisual(article, site.niche, site.topicLabelOverrides)}
          title={article.title}
          heightClassName="h-[236px] md:h-[252px]"
          accent={theme.tokens.heroGlow}
        />
        <div className="flex flex-1 flex-col justify-between gap-5 px-6 py-6">
          <EditorialMeta
            article={article}
            locale={site.defaultLocale}
            muted={theme.tokens.muted}
            siteNiche={site.niche}
            topicLabelOverrides={site.topicLabelOverrides}
          />
          <div className="space-y-4">
            <h3 className="line-clamp-3 min-h-[6.8rem] text-[clamp(1.48rem,1.58vw,1.9rem)] font-semibold leading-[1.08] tracking-tight text-white transition group-hover:text-white/90">
              {article.title}
            </h3>
            <p className="line-clamp-4 min-h-[8rem] text-[0.96rem] leading-8" style={{ color: theme.tokens.muted }}>
              {article.excerpt ?? 'Open the story to read the full article and source context.'}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[1rem] font-semibold text-white">
              {copy.readStory}
              <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function resolveArticleVisual(
  article: PublicArticleSummary,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  return article.imageUrl ?? buildEditorialImageDataUri(article, siteNiche, topicLabelOverrides)
}

function buildEditorialNavItems(
  site: PublicSiteHomeProps['site'],
  topics: ReturnType<typeof buildDerivedTopics>,
  useHostRouting: boolean,
) {
  const copy = getPublicCopy(site.defaultLocale)
  const topicMap = new Map(topics.map((topic) => [topic.slug, topic]))
  const preferredOrder =
    site.navTopicSlugs && site.navTopicSlugs.length > 0
      ? site.navTopicSlugs
      : ['ai', 'tools', 'startups', 'development', 'design', 'technology']

  const orderedTopics = preferredOrder
    .map((slug) => topicMap.get(slug))
    .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic))

  for (const topic of topics) {
    if (!orderedTopics.find((item) => item.slug === topic.slug)) {
      orderedTopics.push(topic)
    }
  }

  const iconBySlug: Record<string, 'monitor' | 'gamepad' | 'flask' | 'car'> = {
    technology: 'monitor',
    tools: 'car',
    design: 'gamepad',
    ai: 'flask',
  }

  const primaryTopics = orderedTopics.slice(0, 4)
  const extraTopics = orderedTopics.slice(4)
  const homeAnchor = useHostRouting ? '/' : `/${site.slug}`

  return {
    primaryItems: [
      {
        href: `${homeAnchor}#featured`,
        label: site.featuredNavLabel?.trim() || copy.featured,
        accentDot: true,
      },
      {
        href: `${homeAnchor}#latest`,
        label: site.allNavLabel?.trim() || copy.all,
      },
      ...primaryTopics.map((topic) => ({
        href: getTopicHref(site.slug, topic.slug, useHostRouting),
        label: topic.label,
        icon: iconBySlug[topic.slug],
      })),
    ],
    extraItems: extraTopics.map((topic) => ({
      href: getTopicHref(site.slug, topic.slug, useHostRouting),
      label: topic.label,
      icon: iconBySlug[topic.slug],
    })),
  }
}

function chunkArticles(articles: PublicArticleSummary[], size: number) {
  const chunks: PublicArticleSummary[][] = []

  for (let index = 0; index < articles.length; index += size) {
    chunks.push(articles.slice(index, index + size))
  }

  return chunks
}

function EditorialGridBlock({
  articles,
  site,
  theme,
  useHostRouting,
}: {
  articles: PublicArticleSummary[]
  site: PublicSiteHomeProps['site']
  theme: ResolvedSiteTheme
  useHostRouting: boolean
}) {
  if (articles.length === 0) return null

  return (
    <section className="grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <EditorialStoryCard
          key={article.id}
          article={article}
          site={site}
          theme={theme}
          useHostRouting={useHostRouting}
        />
      ))}
    </section>
  )
}

function KantanLikeHome({
  site,
  theme,
  articles,
  useHostRouting,
  activeTopicSlug,
  currentReader,
}: PublicSiteHomeProps) {
  const copy = getPublicCopy(site.defaultLocale)
  const topics = buildDerivedTopics(articles, site.niche, site.topicLabelOverrides, site.defaultLocale)
  const filteredArticles = activeTopicSlug
    ? articles.filter((article) => deriveTopicForArticle(article, site.niche, site.topicLabelOverrides, site.defaultLocale).slug === activeTopicSlug)
    : articles
  const heroArticle = filteredArticles[0]
  const heroRailArticles = filteredArticles.slice(1, 3)
  const firstGridArticles = filteredArticles.slice(3, 9)
  const spotlightArticles = filteredArticles.slice(9, 12)
  const recurringChunks = chunkArticles(filteredArticles.slice(12), 6)
  const { primaryItems: navItems, extraItems } = buildEditorialNavItems(site, topics, useHostRouting ?? false)
  const homeHref = useHostRouting ? '/' : `/${site.slug}`
  const resolvedNavItems = navItems.map((item) => ({
    ...item,
    active:
      item.href.endsWith('#latest')
        ? !activeTopicSlug
        : activeTopicSlug
          ? item.href.endsWith(`/topics/${activeTopicSlug}`)
          : item.href.endsWith('#featured') && !activeTopicSlug,
  }))

  return (
    <main className="min-h-screen bg-black text-white" style={theme.style}>
      <PublicSiteHeader
        homeHref={homeHref}
        siteId={site.id}
        siteName={site.name}
        locale={site.defaultLocale}
        redirectPath={activeTopicSlug ? getTopicHref(site.slug, activeTopicSlug, useHostRouting ?? false) : homeHref}
        navItems={resolvedNavItems}
        extraItems={extraItems}
        flowModeLabel={copy.flowMode}
        signInLabel={copy.signIn}
        otherCategoriesLabel={copy.otherCategories}
        currentReader={currentReader}
      />

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        {filteredArticles.length === 0 ? (
          <section className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-8 md:p-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-white/50">{copy.liveSurface}</p>
            <h1 className="text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[0.94] text-white">{site.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: theme.tokens.muted }}>
              {copy.publishFirstStory}
            </p>
          </section>
        ) : (
          <>
            {heroArticle ? (
              <section id="featured" className="relative grid gap-5 xl:grid-cols-[0.62fr_minmax(0,1.98fr)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-center xl:flex">
                  <div className="pointer-events-auto -mt-6">
                    <PublicNewsAlert
                      articleId={heroArticle.id}
                      articleHref={getArticleHref(site.slug, heroArticle.slug, useHostRouting ?? false)}
                      siteId={site.id}
                      label={copy.newStoryAlert}
                    />
                  </div>
                </div>
                <div className="grid gap-5">
                  {heroRailArticles.map((article) => (
                    <EditorialFeatureCard
                      key={article.id}
                      href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)}
                      article={article}
                      locale={site.defaultLocale}
                      siteNiche={site.niche}
                      topicLabelOverrides={site.topicLabelOverrides}
                      accent={theme.tokens.heroGlow}
                    />
                  ))}
                </div>

                <EditorialFeatureCard
                  href={getArticleHref(site.slug, heroArticle.slug, useHostRouting ?? false)}
                  article={heroArticle}
                  locale={site.defaultLocale}
                  siteNiche={site.niche}
                  topicLabelOverrides={site.topicLabelOverrides}
                  accent={theme.tokens.heroGlow}
                  size="large"
                />
              </section>
            ) : null}

            <section id="latest" className="space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">{copy.latestStories}</p>
                  <h2 className="mt-2 text-[clamp(1.7rem,2.2vw,2.4rem)] font-semibold text-white">{copy.latestStories}</h2>
                </div>
                <span className="hidden text-sm text-white/50 md:inline-flex">{filteredArticles.length} {copy.publishedStories}</span>
              </div>

              <EditorialGridBlock
                articles={firstGridArticles}
                site={site}
                theme={theme}
                useHostRouting={useHostRouting ?? false}
              />
            </section>

            {spotlightArticles[0] ? (
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.72fr)_0.92fr]">
                <EditorialFeatureCard
                  href={getArticleHref(site.slug, spotlightArticles[0].slug, useHostRouting ?? false)}
                  article={spotlightArticles[0]}
                  locale={site.defaultLocale}
                  siteNiche={site.niche}
                  topicLabelOverrides={site.topicLabelOverrides}
                  accent={theme.tokens.heroGlow}
                  size="large"
                />

                <div className="grid gap-5">
                  {spotlightArticles.slice(1, 3).map((article) => (
                    <EditorialFeatureCard
                      key={article.id}
                      href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)}
                      article={article}
                      locale={site.defaultLocale}
                      siteNiche={site.niche}
                      topicLabelOverrides={site.topicLabelOverrides}
                      accent={theme.tokens.heroGlow}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {recurringChunks.map((chunk, index) => (
              <EditorialGridBlock
                key={`grid-block-${index}`}
                articles={chunk}
                site={site}
                theme={theme}
                useHostRouting={useHostRouting ?? false}
              />
            ))}
          </>
        )}
      </div>
    </main>
  )
}

function DefaultHome({
  site,
  theme,
  articles,
  useHostRouting = false,
}: PublicSiteHomeProps) {
  const featuredArticle = articles[0]
  const secondaryArticles = articles.slice(1, 7)

  const cardStyle = {
    background: theme.tokens.panel,
    borderColor: theme.tokens.border,
    color: theme.tokens.foreground,
    boxShadow: `0 24px 70px -34px ${theme.tokens.heroGlow}`,
  }

  const heroStyle = {
    background: `radial-gradient(circle at top left, ${theme.tokens.heroGlow}, transparent 30%), linear-gradient(180deg, ${theme.tokens.backgroundSoft}, ${theme.tokens.background})`,
    borderColor: theme.tokens.border,
    color: theme.tokens.foreground,
    boxShadow: `0 26px 80px -36px ${theme.tokens.heroGlow}`,
  }

  const chipStyle = {
    borderColor: theme.tokens.border,
    background: theme.tokens.panelStrong,
    color: theme.tokens.foreground,
  }

  const primaryLinkStyle = {
    background: theme.tokens.primary,
    color: theme.tokens.buttonForeground,
  }

  const subtleLinkStyle = {
    color: theme.tokens.primary,
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-10" style={theme.style}>
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
        style={{ color: 'var(--site-foreground)' }}
      >
        <section className="rounded-[32px] border px-6 py-7 md:px-8 md:py-9" style={heroStyle}>
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em]">
              <span className="inline-flex items-center rounded-full border px-4 py-1.5" style={chipStyle}>
                {site.defaultLocale} site
              </span>
              <span style={{ color: theme.tokens.muted }}>{site.supportedLocales.join(' · ')}</span>
            </div>

            <div
              className={
                site.homepageLayout === 'digest'
                  ? 'grid gap-8 lg:grid-cols-[0.9fr_1.1fr]'
                  : 'grid gap-8 lg:grid-cols-[1.1fr_0.9fr]'
              }
            >
              <div className="space-y-4">
                <h1 className="text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.92]">{site.name}</h1>
                <p className="max-w-2xl text-base leading-7" style={{ color: theme.tokens.muted }}>
                  {site.niche ?? 'AI-assisted editorial publication'} ·{' '}
                  {site.toneGuide ?? 'Multi-site publishing surface'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={featuredArticle ? getArticleHref(site.slug, featuredArticle.slug, useHostRouting) : '#'}
                    className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition hover:opacity-95"
                    style={primaryLinkStyle}
                  >
                    {featuredArticle ? 'Read featured story' : 'Publishing surface ready'}
                  </Link>
                  <span className="text-sm" style={{ color: theme.tokens.muted }}>
                    {articles.length} published article{articles.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 rounded-[28px] border p-5" style={cardStyle}>
                {featuredArticle ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                        Featured
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em]" style={{ color: theme.tokens.muted }}>
                        {formatPublishedDate(featuredArticle.publishedAt, site.defaultLocale) ?? 'Ready'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-[clamp(1.7rem,4vw,2.5rem)] leading-tight">{featuredArticle.title}</h2>
                      {featuredArticle.excerpt ? (
                        <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                          {featuredArticle.excerpt}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={getArticleHref(site.slug, featuredArticle.slug, useHostRouting)}
                      className="inline-flex items-center gap-2 text-sm font-semibold"
                      style={subtleLinkStyle}
                    >
                      Continue to article
                      <ArrowRight className="size-4" />
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2 py-4">
                    <h2 className="text-2xl">No published stories yet.</h2>
                    <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                      Publish the first article from the admin control plane and this site will populate automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {site.homepageLayout === 'digest' ? (
          <section className="grid gap-4">
            {articles.map((article) => (
              <Link key={article.id} href={getArticleHref(site.slug, article.slug, useHostRouting)}>
                <article
                  className="grid gap-3 rounded-[24px] border px-5 py-5 transition hover:-translate-y-0.5"
                  style={cardStyle}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                      {article.locale}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em]" style={{ color: theme.tokens.muted }}>
                      {formatPublishedDate(article.publishedAt, site.defaultLocale) ?? 'Draft'}
                    </span>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
                    <h2 className="text-[clamp(1.4rem,2.4vw,2rem)] leading-tight">{article.title}</h2>
                    <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                      {article.excerpt ?? 'Open the story to read the full article.'}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {secondaryArticles.length === 0 ? (
              <article className="rounded-[24px] border p-6 md:col-span-2 xl:col-span-3" style={cardStyle}>
                <h2 className="text-2xl">The publication is live.</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: theme.tokens.muted }}>
                  Add more published stories to build out the site archive and homepage rhythm.
                </p>
              </article>
            ) : (
              secondaryArticles.map((article) => (
                <Link key={article.id} href={getArticleHref(site.slug, article.slug, useHostRouting)}>
                  <article className="h-full rounded-[24px] border p-5 transition hover:-translate-y-0.5" style={cardStyle}>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                        {article.locale}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-[clamp(1.35rem,2vw,1.8rem)] leading-tight">{article.title}</h2>
                      <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                        {article.excerpt ?? 'Open the story to read the full article.'}
                      </p>
                    </div>
                  </article>
                </Link>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export function PublicSiteHome(props: PublicSiteHomeProps) {
  if (props.theme.preset === 'kantan_editorial') {
    return <KantanLikeHome {...props} />
  }

  return <DefaultHome {...props} />
}
