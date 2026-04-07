import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { siteDomains, sites } from '@/lib/db/schema'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { getThemePreset } from '@/lib/site-theme'

import { updateSiteAction } from '../actions'
import { SiteForm } from '../site-form'

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId } = await params

  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1)
  const domains = await db
    .select()
    .from(siteDomains)
    .where(eq(siteDomains.siteId, siteId))
    .orderBy(asc(siteDomains.createdAt))

  if (!site) {
    notFound()
  }

  const primaryDomain = domains.find((domain) => domain.isPrimary)?.hostname ?? domains[0]?.hostname ?? ''
  const additionalDomains = domains
    .filter((domain) => domain.hostname !== primaryDomain)
    .map((domain) => domain.hostname)
    .join(', ')
  const authBrandName = site.authBrandName?.trim() ?? ''
  const googleClientId = site.googleClientId?.trim() ?? ''
  const authReady = Boolean(authBrandName && googleClientId)
  const allowedOrigins = domains.map((domain) => `https://${domain.hostname}`)

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Site kurallarını düzenle' : 'Edit site rules'}</span>
            <CardTitle className="text-2xl font-bold">{site.name}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Her site için editoryal davranışı, yasaklı konuları, zorunlu yapıyı ve AdSense güvenliğini sıkılaştırın.'
                : 'Tighten editorial behavior, prohibited topics, required structure, and AdSense safety per site.'}
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-xl">
            <Link href="/admin/sites">{tr ? 'Sitelere dön' : 'Back to sites'}</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{tr ? 'Okuyucu girişi hazırlığı' : 'Reader auth readiness'}</span>
            <Badge variant={authReady ? 'success' : 'outline'} className="rounded-full px-3 py-1">
              {authReady
                ? tr
                  ? 'Hazır'
                  : 'Ready'
                : tr
                  ? 'Eksik'
                  : 'Incomplete'}
            </Badge>
          </div>
          <CardTitle className="text-[clamp(1.6rem,2.8vw,2.2rem)]">
            {tr
              ? 'Bu sitenin girişi diğer yayınlardan bağımsız kalmalı.'
              : 'This site should keep its reader auth isolated from other publications.'}
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
            {tr
              ? 'Birbiriyle ilgisiz markalarda aynı Google OAuth uygulamasını paylaşmayın. Bu site için ayrı client id kullanın ve sadece bu alan adlarını Google Console tarafına tanımlayın.'
              : 'Do not share the same Google OAuth application across unrelated brands. Use a dedicated client id for this site and only register these domains in Google Console.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              {tr ? 'Mevcut durum' : 'Current status'}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-950">{tr ? 'Auth marka adı:' : 'Auth brand:'}</span>{' '}
                {authBrandName || (tr ? 'Henüz girilmedi' : 'Not set yet')}
              </p>
              <p>
                <span className="font-semibold text-slate-950">{tr ? 'Google client id:' : 'Google client id:'}</span>{' '}
                {googleClientId ? `${googleClientId.slice(0, 24)}...` : tr ? 'Henüz girilmedi' : 'Not set yet'}
              </p>
              <p>
                <span className="font-semibold text-slate-950">{tr ? 'Birincil domain:' : 'Primary domain:'}</span>{' '}
                {primaryDomain || (tr ? 'Henüz bağlanmadı' : 'Not connected yet')}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              {tr ? 'Google Console originleri' : 'Google Console origins'}
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              {allowedOrigins.length > 0 ? (
                allowedOrigins.map((origin) => (
                  <div key={origin} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">
                    {origin}
                  </div>
                ))
              ) : (
                <p>{tr ? 'Önce siteye en az bir domain bağlayın.' : 'Connect at least one domain to this site first.'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <SiteForm
        locale={locale}
        action={updateSiteAction.bind(null, site.id)}
        submitLabel={tr ? 'Site kurallarını kaydet' : 'Save site rules'}
        description={
          tr
            ? 'Bu kurallar gelecekteki OpenAI destekli taslaklar ve editoryal inceleme için siteye özel kontrol katmanı olarak kullanılacak.'
            : 'These rules will be used as the site-specific control layer for future OpenAI-assisted drafts and editorial review.'
        }
        initialValues={{
          name: site.name,
          slug: site.slug,
          defaultLocale: site.defaultLocale,
          supportedLocales: site.supportedLocales.join(', '),
          niche: site.niche ?? '',
          toneGuide: site.toneGuide ?? '',
          editorialGuidelines: site.editorialGuidelines ?? '',
          adsensePolicyNotes: site.adsensePolicyNotes ?? '',
          prohibitedTopics: site.prohibitedTopics.join(', '),
          requiredSections: site.requiredSections.join(', '),
          reviewChecklist: site.reviewChecklist.join(', '),
          topicLabelOverrides: Object.entries(site.topicLabelOverrides ?? {})
            .map(([slug, label]) => `${slug}:${label}`)
            .join(', '),
          featuredNavLabel: site.featuredNavLabel ?? '',
          allNavLabel: site.allNavLabel ?? '',
          navTopicSlugs: (site.navTopicSlugs ?? []).join(', '),
          authBrandName: site.authBrandName ?? '',
          googleClientId: site.googleClientId ?? '',
          adsensePublisherId: site.adsensePublisherId ?? '',
          adsenseSlotId: site.adsenseSlotId ?? '',
          primaryHostname: primaryDomain,
          additionalHostnames: additionalDomains,
          themePreset: site.themePreset,
          homepageLayout: site.homepageLayout,
          articleLayout: site.articleLayout,
          themePrimary: site.themePrimary ?? getThemePreset(site.themePreset).tokens.primary,
          themeAccent: site.themeAccent ?? getThemePreset(site.themePreset).tokens.accent,
          themeBackground: site.themeBackground ?? getThemePreset(site.themePreset).tokens.background,
        }}
      />
    </section>
  )
}
