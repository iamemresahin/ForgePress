import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'
import { translateSourceType } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

export default async function SiteSourcesPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId } = await params

  const [site] = await db.select({ id: sites.id, name: sites.name, defaultLocale: sites.defaultLocale }).from(sites).where(eq(sites.id, siteId)).limit(1)
  if (!site) notFound()

  const sourceRows = await db
    .select({
      id: sources.id,
      label: sources.label,
      type: sources.type,
      url: sources.url,
      locale: sources.locale,
      isActive: sources.isActive,
      pollMinutes: sources.pollMinutes,
    })
    .from(sources)
    .where(eq(sources.siteId, siteId))
    .orderBy(desc(sources.createdAt))

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{site.name}</span>
          <CardTitle className="text-xl font-semibold">
            {tr ? 'Kaynaklar' : 'Sources'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? `${site.name} sitesine ait ${sourceRows.length} kaynak`
              : `${sourceRows.length} sources for ${site.name}`}
          </CardDescription>
          <Button asChild className="rounded-xl w-fit">
            <Link href={`/admin/sources?siteId=${siteId}`}>{tr ? 'Yeni kaynak' : 'New source'}</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {sourceRows.length === 0 ? (
            <div className="empty-state">
              <strong>{tr ? 'Bu siteye ait kaynak yok.' : 'No sources for this site.'}</strong>
              <p className="muted">{tr ? 'İlk kaynağı oluşturun.' : 'Create the first source.'}</p>
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
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {source.locale}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                      {source.isActive ? (tr ? 'aktif' : 'active') : (tr ? 'duraklatıldı' : 'paused')}
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
    </section>
  )
}
