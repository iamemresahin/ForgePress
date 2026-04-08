import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarClock } from 'lucide-react'

import {
  buildDerivedTopics,
  buildEditorialImageDataUri,
  estimateReadTimeMinutes,
  formatFreshnessLabel,
  getPublicCopy,
  type PublicArticleDetail,
  type PublicArticleSummary,
} from '@/lib/public-site'
import { type ResolvedSiteTheme } from '@/lib/site-theme'
import { PublicThemeShell } from '@/components/public/public-color-mode'
import { PublicCommentsPanel } from '@/components/public/public-comments-panel'
import { PublicReaderAuthDialog } from '@/components/public/public-reader-auth-dialog'
import { AdUnit } from '@/components/public/ad-unit'
import { PublicArticleActions, YouTubeEmbed } from '@/components/public/public-article-actions'
import { GoogleAnalytics } from '@/components/public/google-analytics'
import { PublicSiteHeader } from '@/components/public/public-site-header'

type PublicArticlePageProps = {
  article: PublicArticleDetail
  theme: ResolvedSiteTheme
  useHostRouting?: boolean
  nextArticle?: PublicArticleSummary | null
  relatedArticles?: PublicArticleSummary[]
  currentReader?: { id: string; email: string; displayName: string; siteId: string } | null
  comments?: Array<{ id: string; memberId: string; displayName: string; body: string; createdAtLabel: string }>
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

const AD_INTERVAL = 5 // show an ad after every N paragraphs

function ArticleBody({
  body,
  color,
  adsensePublisherId,
  adsenseSlotId,
}: {
  body: string
  color: string
  adsensePublisherId?: string | null
  adsenseSlotId?: string | null
}) {
  const sections = splitBody(body)
  const showAds = Boolean(adsensePublisherId && adsenseSlotId)
  let paragraphCount = 0

  return (
    <div className="article-body" style={{ color }}>
      {sections.map((section, index) => {
        const isHeading = section.startsWith('#')
        if (!isHeading) paragraphCount++

        const el = (() => {
          if (section.startsWith('## ')) {
            return (
              <h2 key={`${index}-h2`} className="text-[clamp(1.6rem,3vw,2.1rem)]">
                {section.replace(/^##\s+/, '')}
              </h2>
            )
          }
          if (section.startsWith('# ')) {
            return (
              <h2 key={`${index}-h1`} className="text-[clamp(1.9rem,3vw,2.4rem)]">
                {section.replace(/^#\s+/, '')}
              </h2>
            )
          }
          return (
            <p key={`${index}-p`} style={{ color }}>
              {section.replace(/^\*\s+/, '')}
            </p>
          )
        })()

        const showAdAfter = showAds && !isHeading && paragraphCount % AD_INTERVAL === 0

        return (
          <div key={index}>
            {el}
            {showAdAfter && (
              <AdUnit
                publisherId={adsensePublisherId!}
                slotId={adsenseSlotId!}
                className="my-8 overflow-hidden rounded-[18px]"
              />
            )}
          </div>
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
  currentReader = null,
  comments = [],
}: PublicArticlePageProps) {
  const copy = getPublicCopy(article.locale)
  const publishedLabel = formatPublishedDate(article.publishedAt, article.locale)
  const readTime = estimateReadTimeMinutes(`${article.title} ${article.excerpt ?? ''} ${article.body}`)
  const freshness = formatFreshnessLabel(article.publishedAt)
  const homeHref = useHostRouting ? '/' : `/${article.siteSlug}`
  const redirectPath = useHostRouting ? `/${article.slug}` : `/${article.siteSlug}/${article.slug}`
  const nextHref = nextArticle
    ? useHostRouting
      ? `/${nextArticle.slug}`
      : `/${article.siteSlug}/${nextArticle.slug}`
    : null

  // Build nav items from related articles topics
  const topics = buildDerivedTopics(relatedArticles, null, article.topicLabelOverrides ?? undefined, article.locale)
  const preferredOrder = article.navTopicSlugs && article.navTopicSlugs.length > 0
    ? article.navTopicSlugs
    : ['ai', 'tools', 'startups', 'development', 'design', 'technology']
  const topicMap = new Map(topics.map((t) => [t.slug, t]))
  const orderedTopics = preferredOrder.map((s) => topicMap.get(s)).filter(Boolean) as typeof topics
  for (const t of topics) {
    if (!orderedTopics.find((o) => o.slug === t.slug)) orderedTopics.push(t)
  }
  const getTopicHref = (slug: string) => useHostRouting ? `/topics/${slug}` : `/${article.siteSlug}/topics/${slug}`
  const navItems = [
    { href: homeHref, label: article.featuredNavLabel?.trim() || copy.featured, accentDot: true },
    { href: homeHref, label: article.allNavLabel?.trim() || copy.all },
    ...orderedTopics.slice(0, 4).map((t) => ({ href: getTopicHref(t.slug), label: t.label })),
  ]
  const extraItems = orderedTopics.slice(4).map((t) => ({ href: getTopicHref(t.slug), label: t.label }))

  return (
    <PublicThemeShell className="min-h-screen" style={theme.style}>
      <PublicSiteHeader
        homeHref={homeHref}
        siteId={article.siteId}
        siteName={article.siteName}
        locale={article.locale}
        redirectPath={redirectPath}
        navItems={navItems}
        extraItems={extraItems}
        signInLabel={copy.signIn}
        otherCategoriesLabel={copy.otherCategories}
        currentReader={currentReader}
        authBrandName={article.authBrandName}
        googleClientId={article.googleClientId}
      />

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        {/* Hero metadata + title */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium uppercase tracking-[0.24em]">
            <span style={{ color: '#fb923c' }}>{article.locale}</span>
            <span className="public-text-dim inline-flex items-center gap-2">
              <CalendarClock className="size-3.5" />
              {publishedLabel}
            </span>
            <span className="public-text-faint">{readTime} min read</span>
            <span className="public-text-faint">{freshness}</span>
          </div>

          <h1 className="public-text max-w-5xl text-[clamp(2.4rem,5vw,5.25rem)] font-semibold leading-[0.95] tracking-tight">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="public-text-dim max-w-3xl text-base leading-7 md:text-lg">{article.excerpt}</p>
          ) : null}
        </section>

        {/* Hero image */}
        <EditorialImage
          imageUrl={article.imageUrl ?? buildEditorialImageDataUri(article)}
          title={article.title}
          accent={theme.tokens.heroGlow}
        />

        {/* Video embed (if available) */}
        {article.videoUrl ? (
          <YouTubeEmbed url={article.videoUrl} />
        ) : null}

        <div className="grid gap-6">
          {/* Article body */}
          <article className="public-panel min-w-0 rounded-[28px] border px-6 py-7 md:px-10 md:py-10">
            <ArticleBody
              body={article.body}
              color="var(--site-foreground-current)"
              adsensePublisherId={article.adsensePublisherId}
              adsenseSlotId={article.adsenseSlotId}
            />

            {/* Source link at article end */}
            {article.sourceUrl ? (
              <div className="public-border mt-8 border-t pt-6">
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="public-border public-text-dim inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
                >
                  {copy.openOriginalCoverage}
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            ) : null}
          </article>

          {/* Social actions */}
          <PublicArticleActions
            articleId={article.id}
            title={article.title}
            locale={article.locale}
          />

          {/* Related articles */}
          {relatedArticles.length > 0 ? (
            <section className="public-panel rounded-[28px] border p-5 md:p-6">
              <div className="public-border border-b pb-4">
                <p className="public-text-faint text-xs font-medium uppercase tracking-[0.24em]">{copy.relatedStories}</p>
                <h2 className="public-text mt-2 text-2xl font-semibold">{copy.keepReading}</h2>
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
                      className="public-panel group rounded-[24px] border p-4 transition"
                    >
                      <img
                        src={relatedArticle.imageUrl ?? buildEditorialImageDataUri(relatedArticle)}
                        alt={relatedArticle.title}
                        className="mb-4 h-32 w-full rounded-[18px] object-cover"
                      />
                      <p className="public-text-faint text-[11px] font-medium uppercase tracking-[0.24em]">
                        {formatFreshnessLabel(relatedArticle.publishedAt)}
                      </p>
                      <h3 className="public-text mt-3 text-lg font-semibold leading-6 transition">
                        {relatedArticle.title}
                      </h3>
                      <p className="public-text-dim mt-3 text-sm leading-6">
                        {relatedArticle.excerpt ?? ''}
                      </p>
                      <span className="public-text-dim mt-4 inline-flex items-center gap-2 text-sm">
                        {copy.readStory}
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* Comments */}
          <PublicCommentsPanel
            siteId={article.siteId}
            siteName={article.siteName}
            articleId={article.id}
            redirectPath={redirectPath}
            locale={article.locale}
            currentReader={currentReader}
            authBrandName={article.authBrandName}
            googleClientId={article.googleClientId}
            comments={comments}
          />

          {/* Bottom navigation */}
          <div className="public-border flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <Link
              href={homeHref}
              className="public-border public-text-dim inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
            >
              <ArrowLeft className="size-4" />
              {copy.backHome}
            </Link>

            {nextHref && nextArticle && (
              <Link
                href={nextHref}
                className="public-border public-text-dim inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
              >
                {copy.nextStory}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <footer className="public-border border-t">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-center px-4 py-6 md:px-6">
          <a
            href="https://forgepress.app"
            target="_blank"
            rel="noreferrer"
            className="public-text-faint text-xs font-medium transition hover:opacity-70"
          >
            Powered by ForgePress
          </a>
        </div>
      </footer>
    </PublicThemeShell>
  )
}

function DefaultArticle({ article, theme }: PublicArticlePageProps) {
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
    <PublicThemeShell className="min-h-screen px-4 py-8 md:px-6 md:py-10" style={pageStyle}>
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

        {article.videoUrl ? (
          <YouTubeEmbed url={article.videoUrl} />
        ) : null}

        <article className="rounded-[28px] border p-6 md:p-8" style={bodyStyle}>
          <ArticleBody
            body={article.body}
            color={theme.tokens.foreground}
            adsensePublisherId={article.adsensePublisherId}
            adsenseSlotId={article.adsenseSlotId}
          />
          {article.sourceUrl ? (
            <div className="mt-8 border-t pt-6" style={{ borderColor: theme.tokens.border }}>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
                style={{ borderColor: theme.tokens.border, color: theme.tokens.muted }}
              >
                Kaynak Habere Git
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          ) : null}
        </article>

        <PublicArticleActions
          articleId={article.id}
          title={article.title}
          locale={article.locale}
        />
      </div>
    </PublicThemeShell>
  )
}

export function PublicArticlePage(props: PublicArticlePageProps) {
  const ga = <GoogleAnalytics gtagId={props.article.gtagId} />

  if (props.theme.preset === 'kantan_editorial') {
    return <>{ga}<KantanLikeArticle {...props} /></>
  }

  return <>{ga}<DefaultArticle {...props} /></>
}
