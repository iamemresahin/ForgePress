import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs, sites } from '@/lib/db/schema'

import { JobTriggerForm } from './job-trigger-form'

export default async function AdminJobsPage() {
  await requireAdminSession()

  const siteOptions = await db
    .select({
      id: sites.id,
      name: sites.name,
    })
    .from(sites)
    .orderBy(desc(sites.createdAt))

  const jobRows = await db
    .select({
      id: jobs.id,
      kind: jobs.kind,
      status: jobs.status,
      attempts: jobs.attempts,
      errorMessage: jobs.errorMessage,
      createdAt: jobs.createdAt,
      siteName: sites.name,
    })
    .from(jobs)
    .leftJoin(sites, eq(sites.id, jobs.siteId))
    .orderBy(desc(jobs.createdAt))

  if (siteOptions.length === 0) {
    return (
      <section className="panel stack">
        <span className="eyebrow">Jobs</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Create a site before queueing jobs.
        </h1>
        <p className="muted">
          Jobs need a site target to scope ingestion, drafting, localization, and publishing work.
        </p>
        <Link className="button primary" href="/admin/sites">
          Open site management
        </Link>
      </section>
    )
  }

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Jobs</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Queue-backed operations now have an admin trigger surface.
        </h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          This screen creates persistent job records and attempts to enqueue BullMQ tasks. It is the
          operational hinge for ingestion, rewrite, image, localization, and publish flows.
        </p>
      </header>

      <div className="hero-grid">
        <JobTriggerForm siteOptions={siteOptions} />

        <section className="panel stack">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Recent runs</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Operational trace</h2>
          </div>

          {jobRows.length === 0 ? (
            <div className="empty-state">
              <strong>No jobs yet.</strong>
              <p className="muted">Queue the first manual job to validate the pipeline contract.</p>
            </div>
          ) : (
            <div className="stack">
              {jobRows.map((job) => (
                <article className="list-card" key={job.id}>
                  <span>
                    {job.siteName ?? 'No site'} · {job.kind} · {job.status}
                  </span>
                  <strong>{job.id.slice(0, 8)}</strong>
                  <p className="muted">Attempts: {job.attempts}</p>
                  {job.errorMessage ? <p className="form-error">{job.errorMessage}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
