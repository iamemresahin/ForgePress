import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { env } from '@/lib/env'
import { findSiteByHostname } from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)

    if (site) {
      return {
        rules: {
          userAgent: '*',
          allow: '/',
        },
        sitemap: `https://${hostname}/sitemap.xml`,
      }
    }
  }

  const appOrigin = env.APP_URL.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/admin',
      },
    ],
    sitemap: `${appOrigin}/sitemap.xml`,
  }
}
