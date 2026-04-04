import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'

import { createArticleAction } from './actions'
import { AssistedDraftForm } from './assisted-draft-form'
import { ArticleForm } from './article-form'

export default async function AdminArticlesPage() {
  await requireAdminSession()

  const siteOptions = await db
    .select({
      id: sites.id,
      name: sites.name,
      defaultLocale: sites.defaultLocale,
    })
    .from(sites)
    .orderBy(desc(sites.createdAt))

  const articleRows = await db
    .select({
      id: articles.id,
      status: articles.status,
      updatedAt: articles.updatedAt,
      title: articleLocalizations.title,
      slug: articleLocalizations.slug,
      locale: articleLocalizations.locale,
      siteName: sites.name,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .orderBy(desc(articles.updatedAt))

  if (siteOptions.length === 0) {
    return (
      <section className="panel stack">
        <span className="eyebrow">Articles</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Create a site before drafting articles.
        </h1>
        <p className="muted">
          Manual article creation depends on a site context for locale, publishing rules, and later
          source and ad configuration.
        </p>
        <Link className="button primary" href="/admin/sites">
          Open site management
        </Link>
      </section>
    )
  }

  const primarySite = siteOptions[0]

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Articles</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Manual drafting is now part of the control plane.
        </h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          This is the first editor-first content surface. It lets the team create, review, and refine
          articles before automation is turned loose on ingestion and rewrite flows.
        </p>
      </header>

      <div className="hero-grid">
        <ArticleForm
          submitLabel="Create article draft"
          description="Write the first draft manually, then evolve this flow into assisted rewrite and localization."
          siteOptions={siteOptions}
          initialValues={{
            siteId: primarySite.id,
            locale: primarySite.defaultLocale,
            canonicalTopic: '',
            title: '',
            slug: '',
            sourceUrl: '',
            excerpt: '',
            body: '',
            seoTitle: '',
            seoDescription: '',
            status: 'draft',
          }}
          action={createArticleAction}
        />

        <div className="stack">
          <AssistedDraftForm siteOptions={siteOptions} />

          <section className="panel stack">
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Recent drafts</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Editorial queue starts here</h2>
            </div>

            {articleRows.length === 0 ? (
              <div className="empty-state">
                <strong>No drafts yet.</strong>
                <p className="muted">
                  Create the first article draft to unlock review and publish flows.
                </p>
              </div>
            ) : (
              <div className="stack">
                {articleRows.map((article) => (
                  <Link className="list-card article-link" href={`/admin/articles/${article.id}`} key={article.id}>
                    <span>
                      {article.siteName} · {article.locale} · {article.status}
                    </span>
                    <strong>{article.title}</strong>
                    <p className="muted">/{article.slug}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
