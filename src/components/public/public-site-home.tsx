import Link from 'next/link'
import { ArrowRight, ChevronRight, Search } from 'lucide-react'

import {
  buildEditorialImageDataUri,
  buildDerivedTopics,
  deriveTopicForArticle,
  estimateReadTimeMinutes,
  formatFreshnessLabel,
  getTrendingArticles,
  type PublicArticleSummary,
} from '@/lib/public-site'
import { type ResolvedSiteTheme } from '@/lib/site-theme'

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
    homepageLayout: 'spotlight' | 'digest'
  }
  theme: ResolvedSiteTheme
  articles: PublicArticleSummary[]
  useHostRouting?: boolean
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
  const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides)
  const imageUrl = resolveArticleVisual(article, siteNiche, topicLabelOverrides)
  const publishedLabel = formatPublishedDate(article.publishedAt, locale) ?? 'Live'

  return (
    <Link href={href} className="group">
      <article
        className={`relative overflow-hidden rounded-[28px] border border-white/12 bg-[#080809] ${
          size === 'large' ? 'min-h-[440px] md:min-h-[610px]' : 'min-h-[300px] md:min-h-[320px]'
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
            size === 'large' ? 'gap-4 p-7 md:p-8' : 'gap-2.5 p-5 md:p-6'
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
                ? 'text-[clamp(1.95rem,3.5vw,3.35rem)] leading-[1.04]'
                : 'max-w-[24rem] text-[clamp(1.15rem,1.55vw,1.85rem)] leading-[1.16]'
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
          <p className={size === 'large' ? 'text-sm text-white/58' : 'text-[0.82rem] text-white/52'}>{publishedLabel}</p>
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
  const topic = deriveTopicForArticle(article, siteNiche, topicLabelOverrides)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.24em]">
      <span style={{ color: '#fb923c' }}>{topic.label}</span>
      <span style={{ color: muted }}>{formatPublishedDate(article.publishedAt, locale) ?? 'Live'}</span>
      <span style={{ color: muted }}>{readTime} min read</span>
      <span style={{ color: muted }}>{freshness}</span>
    </div>
  )
}

function resolveArticleVisual(
  article: PublicArticleSummary,
  siteNiche?: string | null,
  topicLabelOverrides?: Record<string, string>,
) {
  return article.imageUrl ?? buildEditorialImageDataUri(article, siteNiche, topicLabelOverrides)
}

function KantanLikeHome({
  site,
  theme,
  articles,
  useHostRouting,
}: PublicSiteHomeProps) {
  const featuredArticle = articles[0]
  const railArticles = articles.slice(1, 3)
  const feedArticles = articles.slice(3)
  const quickScanArticles = articles.slice(0, 5)
  const trendingArticles = getTrendingArticles(articles, site.niche, site.topicLabelOverrides, 4)
  const topics = buildDerivedTopics(articles, site.niche, site.topicLabelOverrides).slice(0, 4)
  const navItems = [
    { href: useHostRouting ? '/' : `/${site.slug}`, label: 'Featured' },
    { href: useHostRouting ? '/' : `/${site.slug}`, label: 'All' },
    ...topics.map((topic) => ({
      href: getTopicHref(site.slug, topic.slug, useHostRouting ?? false),
      label: topic.label,
    })),
  ]

  return (
    <main className="min-h-screen bg-black text-white" style={theme.style}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href={useHostRouting ? '/' : `/${site.slug}`} className="text-[1.75rem] font-semibold tracking-tight text-white">
            {site.name}
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                  index === 0 ? 'border-white/20 text-white' : 'border-white/10 text-white/65'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/72 md:inline-flex">
              Hide read
            </button>
            <button className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/72">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        {featuredArticle ? (
          <section id="featured" className="grid gap-5 xl:grid-cols-[0.36fr_minmax(0,1fr)]">
            <div className="grid gap-5">
              {railArticles.map((article) => (
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
              href={getArticleHref(site.slug, featuredArticle.slug, useHostRouting ?? false)}
              article={featuredArticle}
              locale={site.defaultLocale}
              siteNiche={site.niche}
              topicLabelOverrides={site.topicLabelOverrides}
              accent={theme.tokens.heroGlow}
              size="large"
            />
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-8 md:p-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-white/50">Live Surface</p>
            <h1 className="text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[0.94] text-white">{site.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: theme.tokens.muted }}>
              Publish the first story from the admin workspace and this editorial front page will populate automatically.
            </p>
          </section>
        )}

        <section id="latest" className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">Latest Stories</p>
              <h2 className="mt-2 text-[clamp(1.7rem,2.2vw,2.4rem)] font-semibold text-white">Latest Stories</h2>
            </div>
            <span className="hidden text-sm text-white/50 md:inline-flex">{articles.length} published stories</span>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-2">
              {(feedArticles.length > 0 ? feedArticles : articles.slice(0, 6)).map((article) => (
                <Link key={article.id} href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)} className="group">
                  <article className="grid gap-4">
                    <ArticleImage
                      imageUrl={resolveArticleVisual(article, site.niche, site.topicLabelOverrides)}
                      title={article.title}
                      heightClassName="h-56"
                      accent={theme.tokens.heroGlow}
                    />
                    <div className="space-y-3">
                      <EditorialMeta
                        article={article}
                        locale={site.defaultLocale}
                        muted={theme.tokens.muted}
                        siteNiche={site.niche}
                        topicLabelOverrides={site.topicLabelOverrides}
                      />
                      <h3 className="text-[1.42rem] font-semibold leading-[1.08] text-white transition group-hover:text-white/88">
                        {article.title}
                      </h3>
                      <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                        {article.excerpt ?? 'Open the story to read the full article and source context.'}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                          Continue Reading
                          <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                        </span>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/58">
                          Source-ready
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="grid gap-5">
              <aside className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">Quick Scan</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Editor&apos;s Picks</h3>
                </div>
                <div className="mt-4 grid gap-4">
                  {quickScanArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)}
                      className="group border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                        {String(index + 1).padStart(2, '0')} · {deriveTopicForArticle(article, site.niche, site.topicLabelOverrides).label}
                      </p>
                      <h4 className="mt-2 text-base font-semibold leading-6 text-white transition group-hover:text-white/88">
                        {article.title}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-white/58">
                        {formatPublishedDate(article.publishedAt, site.defaultLocale) ?? 'Live'} · {estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''}`)} min read
                      </p>
                    </Link>
                  ))}
                </div>
              </aside>

              <aside className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">Trending</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Now building momentum</h3>
                </div>
                <div className="mt-4 grid gap-4">
                  {trendingArticles.map((article, index) => (
                    <Link
                      key={`${article.id}-trending`}
                      href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)}
                      className="group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                            #{String(index + 1).padStart(2, '0')} · {deriveTopicForArticle(article, site.niche, site.topicLabelOverrides).label}
                          </p>
                          <h4 className="mt-2 text-base font-semibold leading-6 text-white transition group-hover:text-white/88">
                            {article.title}
                          </h4>
                        </div>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/58">
                          Hot
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/58">
                        {formatFreshnessLabel(article.publishedAt)} · {estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''}`)} min read
                      </p>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        {topics.map((topic) => (
          <section key={topic.slug} id={`topic-${topic.slug}`} className="space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">Topic</p>
                <h2 className="mt-2 text-[clamp(1.7rem,2.2vw,2.4rem)] font-semibold text-white">{topic.label}</h2>
              </div>
              <span className="hidden text-sm text-white/50 md:inline-flex">
                {topic.articles.length} stor{topic.articles.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
              {topic.articles.slice(0, 3).map((article) => (
                <Link key={article.id} href={getArticleHref(site.slug, article.slug, useHostRouting ?? false)} className="group">
                  <article className="grid gap-4">
                    <ArticleImage
                      imageUrl={resolveArticleVisual(article, site.niche, site.topicLabelOverrides)}
                      title={article.title}
                      heightClassName="h-56"
                      accent={theme.tokens.heroGlow}
                    />
                    <div className="space-y-3">
                      <EditorialMeta
                        article={article}
                        locale={site.defaultLocale}
                        muted={theme.tokens.muted}
                        siteNiche={site.niche}
                        topicLabelOverrides={site.topicLabelOverrides}
                      />
                      <h3 className="text-[1.35rem] font-semibold leading-[1.1] text-white transition group-hover:text-white/88">
                        {article.title}
                      </h3>
                      <p className="text-sm leading-6" style={{ color: theme.tokens.muted }}>
                        {article.excerpt ?? 'Open the story to read the full article and source context.'}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ))}
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
