import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { Globe2, RadioTower, Rss, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'
import { translateSourceType } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { createSourceAction } from './actions'
import { SourceForm } from './source-form'

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId: preselectedSiteId } = await searchParams

  const siteOptions = await db
    .select({
      id: sites.id,
      name: sites.name,
      defaultLocale: sites.defaultLocale,
    })
    .from(sites)
    .orderBy(desc(sites.createdAt))

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
          <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">
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

  const primarySite = siteOptions.find((s) => s.id === preselectedSiteId) ?? siteOptions[0]

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-5">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Kaynaklar' : 'Sources'}</span>
            <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">
              {tr ? 'İçe aktarma kaynakları artık admin panelinden düzenlenebilir.' : 'Ingestion sources are now editable from the admin plane.'}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Site bazında RSS feedleri, sitemap taramaları ve manuel URL kuyrukları ekleyin. Bu, gelecekteki içe aktarma görevlerinin çalışacağı kontrol yüzeyini oluşturur.'
                : 'Add RSS feeds, sitemap crawls, and manual URL queues per site. This creates the control surface the future ingestion jobs will operate against.'}
            </CardDescription>
          </div>
          <div className="stats-grid">
            <article>
              <RadioTower className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Toplam kaynak' : 'Total sources'}</span>
              <strong>{sourceRows.length}</strong>
            </article>
            <article>
              <Globe2 className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Tanımlı siteler' : 'Configured sites'}</span>
              <strong>{siteOptions.length}</strong>
            </article>
            <article>
              <Rss className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Birincil kaynak türü' : 'Primary source type'}</span>
              <strong>RSS</strong>
            </article>
            <article>
              <Sparkles className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Mod' : 'Mode'}</span>
              <strong>{tr ? 'Operatör yönetimli' : 'Operator managed'}</strong>
            </article>
          </div>
        </CardHeader>
      </Card>

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
            <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">
              {tr ? 'İçe aktarılmayı bekleyen sinyaller' : 'Signals waiting to be ingested'}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {tr
                ? 'Kaynak tanımları gelecekteki içe aktarma görevleri ve zamanlamaları için tetikleme yüzeyi olur.'
                : 'Source definitions become the trigger surface for future ingestion jobs and schedules.'}
            </CardDescription>
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
