import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Globe2, PencilLine, Rocket, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { translateArticleStatus } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { deleteArticleAction, publishArticleAction, updateArticleAction } from '../actions'
import { EditArticleForm } from './edit-form'

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
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
      videoUrl: articleLocalizations.videoUrl,
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
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-3">
            <span className="eyebrow">{tr ? 'Makaleyi düzenle' : 'Edit article'}</span>
            <CardTitle className="text-[clamp(2.2rem,4vw,3.6rem)] leading-[0.96]">{article.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Globe2 className="mr-1 size-3.5" />
                {article.siteName}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {article.locale}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                {translateArticleStatus(locale, article.status)}
              </Badge>
            </div>
            <CardDescription className="text-sm leading-6">
              {tr ? 'Açık rota' : 'Public route'}: {publicUrl}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/articles">
              <PencilLine className="size-4" />
              {tr ? 'Makale listesine dön' : 'Back to article list'}
            </Link>
          </Button>
        <form action={publishArticleAction.bind(null, article.id)}>
          <Button className="rounded-xl">
            <Rocket className="size-4" />
              {article.status === 'published'
                ? tr
                  ? 'Yayını yenile'
                  : 'Refresh publish'
                : tr
                  ? 'Makaleyi yayınla'
                  : 'Publish article'}
            </Button>
          </form>
          <form action={deleteArticleAction.bind(null, article.id)}>
            <Button variant="outline" className="rounded-xl text-red-600 hover:text-red-700">
              <Trash2 className="size-4" />
              {tr ? 'Taslağı sil' : 'Delete article'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
          videoUrl: article.videoUrl ?? '',
          excerpt: article.excerpt ?? '',
          body: article.body,
          seoTitle: article.seoTitle ?? '',
          seoDescription: article.seoDescription ?? '',
          status: article.status,
        }}
        action={updateArticleAction}
        locale={locale}
      />
    </section>
  )
}
