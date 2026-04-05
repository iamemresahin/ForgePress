import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { env } from '@/lib/env'
import { findSiteByHostname } from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

export async function GET() {
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)

    if (site) {
      return new NextResponse(
        `User-agent: *\nAllow: /\nSitemap: https://${hostname}/sitemap.xml\n`,
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        },
      )
    }
  }

  const appOrigin = env.APP_URL.replace(/\/$/, '')
  return new NextResponse(
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${appOrigin}/sitemap.xml\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  )
}
