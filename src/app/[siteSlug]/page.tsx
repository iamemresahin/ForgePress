import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ siteSlug: string }>
}) {
  const { siteSlug } = await params

  const [site] = await db.select().from(sites).where(eq(sites.slug, siteSlug)).limit(1)

  if (!site) {
    notFound()
  }

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

  return (
    <main className="page">
      <div className="shell stack">
        <header className="panel stack">
          <span className="eyebrow">{site.defaultLocale} publication</span>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', lineHeight: 0.94 }}>{site.name}</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            {site.niche ?? 'Multi-site publishing surface'} · supported locales:{' '}
            {site.supportedLocales.join(', ')}
          </p>
        </header>

        <section className="stack">
          {visibleArticles.length === 0 ? (
            <div className="panel empty-state">
              <strong>No published articles yet.</strong>
              <p className="muted">Publish an article from the admin control plane to populate this site.</p>
            </div>
          ) : (
            visibleArticles.map((article) => (
              <Link className="panel stack article-link" href={`/${site.slug}/${article.slug}`} key={article.id}>
                <span className="eyebrow">{article.locale}</span>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>{article.title}</h2>
                {article.excerpt ? <p className="muted">{article.excerpt}</p> : null}
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
