import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'

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
          updatedAt: articles.updatedAt,
          publishedAt: articles.publishedAt,
          status: articles.status,
        })
        .from(articles)
        .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
        .where(eq(articles.siteId, site.id))
        .orderBy(asc(articleLocalizations.slug))

      return [
        {
          url: `https://${hostname}`,
          lastModified: new Date(),
        },
        ...items
          .filter((item) => item.status === 'published' && item.publishedAt)
          .map((item) => ({
            url: `https://${hostname}/${item.slug}`,
            lastModified: item.updatedAt,
          })),
      ]
    }
  }

  const appOrigin = env.APP_URL.replace(/\/$/, '')
  const siteRows = await db
    .select({
      slug: sites.slug,
      updatedAt: sites.updatedAt,
    })
    .from(sites)
    .orderBy(asc(sites.slug))

  return [
    {
      url: appOrigin,
      lastModified: new Date(),
    },
    ...siteRows.map((site) => ({
      url: `${appOrigin}/${site.slug}`,
      lastModified: site.updatedAt,
    })),
  ]
}
