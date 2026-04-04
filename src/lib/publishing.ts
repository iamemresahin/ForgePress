import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, jobs, sites } from '@/lib/db/schema'

export async function publishArticle(articleId: string) {
  const [article] = await db
    .select({
      id: articles.id,
      siteId: articles.siteId,
      siteSlug: sites.slug,
      locale: articleLocalizations.locale,
      slug: articleLocalizations.slug,
      title: articleLocalizations.title,
      body: articleLocalizations.body,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) {
    throw new Error('Article could not be found for publishing.')
  }

  if (!article.title || !article.slug || !article.body) {
    throw new Error('Article is missing required publish fields.')
  }

  const publishedAt = new Date()

  await db
    .update(articles)
    .set({
      status: 'published',
      updatedAt: publishedAt,
      publishedAt,
    })
    .where(eq(articles.id, articleId))

  await db.insert(jobs).values({
    siteId: article.siteId,
    kind: 'publish',
    status: 'completed',
    payload: {
      articleId: article.id,
      slug: article.slug,
      locale: article.locale,
      route: `/${article.siteSlug}/${article.slug}`,
    },
    startedAt: publishedAt,
    finishedAt: publishedAt,
  })

  return {
    siteSlug: article.siteSlug,
    slug: article.slug,
    locale: article.locale,
  }
}
