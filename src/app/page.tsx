const sites = [
  { name: 'Verdict Loop', locale: 'en', niche: 'AI business news', status: 'Review-first' },
  { name: 'Motor Atlas', locale: 'de', niche: 'Automotive updates', status: 'Drafting' },
  { name: 'Shift Health', locale: 'tr', niche: 'Health explainers', status: 'Manual review' },
]

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero-grid">
          <div className="panel stack">
            <span className="eyebrow">ForgePress Platform</span>
            <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5.8rem)', lineHeight: 0.95 }}>
              One engine for running many AI-assisted publishing sites.
            </h1>
            <p className="muted" style={{ maxWidth: 720, fontSize: '1.05rem' }}>
              ForgePress is now wired as a platform shell, not a marketing page. The next layers are
              the admin console, article queue, source ingestion, rewrite jobs, and Coolify-ready
              deployment primitives.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a className="button primary" href="/login">
                Sign in to admin
              </a>
              <a className="button" href="/api/health">
                Check system health
              </a>
            </div>
          </div>

          <div className="panel stack">
            <span className="eyebrow">Deployment baseline</span>
            <div className="pill">Next.js + PostgreSQL + Valkey + Drizzle + BullMQ</div>
            <p className="muted">
              This stack is selected to run cleanly on Coolify with a self-hosted database and queue
              service, keeping V1 cost low while supporting multi-site publishing.
            </p>
            <div className="stack">
              <div className="list-card">
                <span>Content workflow</span>
                <strong>Source ingest -&gt; rewrite -&gt; review -&gt; publish</strong>
              </div>
              <div className="list-card">
                <span>Revenue model</span>
                <strong>AdSense-first templates with controlled slot density</strong>
              </div>
              <div className="list-card">
                <span>Editorial control</span>
                <strong>No blind auto-publish in V1</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel stack">
          <div className="stats-grid">
            <article>
              <span>Sites modelled</span>
              <strong>3</strong>
            </article>
            <article>
              <span>Core modules</span>
              <strong>6</strong>
            </article>
            <article>
              <span>Primary DB</span>
              <strong>PostgreSQL</strong>
            </article>
            <article>
              <span>Queue backend</span>
              <strong>Valkey</strong>
            </article>
          </div>
        </section>

        <section className="panel stack">
          <div>
            <span className="eyebrow">Managed sites</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>Multi-site control is first-class.</h2>
          </div>
          <table className="site-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Locale</th>
                <th>Niche</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.name}>
                  <td>{site.name}</td>
                  <td>{site.locale}</td>
                  <td>{site.niche}</td>
                  <td>{site.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}
