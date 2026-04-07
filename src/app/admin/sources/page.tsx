import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'
import { translateSourceType } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { getActiveSiteId } from '@/lib/active-site.server'

import { createSourceAction } from './actions'
import { SourceForm } from './source-form'
import { SourceImportPanel } from './source-import'

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId: preselectedSiteId } = await searchParams

  const [siteOptions, cookieActiveSiteId] = await Promise.all([
    db.select({ id: sites.id, name: sites.name, defaultLocale: sites.defaultLocale }).from(sites).orderBy(desc(sites.createdAt)),
    getActiveSiteId(),
  ])

  const sourceRows = await db
    .select({
      id: sources.id,
      label: sources.label,
      type: sources.type,
      url: sources.url,
      locale: sources.locale,
      isActive: sources.isActive,
      pollMinutes: sources.pollMinutes,
      siteName: sites.name,
    })
    .from(sources)
    .innerJoin(sites, eq(sites.id, sources.siteId))
    .orderBy(desc(sources.createdAt))

  if (siteOptions.length === 0) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{tr ? 'Kaynaklar' : 'Sources'}</span>
          <CardTitle className="text-2xl font-bold">
            {tr ? 'Kaynak feedleri eklemeden önce bir site oluşturun.' : 'Create a site before adding source feeds.'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? 'Kaynak içe aktarma; dil, politika ve ilerideki taslak yönlendirmesi için bir site hedefine ihtiyaç duyar.'
              : 'Source ingestion needs a site target for locale, policy, and later draft routing.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/admin/sites">{tr ? 'Site yönetimini aç' : 'Open site management'}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const primarySite = siteOptions.find((s) => s.id === (preselectedSiteId ?? cookieActiveSiteId)) ?? siteOptions[0]

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{tr ? 'Yeni Kaynak' : 'New Source'}</p>
          <h1 className="mt-0.5 text-xl font-semibold text-foreground">
            {tr ? 'Kaynak ekle' : 'Add source'}
          </h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {tr ? `${sourceRows.length} kaynak tanımlı` : `${sourceRows.length} sources configured`}
        </span>
      </div>

      <div className="space-y-6">
        <SourceImportPanel siteOptions={siteOptions} locale={locale} />
      </div>

      <div className="hero-grid">
        <SourceForm
          locale={locale}
          action={createSourceAction}
          siteOptions={siteOptions}
          initialValues={{
            siteId: primarySite.id,
            label: '',
            type: 'rss',
            url: '',
            locale: primarySite.defaultLocale,
            pollMinutes: 60,
            isActive: 'true',
          }}
          submitLabel={tr ? 'Kaynak oluştur' : 'Create source'}
          description={
            tr
              ? 'Şimdi bir feed hedefi tanımlayın; sıradaki adımda kuyruk tabanlı içe aktarma aynı kayıtlara bağlanabilir.'
              : 'Set up a feed target now; queue-driven ingestion can attach to the same records next.'
          }
        />

        <Card>
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Tanımlı kaynaklar' : 'Configured sources'}</span>
            <CardTitle className="text-lg">
              {tr ? 'Tanımlı kaynaklar' : 'Configured sources'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceRows.length === 0 ? (
              <div className="empty-state">
                <strong>{tr ? 'Henüz kaynak yok.' : 'No sources yet.'}</strong>
                <p className="muted">{tr ? 'İçe aktarma katmanını hazırlamak için ilk kaynağı oluşturun.' : 'Create the first source to prepare the ingestion layer.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sourceRows.map((source) => (
                  <Link
                    className="list-card block space-y-3 transition hover:border-primary/40 hover:bg-accent/30"
                    href={`/admin/sources/${source.id}`}
                    key={source.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {source.siteName}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {source.locale}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                          {source.isActive ? (tr ? 'aktif' : 'active') : tr ? 'duraklatıldı' : 'paused'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <strong className="mt-0 text-xl">{source.label}</strong>
                      <p className="muted">
                        {translateSourceType(locale, source.type)} · {tr ? `her ${source.pollMinutes} dk` : `every ${source.pollMinutes} min`}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-foreground/80">{source.url}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
