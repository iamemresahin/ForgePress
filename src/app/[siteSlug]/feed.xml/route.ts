import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import {
  findSiteByHostname,
  getPublicOriginForSite,
  getPublishedArticlesForRssFeed,
  getSiteBySlug,
} from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildRssFeed(
  siteOrigin: string,
  siteName: string,
  siteSlug: string,
  articles: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    locale: string
    publishedAt: Date | null
  }>,
): string {
  const feedUrl = `${siteOrigin}/feed.xml`
  const now = new Date().toUTCString()

  const items = articles
    .map((article) => {
      const articleUrl = `${siteOrigin}/${article.slug}`
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : now

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <description>${escapeXml(article.excerpt ?? article.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:language>${escapeXml(article.locale)}</dc:language>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteOrigin)}</link>
    <description>${escapeXml(siteName)} — latest published articles</description>
    <language>${articles[0]?.locale ?? 'en'}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  let site: Awaited<ReturnType<typeof getSiteBySlug>> | null = null

  if (hostname && !isPlatformHost(hostname)) {
    site = await findSiteByHostname(hostname)
  } else {
    site = await getSiteBySlug(siteSlug)
  }

  if (!site) {
    notFound()
  }

  const origin = await getPublicOriginForSite({ id: site.id, slug: site.slug })
  const articles = await getPublishedArticlesForRssFeed(site.id, 20)

  const xml = buildRssFeed(origin, site.name, site.slug, articles)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
