import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PublicTopicPage } from '@/components/public/public-topic-page'
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
  const topic = getDerivedTopicBySlug(articles, topicSlug, site.niche, site.topicLabelOverrides)
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
}: {
  params: Promise<{ siteSlug: string; topicSlug: string }>
}) {
  const { siteSlug, topicSlug } = await params
  const site = await getSiteBySlug(siteSlug)

  if (!site) {
    notFound()
  }

  const articles = await getPublishedArticlesForSite(site.id)
  const topics = buildDerivedTopics(articles, site.niche, site.topicLabelOverrides)
  const topic = topics.find((item) => item.slug === topicSlug)

  if (!topic) {
    notFound()
  }

  return (
    <PublicTopicPage
      site={site}
      topic={topic}
      allTopics={topics}
      articles={topic.articles}
      theme={resolveSiteTheme(site)}
    />
  )
}
