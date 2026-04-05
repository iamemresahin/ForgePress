import { headers } from 'next/headers'
import type { Metadata } from 'next'

import { BrandMark } from '@/components/brand-mark'
import { PublicSiteHome } from '@/components/public/public-site-home'
import { findSiteByHostname, getPublishedArticlesForSite } from '@/lib/public-site'
import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'
import { resolveSiteTheme } from '@/lib/site-theme'

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)

    if (site) {
      const canonical = `https://${hostname}`

      return {
        title: site.name,
        description: site.niche ?? `${site.name} publishing surface`,
        alternates: {
          canonical,
        },
        openGraph: {
          title: site.name,
          description: site.niche ?? `${site.name} publishing surface`,
          url: canonical,
          siteName: site.name,
          type: 'website',
        },
      }
    }
  }

  return {
    title: 'ForgePress',
    description:
      'ForgePress is an AI-assisted content platform for running multi-site publishing operations from one control panel.',
  }
}

export default async function HomePage() {
  const headerStore = await headers()
  const hostname = normalizeHostname(headerStore.get('host') ?? '')

  if (hostname && !isPlatformHost(hostname)) {
    const site = await findSiteByHostname(hostname)

    if (site) {
      const theme = resolveSiteTheme(site)
      const articles = await getPublishedArticlesForSite(site.id)
      return <PublicSiteHome site={site} theme={theme} articles={articles} useHostRouting />
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-16">
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq"
          className="h-full w-full border-0"
          title="ForgePress background"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-black/10" />

      <div className="relative z-20 flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <BrandMark className="size-10 text-sky-300" />
          <span className="font-display text-4xl font-semibold tracking-tight">ForgePress</span>
        </div>
        <p className="text-base leading-7 text-white/88 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
          ForgePress is an AI-assisted content platform for running multi-site publishing operations from one control panel.
        </p>
      </div>
    </main>
  )
}
