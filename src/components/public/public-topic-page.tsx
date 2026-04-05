import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { type DerivedTopic, type PublicArticleSummary } from '@/lib/public-site'
import { type ResolvedSiteTheme } from '@/lib/site-theme'

type PublicTopicPageProps = {
  site: {
    name: string
    slug: string
    defaultLocale: string
    niche: string | null
  }
  topic: DerivedTopic
  allTopics: DerivedTopic[]
  articles: PublicArticleSummary[]
  theme: ResolvedSiteTheme
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
  accent,
}: {
  imageUrl?: string | null
  title: string
  accent: string
}) {
  if (imageUrl) {
    return (
      <div className="overflow-hidden rounded-[22px] h-56">
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className="h-56 rounded-[22px]"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%), radial-gradient(circle at top right, ${accent}, transparent 34%), #171717`,
      }}
    />
  )
}

export function PublicTopicPage({
  site,
  topic,
  allTopics,
  articles,
  theme,
  useHostRouting = false,
}: PublicTopicPageProps) {
  return (
    <main className="min-h-screen bg-black text-white" style={theme.style}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href={useHostRouting ? '/' : `/${site.slug}`} className="text-[1.75rem] font-semibold tracking-tight text-white">
            {site.name}
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={useHostRouting ? '/' : `/${site.slug}`}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/65 transition"
            >
              All
            </Link>
            {allTopics.slice(0, 5).map((item) => (
              <Link
                key={item.slug}
                href={getTopicHref(site.slug, item.slug, useHostRouting)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                  item.slug === topic.slug ? 'border-white/20 text-white' : 'border-white/10 text-white/65'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="rounded-[30px] border border-white/10 bg-[#0f0f10] p-8 md:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">Topic Archive</p>
          <h1 className="mt-4 text-[clamp(2.2rem,4.6vw,4.8rem)] font-semibold leading-[0.94] text-white">{topic.label}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
            {site.niche ?? 'Editorial archive'} filtered into a darker, denser reading surface. {articles.length} published stor{articles.length === 1 ? 'y' : 'ies'} currently match this topic.
          </p>
        </section>

        <section className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={getArticleHref(site.slug, article.slug, useHostRouting)} className="group">
              <article className="grid gap-4">
                <ArticleImage imageUrl={article.imageUrl} title={article.title} accent={theme.tokens.heroGlow} />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.24em]">
                    <span style={{ color: '#fb923c' }}>{article.locale}</span>
                    <span className="text-white/50">{formatPublishedDate(article.publishedAt, site.defaultLocale) ?? 'Live'}</span>
                  </div>
                  <h2 className="text-[1.42rem] font-semibold leading-[1.08] text-white transition group-hover:text-white/88">
                    {article.title}
                  </h2>
                  <p className="text-sm leading-6 text-white/68">
                    {article.excerpt ?? 'Open the story to read the full article and source context.'}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                    Continue Reading
                    <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
