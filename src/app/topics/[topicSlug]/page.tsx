import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { PublicSiteHome } from '@/components/public/public-site-home'
import { getPublicReaderSession } from '@/lib/auth'
import {
  buildDerivedTopics,
  findSiteByHostname,
  getDerivedTopicBySlug,
  getPublishedArticlesForSite,
} from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}): Promise<Metadata> {
  const { topicSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (!hostname || isPlatformHost(hostname)) {
    return {}
  }

  const site = await findSiteByHostname(hostname)
  if (!site) return {}

  const articles = await getPublishedArticlesForSite(site.id)
  const topic = getDerivedTopicBySlug(articles, topicSlug, site.niche, site.topicLabelOverrides, site.defaultLocale)
  if (!topic) return {}

  return {
    title: `${topic.label} | ${site.name}`,
    description: `${topic.label} stories from ${site.name}.`,
    alternates: {
      canonical: `https://${hostname}/topics/${topic.slug}`,
    },
  }
}

export default async function HostTopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (!hostname || isPlatformHost(hostname)) {
    notFound()
  }

  const site = await findSiteByHostname(hostname)
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
      useHostRouting
      activeTopicSlug={topic.slug}
      currentReader={currentReader}
    />
  )
}
