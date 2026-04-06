import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { Globe2, Languages, PenTool, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { siteDomains, sites } from '@/lib/db/schema'
import { translateRole } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { getThemePreset } from '@/lib/site-theme'

import { createSiteAction } from './actions'
import { SiteForm } from './site-form'

export default async function AdminSitesPage() {
  const session = await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const siteRows = await db
    .select({
      id: sites.id,
      name: sites.name,
      slug: sites.slug,
      defaultLocale: sites.defaultLocale,
      supportedLocales: sites.supportedLocales,
      niche: sites.niche,
      status: sites.status,
      themePreset: sites.themePreset,
      authBrandName: sites.authBrandName,
      googleClientId: sites.googleClientId,
      adsensePublisherId: sites.adsensePublisherId,
      primaryDomain: siteDomains.hostname,
    })
    .from(sites)
    .leftJoin(siteDomains, and(eq(siteDomains.siteId, sites.id), eq(siteDomains.isPrimary, true)))
    .orderBy(desc(sites.createdAt))

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-5">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Siteler' : 'Sites'}</span>
            <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">
              {tr
                ? 'Tüm yayın yüzeylerini tek yönetim panelinden yönetin.'
                : 'Manage every publication from one admin plane.'}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Site oluşturma ve listeleme artık veritabanına bağlı. Sıradaki akışlar manuel makale taslağı, kaynaklar, görevler ve destekli yayınlama.'
                : 'Site creation and listing are now wired to the database. The next workflow slices are manual article drafting, sources, jobs, and assisted publishing.'}
            </CardDescription>
          </div>
          <div className="stats-grid">
            <article>
              <Sparkles className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Toplam site' : 'Total sites'}</span>
              <strong>{siteRows.length}</strong>
            </article>
            <article>
              <Globe2 className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Aktif operatör' : 'Active operator'}</span>
              <strong>{session.displayName}</strong>
            </article>
            <article>
              <Badge variant="outline" className="mb-3 w-fit rounded-full px-3 py-1 capitalize">
                {translateRole(locale, session.role)}
              </Badge>
              <span>{tr ? 'Rol' : 'Role'}</span>
              <strong>{translateRole(locale, session.role)}</strong>
            </article>
            <article>
              <PenTool className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Sıradaki akış' : 'Next slice'}</span>
              <strong>{tr ? 'Manuel makale akışı' : 'Manual article flow'}</strong>
            </article>
          </div>
        </CardHeader>
      </Card>

      <div className="hero-grid">
        <SiteForm
          action={createSiteAction}
          locale={locale}
          submitLabel={tr ? 'Site oluştur' : 'Create site'}
          description={
            tr
              ? 'Bir siteyi editoryal ve gelir kurallarıyla birlikte oluşturun; gelecekteki taslaklar ilk günden doğru sınırları devralsın.'
              : 'Create a site together with its editorial and monetization rule set, so future drafts inherit the right constraints from day one.'
          }
          initialValues={{
            name: '',
            slug: '',
            defaultLocale: 'en',
            supportedLocales: 'en',
            niche: '',
            toneGuide: '',
            editorialGuidelines: '',
            adsensePolicyNotes: '',
            prohibitedTopics: '',
            requiredSections: tr ? 'Özet, Bağlam, Dikkat edilmesi gerekenler' : 'Summary, Context, What to watch',
            reviewChecklist: tr
              ? 'kaynak atfını doğrula, başlık doğruluğunu onayla, AdSense uyumlu sayfa kalitesini kontrol et'
              : 'verify source attribution, confirm headline accuracy, confirm AdSense-safe page quality',
            topicLabelOverrides: '',
            featuredNavLabel: '',
            allNavLabel: '',
            navTopicSlugs: '',
            authBrandName: '',
            googleClientId: '',
            adsensePublisherId: '',
            primaryHostname: '',
            additionalHostnames: '',
            themePreset: 'forge_blue',
            homepageLayout: 'spotlight',
            articleLayout: 'editorial',
            themePrimary: '#1782f6',
            themeAccent: '#6ed6ff',
            themeBackground: '#f7fbff',
          }}
        />

        <Card>
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Site listesi' : 'Site listing'}</span>
            <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">
              {tr ? 'Tanımlı yayın yüzeyleri' : 'Configured publication surfaces'}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {tr
                ? 'Çok dilli yayınlar editoryal ve gelir kurallarını buradan devralır.'
                : 'Multi-locale publications inherit their editorial and monetization rules from here.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {siteRows.length === 0 ? (
              <div className="empty-state">
                <strong>{tr ? 'Henüz site yok.' : 'No sites yet.'}</strong>
                <p className="muted">
                  {tr
                    ? 'İlk ForgePress sitesini burada oluşturun, sonra kaynak bağlayıp editoryal süreci başlatın.'
                    : 'Create the first ForgePress site here, then attach sources and start editorial work.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {siteRows.map((site) => (
                  <article className="list-card space-y-4" key={site.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {site.defaultLocale}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                        {site.status}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {tr ? getThemePreset(site.themePreset).label.tr : getThemePreset(site.themePreset).label.en}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        <Languages className="mr-1 size-3.5" />
                        {site.supportedLocales.join(', ')}
                      </Badge>
                      <Badge variant={site.authBrandName && site.googleClientId ? 'success' : 'outline'} className="rounded-full px-3 py-1">
                        {site.authBrandName && site.googleClientId
                          ? tr
                            ? 'Okuyucu girişi hazır'
                            : 'Reader auth ready'
                          : tr
                            ? 'Okuyucu girişi eksik'
                            : 'Reader auth incomplete'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <strong className="mt-0 text-xl">{site.name}</strong>
                      <p className="muted">/{site.slug}</p>
                      {site.primaryDomain ? <p className="text-sm text-slate-500">{site.primaryDomain}</p> : null}
                    </div>
                    {site.niche ? <p className="text-sm leading-6 text-foreground/85">{site.niche}</p> : null}
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/admin/sites/${site.id}`}>{tr ? 'Kuralları düzenle' : 'Edit rules'}</Link>
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
