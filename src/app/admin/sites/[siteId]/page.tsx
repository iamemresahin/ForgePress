import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Site kurallarını düzenle' : 'Edit site rules'}</span>
            <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">{site.name}</CardTitle>
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
