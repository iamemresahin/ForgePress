import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { translateArticleStatus } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { notFound } from 'next/navigation'

const STATUS_VALUES = ['draft', 'review', 'scheduled', 'published', 'rejected'] as const
type ArticleStatus = typeof STATUS_VALUES[number]

function isValidStatus(s: string | undefined): s is ArticleStatus {
  return STATUS_VALUES.includes(s as ArticleStatus)
}

export default async function SiteArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId } = await params
  const { status: rawStatus } = await searchParams
  const statusFilter: ArticleStatus | null = isValidStatus(rawStatus) ? rawStatus : null

  const [site] = await db.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1)
  if (!site) notFound()

  const conditions = [eq(articles.siteId, siteId)]
  if (statusFilter) conditions.push(eq(articles.status, statusFilter))

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
    .where(and(...conditions))
    .orderBy(desc(articles.updatedAt))

  const tabs = [
    { label: tr ? 'Tümü' : 'All', status: null, url: `/admin/sites/${siteId}/articles` },
    { label: tr ? 'Taslak' : 'Draft', status: 'draft', url: `/admin/sites/${siteId}/articles?status=draft` },
    { label: tr ? 'İnceleme' : 'Review', status: 'review', url: `/admin/sites/${siteId}/articles?status=review` },
    { label: tr ? 'Yayında' : 'Published', status: 'published', url: `/admin/sites/${siteId}/articles?status=published` },
    { label: tr ? 'Zamanlanmış' : 'Scheduled', status: 'scheduled', url: `/admin/sites/${siteId}/articles?status=scheduled` },
    { label: tr ? 'Reddedilen' : 'Rejected', status: 'rejected', url: `/admin/sites/${siteId}/articles?status=rejected` },
  ]

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="eyebrow">{site.name}</span>
              <CardTitle className="text-xl font-semibold">
                {tr ? 'Makaleler' : 'Articles'}
              </CardTitle>
              <CardDescription className="text-sm">
                {statusFilter
                  ? tr
                    ? `${articleRows.length} makale · ${statusFilter}`
                    : `${articleRows.length} articles · ${statusFilter}`
                  : tr
                    ? `${articleRows.length} makale toplam`
                    : `${articleRows.length} articles total`}
              </CardDescription>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/admin/articles">{tr ? 'Yeni taslak' : 'New draft'}</Link>
            </Button>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const active = tab.status === statusFilter
              return (
                <Link
                  key={tab.url}
                  href={tab.url}
                  className={`inline-flex h-8 items-center rounded-xl px-3 text-xs font-medium transition ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          {articleRows.length === 0 ? (
            <div className="empty-state">
              <strong>
                {statusFilter
                  ? tr
                    ? `${statusFilter} durumunda makale yok.`
                    : `No ${statusFilter} articles.`
                  : tr
                    ? 'Bu siteye ait makale yok.'
                    : 'No articles for this site.'}
              </strong>
              <p className="muted">
                {tr ? 'İlk makaleyi oluşturun.' : 'Create the first article.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {articleRows.map((article) => (
                <Link
                  className="flex items-start gap-3 py-3 transition hover:bg-accent/30 first:pt-0 last:pb-0"
                  href={`/admin/articles/${article.id}`}
                  key={article.id}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium leading-snug text-foreground">{article.title}</p>
                    <p className="text-xs text-muted-foreground">/{article.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                      {article.locale}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs capitalize">
                      {translateArticleStatus(locale, article.status)}
                    </Badge>
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
