import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { FileText, PenSquare, Sparkles, Wand2 } from 'lucide-react'

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
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Makaleler' : 'Articles'}</span>
            <CardTitle className="text-2xl font-bold">
              {tr ? 'Manuel taslak artık kontrol panelinin bir parçası.' : 'Manual drafting is now part of the control plane.'}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Bu, editör öncelikli ilk içerik yüzeyi. Ekip, içe aktarma ve yeniden yazım otomasyonları devreye girmeden önce makaleleri oluşturabilir, inceleyebilir ve iyileştirebilir.'
                : 'This is the first editor-first content surface. It lets the team create, review, and refine articles before automation is turned loose on ingestion and rewrite flows.'}
            </CardDescription>
          </div>
          <div className="stats-grid">
            <article>
              <FileText className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Toplam taslak' : 'Total drafts'}</span>
              <strong>{articleRows.length}</strong>
            </article>
            <article>
              <PenSquare className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Birincil dil' : 'Primary locale'}</span>
              <strong>{primarySite.defaultLocale}</strong>
            </article>
            <article>
              <Wand2 className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Destekli taslak' : 'Assisted drafting'}</span>
              <strong>{tr ? 'Açık' : 'Enabled'}</strong>
            </article>
            <article>
              <Sparkles className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Yayın modu' : 'Publishing mode'}</span>
              <strong>{tr ? 'Önce inceleme' : 'Review first'}</strong>
            </article>
          </div>
        </CardHeader>
      </Card>

      <div className="hero-grid">
        <ArticleForm
          locale={locale}
          submitLabel={tr ? 'Makale taslagi olustur' : 'Create article draft'}
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
                {tr ? 'Editoryal kuyruk burada baslar' : 'Editorial queue starts here'}
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                {tr
                  ? 'Taslaklar manuel ya da OpenAI destekli üretilerek başlayabilir, sonra inceleme ve yayına ilerler.'
                  : 'Drafts can start manually or from OpenAI-assisted generation, then move into review and publish.'}
              </CardDescription>
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
