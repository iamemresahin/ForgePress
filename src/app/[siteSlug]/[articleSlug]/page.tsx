import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { CalendarClock, Globe2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="shell space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Globe2 className="mr-1 size-3.5" />
                {article.siteName} · {article.locale}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <CalendarClock className="mr-1 size-3.5" />
                {article.publishedAt.toLocaleDateString('en-US')}
              </Badge>
            </div>
            <CardTitle className="text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.94]">{article.title}</CardTitle>
            {article.excerpt ? <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{article.excerpt}</p> : null}
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="article-body">
            {sections.map((section, index) => {
              if (section.startsWith('## ')) {
                return (
                  <h2 key={`${index}-${section}`} className="text-[clamp(1.6rem,3vw,2.1rem)]">
                    {section.replace(/^##\s+/, '')}
                  </h2>
                )
              }

              if (section.startsWith('# ')) {
                return (
                  <h2 key={`${index}-${section}`} className="text-[clamp(1.9rem,3vw,2.4rem)]">
                    {section.replace(/^#\s+/, '')}
                  </h2>
                )
              }

              return <p key={`${index}-${section}`}>{section.replace(/^\*\s+/, '')}</p>
            })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
