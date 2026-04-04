import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'

import { publishArticleAction, updateArticleAction } from '../actions'
import { EditArticleForm } from './edit-form'

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  await requireAdminSession()
  const { articleId } = await params

  const siteOptions = await db
    .select({
      id: sites.id,
      name: sites.name,
      defaultLocale: sites.defaultLocale,
    })
    .from(sites)

  const [article] = await db
    .select({
      id: articles.id,
      siteId: articles.siteId,
      status: articles.status,
      canonicalTopic: articles.canonicalTopic,
      sourceUrl: articles.sourceUrl,
      locale: articleLocalizations.locale,
      title: articleLocalizations.title,
      slug: articleLocalizations.slug,
      excerpt: articleLocalizations.excerpt,
      body: articleLocalizations.body,
      seoTitle: articleLocalizations.seoTitle,
      seoDescription: articleLocalizations.seoDescription,
      siteName: sites.name,
      siteSlug: sites.slug,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) {
    notFound()
  }
  const publicUrl = `/${article.siteSlug}/${article.slug}`

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Edit article</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', lineHeight: 0.96 }}>{article.title}</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          {article.siteName} · {article.locale} · {article.status}
        </p>
        <p className="muted">Public route: {publicUrl}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="button" href="/admin/articles">
            Back to article list
          </Link>
          <form action={publishArticleAction.bind(null, article.id)}>
            <button className="button primary" type="submit">
              {article.status === 'published' ? 'Refresh publish' : 'Publish article'}
            </button>
          </form>
        </div>
      </header>

      <EditArticleForm
        articleId={article.id}
        siteOptions={siteOptions}
        initialValues={{
          siteId: article.siteId,
          locale: article.locale,
          canonicalTopic: article.canonicalTopic,
          title: article.title,
          slug: article.slug,
          sourceUrl: article.sourceUrl ?? '',
          excerpt: article.excerpt ?? '',
          body: article.body,
          seoTitle: article.seoTitle ?? '',
          seoDescription: article.seoDescription ?? '',
          status: article.status,
        }}
        action={updateArticleAction}
      />
    </section>
  )
}
