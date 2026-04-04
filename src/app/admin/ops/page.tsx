import { requireAdminSession } from '@/lib/auth'
import { getOperationalChecks } from '@/lib/ops'

export default async function AdminOpsPage() {
  await requireAdminSession()
  const ops = await getOperationalChecks()

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Operations</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', lineHeight: 0.96 }}>
          Coolify and runtime readiness checks.
        </h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          This surface summarizes whether the app is ready for deployment and runtime health checks in
          Coolify. Use the readiness endpoint for external monitoring and this page for operator
          visibility.
        </p>
      </header>

      <section className="stats-grid">
        <article>
          <span>Sites</span>
          <strong>{ops.counts.sites}</strong>
        </article>
        <article>
          <span>Articles</span>
          <strong>{ops.counts.articles}</strong>
        </article>
        <article>
          <span>Jobs</span>
          <strong>{ops.counts.jobs}</strong>
        </article>
        <article>
          <span>Overall</span>
          <strong>{ops.ok ? 'Ready' : 'Needs attention'}</strong>
        </article>
      </section>

      <div className="hero-grid">
        <section className="panel stack">
          <span className="eyebrow">Checks</span>
          <article className="list-card">
            <span>Application URL</span>
            <strong>{ops.checks.appUrlConfigured ? 'Configured' : 'Missing'}</strong>
          </article>
          <article className="list-card">
            <span>Session secret</span>
            <strong>{ops.checks.sessionSecretConfigured ? 'Configured' : 'Missing'}</strong>
          </article>
          <article className="list-card">
            <span>OpenAI</span>
            <strong>{ops.checks.openAiConfigured ? 'Configured' : 'Missing'}</strong>
          </article>
          <article className="list-card">
            <span>Cloudflare</span>
            <strong>{ops.checks.cloudflareConfigured ? 'Configured' : 'Optional / missing'}</strong>
          </article>
        </section>

        <section className="panel stack">
          <span className="eyebrow">Connectivity</span>
          <article className="list-card">
            <span>Database</span>
            <strong>{ops.checks.database.ok ? 'Reachable' : 'Unavailable'}</strong>
            {'error' in ops.checks.database && ops.checks.database.error ? (
              <p className="form-error">{ops.checks.database.error}</p>
            ) : null}
          </article>
          <article className="list-card">
            <span>Queue</span>
            <strong>{ops.checks.queue.ok ? 'Reachable' : 'Unavailable'}</strong>
            {'error' in ops.checks.queue && ops.checks.queue.error ? (
              <p className="form-error">{ops.checks.queue.error}</p>
            ) : null}
          </article>
          <article className="list-card">
            <span>Readiness endpoint</span>
            <strong>/api/ops/readiness</strong>
          </article>
        </section>
      </div>
    </section>
  )
}
