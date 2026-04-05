import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { CalendarClock, Globe2 } from 'lucide-react'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { getPublicOriginForSite } from '@/lib/public-site'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string; articleSlug: string }>
}) {
  const { siteSlug, articleSlug } = await params

  const [article] = await db
    .select({
      title: articleLocalizations.title,
      seoTitle: articleLocalizations.seoTitle,
      seoDescription: articleLocalizations.seoDescription,
      siteName: sites.name,
      siteId: sites.id,
      siteSlug: sites.slug,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(and(eq(sites.slug, siteSlug), eq(articleLocalizations.slug, articleSlug)))

  if (!article) {
    return {}
  }

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? `${article.title} on ${article.siteName}`,
    alternates: {
      canonical: `${await getPublicOriginForSite({ id: article.siteId, slug: article.siteSlug })}/${articleSlug}`,
    },
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? `${article.title} on ${article.siteName}`,
      url: `${await getPublicOriginForSite({ id: article.siteId, slug: article.siteSlug })}/${articleSlug}`,
      siteName: article.siteName,
      type: 'article',
    },
  }
}

export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ siteSlug: string; articleSlug: string }>
}) {
  const { siteSlug, articleSlug } = await params

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
    .where(and(eq(sites.slug, siteSlug), eq(articleLocalizations.slug, articleSlug)))

  if (!article || article.siteSlug !== siteSlug || article.status !== 'published' || !article.publishedAt) {
    notFound()
  }

  const theme = resolveSiteTheme(article)
  const sections = article.body.split('\n').filter((line) => line.trim().length > 0)

  const pageStyle = {
    ...theme.style,
    background: `linear-gradient(180deg, var(--site-background), var(--site-background-soft))`,
  }

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
    <main className="min-h-screen px-4 py-8 md:px-6 md:py-10" style={pageStyle}>
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
