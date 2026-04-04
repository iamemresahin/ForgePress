import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'

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
      seoTitle: articleLocalizations.seoTitle,
      seoDescription: articleLocalizations.seoDescription,
      locale: articleLocalizations.locale,
      siteName: sites.name,
      siteSlug: sites.slug,
      publishedAt: articles.publishedAt,
      status: articles.status,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(and(eq(sites.slug, siteSlug), eq(articleLocalizations.slug, articleSlug)))

  if (!article || article.siteSlug !== siteSlug || article.status !== 'published' || !article.publishedAt) {
    notFound()
  }

  const sections = article.body.split('\n').filter((line) => line.trim().length > 0)

  return (
    <main className="page">
      <div className="shell stack" style={{ gap: 24 }}>
        <article className="panel article-surface stack">
          <span className="eyebrow">
            {article.siteName} · {article.locale}
          </span>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.8rem)', lineHeight: 0.94 }}>{article.title}</h1>
          {article.excerpt ? <p className="muted" style={{ fontSize: '1.08rem' }}>{article.excerpt}</p> : null}

          <div className="article-body">
            {sections.map((section, index) => {
              if (section.startsWith('## ')) {
                return (
                  <h2 key={`${index}-${section}`} style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>
                    {section.replace(/^##\s+/, '')}
                  </h2>
                )
              }

              if (section.startsWith('# ')) {
                return (
                  <h2 key={`${index}-${section}`} style={{ fontSize: 'clamp(1.9rem, 3vw, 2.4rem)' }}>
                    {section.replace(/^#\s+/, '')}
                  </h2>
                )
              }

              return <p key={`${index}-${section}`}>{section.replace(/^\*\s+/, '')}</p>
            })}
          </div>
        </article>
      </div>
    </main>
  )
}
