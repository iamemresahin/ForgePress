import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  if (!site) notFound()

  const primaryDomain = domains.find((d) => d.isPrimary)?.hostname ?? domains[0]?.hostname ?? ''
  const additionalDomains = domains.filter((d) => d.hostname !== primaryDomain).map((d) => d.hostname).join(', ')
  const authBrandName = site.authBrandName?.trim() ?? ''
  const googleClientId = site.googleClientId?.trim() ?? ''
  const authReady = Boolean(authBrandName && googleClientId)
  const allowedOrigins = domains.map((d) => `https://${d.hostname}`)

  return (
    <section className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{tr ? 'Site Kuralları' : 'Site Rules'}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-foreground">{site.name}</h1>
        </div>
        <Badge variant={authReady ? 'success' : 'outline'} className="rounded-full px-3 py-1">
          {tr ? (authReady ? 'Auth hazır' : 'Auth eksik') : authReady ? 'Auth ready' : 'Auth incomplete'}
        </Badge>
      </div>

      {/* Auth status — compact info row */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            {tr ? 'Okuyucu girişi' : 'Reader auth'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">{tr ? 'Marka adı' : 'Brand name'}</span>
              <span className="font-medium">{authBrandName || <span className="text-muted-foreground/60">{tr ? 'Girilmedi' : 'Not set'}</span>}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Google Client ID</span>
              <span className="font-mono text-xs">{googleClientId ? `${googleClientId.slice(0, 20)}…` : <span className="text-muted-foreground/60">{tr ? 'Girilmedi' : 'Not set'}</span>}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{tr ? 'Birincil domain' : 'Primary domain'}</span>
              <span className="font-medium">{primaryDomain || <span className="text-muted-foreground/60">{tr ? 'Bağlanmadı' : 'Not connected'}</span>}</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {tr ? 'Google Console originleri' : 'Google Console origins'}
            </p>
            {allowedOrigins.length > 0 ? (
              <div className="space-y-1.5">
                {allowedOrigins.map((origin) => (
                  <div key={origin} className="rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-xs">
                    {origin}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{tr ? 'Önce bir domain bağlayın.' : 'Connect a domain first.'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings form */}
      <SiteForm
        locale={locale}
        action={updateSiteAction.bind(null, site.id)}
        submitLabel={tr ? 'Kaydet' : 'Save'}
        description={
          tr
            ? 'Bu kurallar OpenAI destekli taslaklar ve editoryal inceleme için siteye özel kontrol katmanı olarak kullanılır.'
            : 'These rules serve as the site-specific control layer for OpenAI-assisted drafts and editorial review.'
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
