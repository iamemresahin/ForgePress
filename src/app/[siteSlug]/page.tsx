import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, desc, eq } from 'drizzle-orm'
import { ArrowRight, Globe2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="shell space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit rounded-full px-4 py-1 text-[0.7rem] tracking-[0.24em]">
                {site.defaultLocale} publication
              </Badge>
              <CardTitle className="text-[clamp(2.8rem,6vw,5rem)] leading-[0.94]">{site.name}</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                {site.niche ?? 'Multi-site publishing surface'} · supported locales:{' '}
                {site.supportedLocales.join(', ')}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-4">
          {visibleArticles.length === 0 ? (
            <Card>
              <CardContent className="empty-state p-8">
                <strong>No published articles yet.</strong>
                <p className="muted">Publish an article from the admin control plane to populate this site.</p>
              </CardContent>
            </Card>
          ) : (
            visibleArticles.map((article) => (
              <Link key={article.id} href={`/${site.slug}/${article.slug}`}>
                <Card className="transition hover:border-primary/40 hover:bg-accent/30">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        <Globe2 className="mr-1 size-3.5" />
                        {article.locale}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-tight">{article.title}</h2>
                      {article.excerpt ? <p className="text-sm leading-6 text-muted-foreground">{article.excerpt}</p> : null}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-primary">
                      Read article
                      <ArrowRight className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
