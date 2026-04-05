import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { ArrowLeft, RadioTower, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'
import { translateSourceType } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { deleteSourceAction, updateSourceAction } from '../actions'
import { EditSourceForm } from './edit-source-form'

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { sourceId } = await params

  const siteOptions = await db
    .select({
      id: sites.id,
      name: sites.name,
      defaultLocale: sites.defaultLocale,
    })
    .from(sites)

  const [source] = await db
    .select({
      id: sources.id,
      siteId: sources.siteId,
      label: sources.label,
      type: sources.type,
      url: sources.url,
      locale: sources.locale,
      pollMinutes: sources.pollMinutes,
      isActive: sources.isActive,
      siteName: sites.name,
    })
    .from(sources)
    .innerJoin(sites, eq(sites.id, sources.siteId))
    .where(eq(sources.id, sourceId))
    .limit(1)

  if (!source) {
    notFound()
  }

  async function handleDelete() {
    'use server'
    await deleteSourceAction(source.id)
    redirect('/admin/sources')
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-3">
            <span className="eyebrow">{tr ? 'Kaynağı düzenle' : 'Edit source'}</span>
            <CardTitle className="text-[clamp(2.2rem,4vw,3.6rem)] leading-[0.96]">{source.label}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <RadioTower className="mr-1 size-3.5" />
                {source.siteName}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {source.locale}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {translateSourceType(locale, source.type)}
              </Badge>
            </div>
            <CardDescription className="text-sm leading-6">
              {tr
                ? 'Kaynak davranışını, tarama ritmini ve hedef dili tek yüzeyden ayarlayın.'
                : 'Tune source behavior, polling cadence, and target locale from one surface.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/sources">
              <ArrowLeft className="size-4" />
              {tr ? 'Kaynak listesine dön' : 'Back to source list'}
            </Link>
          </Button>
          <form action={handleDelete}>
            <Button className="rounded-xl" variant="destructive" type="submit">
              <Trash2 className="size-4" />
              {tr ? 'Kaynağı sil' : 'Delete source'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <EditSourceForm
        sourceId={source.id}
        siteOptions={siteOptions}
        initialValues={{
          siteId: source.siteId,
          label: source.label,
          type: source.type,
          url: source.url,
          locale: source.locale,
          pollMinutes: source.pollMinutes,
          isActive: source.isActive ? 'true' : 'false',
        }}
        action={updateSourceAction}
        locale={locale}
      />
    </section>
  )
}
