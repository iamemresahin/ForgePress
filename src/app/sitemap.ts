import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { and, asc, eq, isNotNull } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { findSiteByHostname } from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)

    if (site) {
      const items = await db
        .select({
          slug: articleLocalizations.slug,
          locale: articleLocalizations.locale,
          updatedAt: articles.updatedAt,
          publishedAt: articles.publishedAt,
        })
        .from(articles)
        .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
        .where(and(eq(articles.siteId, site.id), eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
        .orderBy(asc(articleLocalizations.slug))

      return [
        { url: `https://${hostname}`, lastModified: new Date() },
        { url: `https://${hostname}/feed.xml`, lastModified: new Date(), changeFrequency: 'hourly' as const },
        ...items.map((item) => ({
          url: `https://${hostname}/${item.slug}`,
          lastModified: item.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      ]
    }
  }

  const appOrigin = env.APP_URL.replace(/\/$/, '')

  const siteRows = await db
    .select({ slug: sites.slug, updatedAt: sites.updatedAt })
    .from(sites)
    .orderBy(asc(sites.slug))

  const articleRows = await db
    .select({
      siteSlug: sites.slug,
      articleSlug: articleLocalizations.slug,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .innerJoin(sites, eq(sites.id, articles.siteId))
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .where(and(eq(articles.status, 'published'), isNotNull(articles.publishedAt)))
    .orderBy(asc(articleLocalizations.slug))

  return [
    { url: appOrigin, lastModified: new Date() },
    ...siteRows.flatMap((site) => [
      { url: `${appOrigin}/${site.slug}`, lastModified: site.updatedAt, changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${appOrigin}/${site.slug}/feed.xml`, lastModified: new Date(), changeFrequency: 'hourly' as const },
    ]),
    ...articleRows.map((row) => ({
      url: `${appOrigin}/${row.siteSlug}/${row.articleSlug}`,
      lastModified: row.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
