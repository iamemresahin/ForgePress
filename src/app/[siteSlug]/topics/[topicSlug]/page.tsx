import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PublicSiteHome } from '@/components/public/public-site-home'
import { getPublicReaderSession } from '@/lib/auth'
import {
  buildDerivedTopics,
  getDerivedTopicBySlug,
  getPublicOriginForSite,
  getPublishedArticlesForSite,
  getSiteBySlug,
} from '@/lib/public-site'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string; topicSlug: string }>
}): Promise<Metadata> {
  const { siteSlug, topicSlug } = await params
  const site = await getSiteBySlug(siteSlug)
  if (!site) return {}

  const articles = await getPublishedArticlesForSite(site.id)
  const topic = getDerivedTopicBySlug(articles, topicSlug, site.niche, site.topicLabelOverrides, site.defaultLocale)
  if (!topic) return {}

  const origin = await getPublicOriginForSite({ id: site.id, slug: site.slug })

  return {
    title: `${topic.label} | ${site.name}`,
    description: `${topic.label} stories from ${site.name}.`,
    alternates: {
      canonical: `${origin}/topics/${topic.slug}`,
    },
  }
}

export default async function SiteTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string; topicSlug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const { siteSlug, topicSlug } = await params
  const { lang } = await searchParams
  const site = await getSiteBySlug(siteSlug)

  if (!site) {
    notFound()
  }

  const articles = await getPublishedArticlesForSite(site.id)
  const topics = buildDerivedTopics(articles, site.niche, site.topicLabelOverrides, site.defaultLocale)
  const topic = topics.find((item) => item.slug === topicSlug)

  if (!topic) {
    notFound()
  }

  const currentReader = await getPublicReaderSession(site.id)

  return (
    <PublicSiteHome
      site={site}
      theme={resolveSiteTheme(site)}
      articles={articles}
      activeTopicSlug={topic.slug}
      activeLocale={lang ?? null}
      currentReader={currentReader}
    />
  )
}
