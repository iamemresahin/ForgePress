import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarClock } from 'lucide-react'

import {
  estimateReadTimeMinutes,
  formatFreshnessLabel,
  type PublicArticleDetail,
  type PublicArticleSummary,
} from '@/lib/public-site'
import { type ResolvedSiteTheme } from '@/lib/site-theme'

type PublicArticlePageProps = {
  article: PublicArticleDetail
  theme: ResolvedSiteTheme
  useHostRouting?: boolean
  nextArticle?: PublicArticleSummary | null
  relatedArticles?: PublicArticleSummary[]
}

function splitBody(body: string) {
  return body.split('\n').filter((line) => line.trim().length > 0)
}

function formatPublishedDate(date: Date | null, locale: string) {
  if (!date) return 'Ready'

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

function ArticleBody({ body, color }: { body: string; color: string }) {
  const sections = splitBody(body)

  return (
    <div className="article-body" style={{ color }}>
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
          <p key={`${index}-${section}`} style={{ color }}>
            {section.replace(/^\*\s+/, '')}
          </p>
        )
      })}
    </div>
  )
}

function EditorialImage({
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
      <div className="overflow-hidden rounded-[28px]">
        <img src={imageUrl} alt={title} className="h-full max-h-[620px] w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className="h-[320px] rounded-[28px] md:h-[440px]"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%), radial-gradient(circle at top right, ${accent}, transparent 34%), #171717`,
      }}
    />
  )
}

function KantanLikeArticle({
  article,
  theme,
  useHostRouting = false,
  nextArticle,
  relatedArticles = [],
}: PublicArticlePageProps) {
  const publishedLabel = formatPublishedDate(article.publishedAt, article.locale)
  const readTime = estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''} ${article.body}`)
  const freshness = formatFreshnessLabel(article.publishedAt)
  const homeHref = useHostRouting ? '/' : `/${article.siteSlug}`
  const nextHref = nextArticle
    ? useHostRouting
      ? `/${nextArticle.slug}`
      : `/${article.siteSlug}/${nextArticle.slug}`
    : null

  return (
    <main className="min-h-screen bg-black text-white" style={theme.style}>
      <header className="border-b border-white/10 bg-black/94 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href={homeHref} className="text-[1.4rem] font-semibold tracking-tight text-white">
              {article.siteName}
            </Link>
            <Link href={homeHref} className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 md:inline-flex">
              Geri Dön
            </Link>
          </div>
          <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">Giriş</button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium uppercase tracking-[0.24em]">
            <span style={{ color: '#fb923c' }}>{article.locale}</span>
            <span className="inline-flex items-center gap-2 text-white/55">
              <CalendarClock className="size-3.5" />
              {publishedLabel}
            </span>
            <span className="text-white/40">{readTime} min read</span>
            <span className="text-white/40">{freshness}</span>
            <span className="text-white/40">AI-assisted</span>
          </div>

          <h1 className="max-w-5xl text-[clamp(2.4rem,5vw,5.25rem)] font-semibold leading-[0.95] tracking-tight text-white">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="max-w-3xl text-base leading-7 text-white/68 md:text-lg">{article.excerpt}</p>
          ) : null}
        </section>

        <EditorialImage imageUrl={article.imageUrl} title={article.title} accent={theme.tokens.heroGlow} />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[24px] border border-white/10 bg-[#0f0f10] px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">Source Context</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              This story was prepared for {article.siteName} with a compact, source-led editorial format designed for dense news feeds and faster scanning.
            </p>
          </div>

          {article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[112px] items-center justify-between rounded-[24px] border border-white/10 bg-white px-5 py-4 text-sm font-semibold text-black transition hover:bg-white/92"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45">Source</p>
                <p className="mt-2 text-base">Open original coverage</p>
              </div>
              <ArrowUpRight className="size-5" />
            </a>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-[#0f0f10] px-5 py-4 text-sm text-white/58">
              External source link is not available for this article yet.
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-6">
            <article className="min-w-0 rounded-[28px] border border-white/10 bg-[#0f0f10] px-6 py-7 md:px-8 md:py-8">
              <ArticleBody body={article.body} color="#f3f4f6" />
            </article>

            {relatedArticles.length > 0 ? (
              <section className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-5 md:p-6">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">Related Stories</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Keep reading</h2>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {relatedArticles.map((relatedArticle) => {
                    const relatedHref = useHostRouting
                      ? `/${relatedArticle.slug}`
                      : `/${article.siteSlug}/${relatedArticle.slug}`

                    return (
                      <Link
                        key={relatedArticle.id}
                        href={relatedHref}
                        className="group rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
                          {formatFreshnessLabel(relatedArticle.publishedAt)}
                        </p>
                        <h3 className="mt-3 text-lg font-semibold leading-6 text-white transition group-hover:text-white/88">
                          {relatedArticle.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-white/58">
                          {relatedArticle.excerpt ?? 'Open the story to continue through the editorial feed.'}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/72">
                          Read story
                          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="grid content-start gap-4">
            <div className="rounded-[24px] border border-white/10 bg-[#0f0f10] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">Story Info</p>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <p>Site: {article.siteName}</p>
                <p>Locale: {article.locale}</p>
                <p>Published: {publishedLabel}</p>
                <p>Read time: {readTime} min</p>
                <p>Freshness: {freshness}</p>
              </div>
            </div>

            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-[24px] border border-white/10 bg-transparent px-5 py-4 text-sm font-medium text-white/74 transition hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Geri Dön
            </Link>

            {nextHref && nextArticle ? (
              <Link
                href={nextHref}
                className="rounded-[24px] border border-white/10 bg-[#0f0f10] px-5 py-4 transition hover:border-white/20"
              >
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">Next Story</p>
                <p className="mt-3 text-base font-semibold leading-6 text-white">{nextArticle.title}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/72">
                  Read next
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  )
}

function DefaultArticle({ article, theme }: PublicArticlePageProps) {
  const sections = splitBody(article.body)
  const publishedLabel = article.publishedAt
    ? article.publishedAt.toLocaleDateString(article.locale)
    : 'Ready'

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
                {article.siteName} · {article.locale}
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={chipStyle}>
                <CalendarClock className="mr-1 size-3.5" />
                {publishedLabel}
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

export function PublicArticlePage(props: PublicArticlePageProps) {
  if (props.theme.preset === 'kantan_editorial') {
    return <KantanLikeArticle {...props} />
  }

  return <DefaultArticle {...props} />
}
