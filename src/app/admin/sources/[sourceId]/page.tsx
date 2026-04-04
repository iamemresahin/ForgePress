import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'

import { deleteSourceAction, updateSourceAction } from '../actions'
import { EditSourceForm } from './edit-source-form'

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>
}) {
  await requireAdminSession()
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
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Edit source</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', lineHeight: 0.96 }}>{source.label}</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          {source.siteName} · {source.locale} · {source.type}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="button" href="/admin/sources">
            Back to source list
          </Link>
          <form action={handleDelete}>
            <button className="button danger" type="submit">
              Delete source
            </button>
          </form>
        </div>
      </header>

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
      />
    </section>
  )
}
