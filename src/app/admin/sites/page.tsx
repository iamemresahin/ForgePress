import Link from 'next/link'
import { desc } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'

import { createSiteAction } from './actions'
import { SiteForm } from './site-form'

export default async function AdminSitesPage() {
  const session = await requireAdminSession()
  const siteRows = await db.select().from(sites).orderBy(desc(sites.createdAt))

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Sites</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Manage every publication from one admin plane.
        </h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Site creation and listing are now wired to the database. The next workflow slices are
          manual article drafting, sources, jobs, and assisted publishing.
        </p>
        <div className="stats-grid">
          <article>
            <span>Total sites</span>
            <strong>{siteRows.length}</strong>
          </article>
          <article>
            <span>Active operator</span>
            <strong>{session.displayName}</strong>
          </article>
          <article>
            <span>Role</span>
            <strong>{session.role.replace('_', ' ')}</strong>
          </article>
          <article>
            <span>Next slice</span>
            <strong>Manual article flow</strong>
          </article>
        </div>
      </header>

      <div className="hero-grid">
        <SiteForm
          action={createSiteAction}
          submitLabel="Create site"
          description="Create a site together with its editorial and monetization rule set, so future drafts inherit the right constraints from day one."
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
            requiredSections: 'Summary, Context, What to watch',
            reviewChecklist: 'verify source attribution, confirm headline accuracy, confirm AdSense-safe page quality',
          }}
        />

        <section className="panel stack">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Site listing</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Configured publication surfaces</h2>
          </div>

          {siteRows.length === 0 ? (
            <div className="empty-state">
              <strong>No sites yet.</strong>
              <p className="muted">
                Create the first ForgePress site here, then attach sources and start editorial work.
              </p>
            </div>
          ) : (
            <div className="stack">
              {siteRows.map((site) => (
                <article className="list-card" key={site.id}>
                  <span>
                    {site.defaultLocale} · {site.status}
                  </span>
                  <strong>{site.name}</strong>
                  <p className="muted">
                    /{site.slug} · locales: {site.supportedLocales.join(', ')}
                  </p>
                  {site.niche ? <p>{site.niche}</p> : null}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link className="button" href={`/admin/sites/${site.id}`}>
                      Edit rules
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
