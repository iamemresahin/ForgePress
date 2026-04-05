import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { and, asc, desc, eq } from 'drizzle-orm'
import { ArrowRight, CalendarClock, Globe2, Sparkles } from 'lucide-react'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { findSiteByHostname } from '@/lib/public-site'
import { resolveSiteTheme } from '@/lib/site-theme'

type RouteParams = {
  hostname: string
  slug?: string[]
}

function formatPublishedDate(date: Date | null, locale: string) {
  if (!date) return null

  try {
    return date.toLocaleDateString(locale)
  } catch {
    return date.toLocaleDateString('en-US')
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { hostname, slug } = await params
  const site = await findSiteByHostname(hostname)

  if (!site) return {}

  if (!slug || slug.length === 0) {
    const canonical = `https://${hostname}`
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

  if (slug.length !== 1) return {}

  const [article] = await db
    .select({
      title: articleLocalizations.title,
      seoTitle: articleLocalizations.seoTitle,
      seoDescription: articleLocalizations.seoDescription,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .where(and(eq(articles.siteId, site.id), eq(articleLocalizations.slug, slug[0])))
    .limit(1)

  if (!article) return {}

  const canonical = `https://${hostname}/${slug[0]}`

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

export default async function DomainAwareSitePage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { hostname, slug } = await params
  const site = await findSiteByHostname(hostname)

  if (!site) {
    notFound()
  }

  const theme = resolveSiteTheme(site)

  if (!slug || slug.length === 0) {
    const publishedArticles = await db
      .select({
        id: articles.id,
        title: articleLocalizations.title,
        slug: articleLocalizations.slug,
        excerpt: articleLocalizations.excerpt,
        locale: articleLocalizations.locale,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
      .where(eq(articles.siteId, site.id))
      .orderBy(desc(articles.publishedAt), asc(articleLocalizations.locale))

    const visibleArticles = publishedArticles.filter((article) => article.publishedAt)
    const featuredArticle = visibleArticles[0]
    const secondaryArticles = visibleArticles.slice(1, 7)

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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" style={{ color: 'var(--site-foreground)' }}>
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
                  theme.homepageLayout === 'digest'
                    ? 'grid gap-8 lg:grid-cols-[0.9fr_1.1fr]'
                    : 'grid gap-8 lg:grid-cols-[1.1fr_0.9fr]'
                }
              >
                <div className="space-y-4">
                  <h1 className="text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.92]">{site.name}</h1>
                  <p className="max-w-2xl text-base leading-7" style={{ color: theme.tokens.muted }}>
                    {site.niche ?? 'AI-assisted editorial publication'} · {site.toneGuide ?? 'Multi-site publishing surface'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={featuredArticle ? `/${featuredArticle.slug}` : '#'}
                      className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm transition hover:opacity-95"
                      style={primaryLinkStyle}
                    >
                      {featuredArticle ? 'Read featured story' : 'Publishing surface ready'}
                    </Link>
                    <span className="text-sm" style={{ color: theme.tokens.muted }}>
                      {visibleArticles.length} published article{visibleArticles.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 rounded-[28px] border p-5" style={cardStyle}>
                  {featuredArticle ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                          <Sparkles className="mr-1 size-3.5" />
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
                      <Link href={`/${featuredArticle.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold" style={subtleLinkStyle}>
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

          {theme.homepageLayout === 'digest' ? (
            <section className="grid gap-4">
              {visibleArticles.map((article) => (
                <Link key={article.id} href={`/${article.slug}`}>
                  <article className="grid gap-3 rounded-[24px] border px-5 py-5 transition hover:-translate-y-0.5" style={cardStyle}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                        <Globe2 className="mr-1 size-3.5" />
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
                  <Link key={article.id} href={`/${article.slug}`}>
                    <article className="h-full rounded-[24px] border p-5 transition hover:-translate-y-0.5" style={cardStyle}>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                          <Globe2 className="mr-1 size-3.5" />
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

  if (slug.length !== 1) {
    notFound()
  }

  const [article] = await db
    .select({
      id: articles.id,
      title: articleLocalizations.title,
      excerpt: articleLocalizations.excerpt,
      body: articleLocalizations.body,
      locale: articleLocalizations.locale,
      siteName: sites.name,
      siteSlug: sites.slug,
      publishedAt: articles.publishedAt,
      status: articles.status,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(and(eq(articles.siteId, site.id), eq(articleLocalizations.slug, slug[0])))
    .limit(1)

  if (!article || article.status !== 'published' || !article.publishedAt) {
    notFound()
  }

  const sections = article.body.split('\n').filter((line) => line.trim().length > 0)
  const heroStyle = {
    background:
      theme.articleLayout === 'feature'
        ? `radial-gradient(circle at top left, ${theme.tokens.heroGlow}, transparent 28%), linear-gradient(180deg, ${theme.tokens.backgroundSoft}, ${theme.tokens.background})`
        : theme.tokens.panel,
    borderColor: theme.tokens.border,
    color: theme.tokens.foreground,
    boxShadow: `0 24px 70px -34px ${theme.tokens.heroGlow}`,
  }
  const chipStyle = {
    borderColor: theme.tokens.border,
    background: theme.tokens.panelStrong,
    color: theme.tokens.foreground,
  }
  const bodyStyle = {
    background: theme.tokens.panelStrong,
    borderColor: theme.tokens.border,
    color: theme.tokens.foreground,
    boxShadow: `0 24px 70px -38px ${theme.tokens.heroGlow}`,
  }

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-6 md:py-10"
      style={{
        ...theme.style,
        background: `linear-gradient(180deg, var(--site-background), var(--site-background-soft))`,
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section
          className={`rounded-[32px] border px-6 py-7 md:px-8 ${theme.articleLayout === 'feature' ? 'md:py-10' : 'md:py-8'}`}
          style={heroStyle}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                <Globe2 className="mr-1 size-3.5" />
                {article.siteName} · {article.locale}
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                <CalendarClock className="mr-1 size-3.5" />
                {article.publishedAt.toLocaleDateString(article.locale)}
              </span>
            </div>

            <div className="space-y-4">
              <h1
                className={
                  theme.articleLayout === 'feature'
                    ? 'max-w-3xl text-[clamp(3rem,7vw,5.4rem)] leading-[0.9]'
                    : 'max-w-3xl text-[clamp(2.7rem,6vw,4.7rem)] leading-[0.94]'
                }
              >
                {article.title}
              </h1>
              {article.excerpt ? (
                <p className="max-w-3xl text-base leading-7 md:text-lg md:leading-8" style={{ color: theme.tokens.muted }}>
                  {article.excerpt}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <article className="rounded-[28px] border p-6 md:p-8" style={bodyStyle}>
          <div className="article-body" style={{ color: theme.tokens.foreground }}>
            {sections.map((section, index) => {
              if (section.startsWith('## ')) {
                return (
                  <h2 key={`${index}-${section}`} className="text-[clamp(1.6rem,3vw,2.1rem)]">
                    {section.replace(/^##\s+/, '')}
                  </h2>
                )
              }

              if (section.startsWith('# ')) {
                return (
                  <h2 key={`${index}-${section}`} className="text-[clamp(1.9rem,3vw,2.4rem)]">
                    {section.replace(/^#\s+/, '')}
                  </h2>
                )
              }

              return (
                <p key={`${index}-${section}`} style={{ color: theme.tokens.foreground }}>
                  {section.replace(/^\*\s+/, '')}
                </p>
              )
            })}
          </div>
        </article>
      </div>
    </main>
  )
}
