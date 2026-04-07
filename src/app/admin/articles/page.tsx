import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { getActiveSiteId } from '@/lib/active-site.server'
import { translateArticleStatus } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { createArticleAction } from './actions'
import { AssistedDraftForm } from './assisted-draft-form'
import { ArticleForm } from './article-form'

export default async function AdminArticlesPage() {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'

  const [siteOptions, cookieActiveSiteId] = await Promise.all([
    db.select({ id: sites.id, name: sites.name, defaultLocale: sites.defaultLocale }).from(sites).orderBy(desc(sites.createdAt)),
    getActiveSiteId(),
  ])

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
      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{tr ? 'Makaleler' : 'Articles'}</span>
          <CardTitle className="text-2xl font-bold">
            {tr ? 'Makale taslağı oluşturmadan önce bir site oluşturun.' : 'Create a site before drafting articles.'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? 'Manuel makale oluşturma; dil, yayın kuralları ve ileride kaynak ile reklam ayarları için bir site bağlamına ihtiyaç duyar.'
              : 'Manual article creation depends on a site context for locale, publishing rules, and later source and ad configuration.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/admin/sites">{tr ? 'Site yönetimini aç' : 'Open site management'}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const primarySite = siteOptions.find((s) => s.id === cookieActiveSiteId) ?? siteOptions[0]

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{tr ? 'Yeni Taslak' : 'New Draft'}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-foreground">
            {tr ? 'Makale oluştur' : 'Create article'}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{tr ? `${articleRows.length} taslak` : `${articleRows.length} drafts`}</span>
          <span>·</span>
          <span>{primarySite.name}</span>
        </div>
      </div>

      <div className="hero-grid">
        <ArticleForm
          locale={locale}
          submitLabel={tr ? 'Makale taslağı oluştur' : 'Create article draft'}
          description={
            tr
              ? 'İlk taslağı manuel yazın, sonra bu akışı destekli yeniden yazım ve yerelleştirmeye taşıyın.'
              : 'Write the first draft manually, then evolve this flow into assisted rewrite and localization.'
          }
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

        <div className="space-y-6">
          <AssistedDraftForm siteOptions={siteOptions} locale={locale} />

          <Card>
            <CardHeader className="space-y-2">
              <span className="eyebrow">{tr ? 'Son taslaklar' : 'Recent drafts'}</span>
              <CardTitle className="text-lg">
                {tr ? 'Son taslaklar' : 'Recent drafts'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {articleRows.length === 0 ? (
                <div className="empty-state">
                  <strong>{tr ? 'Henüz taslak yok.' : 'No drafts yet.'}</strong>
                  <p className="muted">
                    {tr
                      ? 'İnceleme ve yayın akışını açmak için ilk makale taslağını oluşturun.'
                      : 'Create the first article draft to unlock review and publish flows.'}
                  </p>
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
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {article.siteName}
                        </Badge>
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
        </div>
      </div>
    </section>
  )
}
