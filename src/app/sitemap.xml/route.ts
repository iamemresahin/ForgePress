import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { articleLocalizations, articles, sites } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { findSiteByHostname } from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

function toUrlTag(url: string, lastModified?: Date | null) {
  return `<url><loc>${url}</loc>${lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : ''}</url>`
}

export async function GET() {
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

      const urls = [
        toUrlTag(`https://${hostname}`),
        ...items
          .filter((item) => item.status === 'published' && item.publishedAt)
          .map((item) => toUrlTag(`https://${hostname}/${item.slug}`, item.updatedAt)),
      ]

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
        {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        },
      )
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

  const urls = [
    toUrlTag(appOrigin),
    ...siteRows.map((site) => toUrlTag(`${appOrigin}/${site.slug}`, site.updatedAt)),
  ]

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  )
}
