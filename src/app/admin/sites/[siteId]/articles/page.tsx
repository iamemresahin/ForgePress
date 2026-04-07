import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { translateArticleStatus } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { notFound } from 'next/navigation'

export default async function SiteArticlesPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId } = await params

  const [site] = await db.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1)
  if (!site) notFound()

  const articleRows = await db
    .select({
      id: articles.id,
      status: articles.status,
      updatedAt: articles.updatedAt,
      title: articleLocalizations.title,
      slug: articleLocalizations.slug,
      locale: articleLocalizations.locale,
    })
    .from(articles)
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .where(eq(articles.siteId, siteId))
    .orderBy(desc(articles.updatedAt))

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{site.name}</span>
          </div>
          <CardTitle className="text-xl font-semibold">
            {tr ? 'Makaleler' : 'Articles'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? `${site.name} sitesine ait ${articleRows.length} makale`
              : `${articleRows.length} articles for ${site.name}`}
          </CardDescription>
          <div className="flex gap-2">
            <Button asChild className="rounded-xl w-fit">
              <Link href="/admin/articles">{tr ? 'Yeni taslak' : 'New draft'}</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {articleRows.length === 0 ? (
            <div className="empty-state">
              <strong>{tr ? 'Bu siteye ait makale yok.' : 'No articles for this site.'}</strong>
              <p className="muted">{tr ? 'İlk makaleyi oluşturun.' : 'Create the first article.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articleRows.map((article) => (
                <Link
                  className="list-card block space-y-3 transition hover:border-primary/40 hover:bg-accent/30"
                  href={`/admin/articles/${article.id}`}
                  key={article.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {article.locale}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                      {translateArticleStatus(locale, article.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <strong className="mt-0 text-xl">{article.title}</strong>
                    <p className="muted">/{article.slug}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
