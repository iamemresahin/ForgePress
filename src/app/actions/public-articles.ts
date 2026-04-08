'use server'

import { getMorePublishedArticles, searchPublishedArticles } from '@/lib/public-site'

export async function loadMoreArticlesAction(siteId: string, cursor: string) {
  return getMorePublishedArticles(siteId, cursor, 12)
}

export async function searchArticlesAction(siteId: string, query: string) {
  return searchPublishedArticles(siteId, query, 24)
}
