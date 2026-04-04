import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites, sources } from '@/lib/db/schema'

import { createSourceAction } from './actions'
import { SourceForm } from './source-form'

export default async function AdminSourcesPage() {
  await requireAdminSession()

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
      <section className="panel stack">
        <span className="eyebrow">Sources</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Create a site before adding source feeds.
        </h1>
        <p className="muted">
          Source ingestion needs a site target for locale, policy, and later draft routing.
        </p>
        <Link className="button primary" href="/admin/sites">
          Open site management
        </Link>
      </section>
    )
  }

  const primarySite = siteOptions[0]

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Sources</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Ingestion sources are now editable from the admin plane.
        </h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Add RSS feeds, sitemap crawls, and manual URL queues per site. This creates the control
          surface the future ingestion jobs will operate against.
        </p>
      </header>

      <div className="hero-grid">
        <SourceForm
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
          submitLabel="Create source"
          description="Set up a feed target now; queue-driven ingestion can attach to the same records next."
        />

        <section className="panel stack">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Configured sources</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Signals waiting to be ingested</h2>
          </div>

          {sourceRows.length === 0 ? (
            <div className="empty-state">
              <strong>No sources yet.</strong>
              <p className="muted">Create the first source to prepare the ingestion layer.</p>
            </div>
          ) : (
            <div className="stack">
              {sourceRows.map((source) => (
                <Link className="list-card article-link" href={`/admin/sources/${source.id}`} key={source.id}>
                  <span>
                    {source.siteName} · {source.locale} · {source.isActive ? 'active' : 'paused'}
                  </span>
                  <strong>{source.label}</strong>
                  <p className="muted">
                    {source.type} · every {source.pollMinutes} min
                  </p>
                  <p className="muted">{source.url}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
