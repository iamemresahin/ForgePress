const queueItems = [
  { title: 'Apple supplier chain shake-up', locale: 'en', status: 'Awaiting review' },
  { title: 'Neue EV-Zulassungen in Europa', locale: 'de', status: 'Image missing' },
  { title: 'Yeni sağlık düzenlemesi özeti', locale: 'tr', status: 'Ready to publish' },
]

const sourceItems = [
  { label: 'Global tech RSS', type: 'rss', poll: '15 min' },
  { label: 'Auto market sitemap', type: 'sitemap', poll: '30 min' },
  { label: 'Curated manual URLs', type: 'manual_url', poll: 'On demand' },
]

export default function AdminPage() {
  return (
    <main className="page">
      <div className="shell stack">
        <header className="panel stack">
          <span className="eyebrow">Admin shell</span>
          <h1 style={{ fontSize: 'clamp(2.8rem, 5vw, 4.6rem)', lineHeight: 0.96 }}>
            ForgePress control plane
          </h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            This is the first real admin surface for the platform. It is intentionally product-shaped:
            site controls, content queue, source monitoring, and jobs are the center of gravity.
          </p>
        </header>

        <section className="stats-grid">
          <article>
            <span>Live sites</span>
            <strong>0</strong>
          </article>
          <article>
            <span>Queued items</span>
            <strong>3</strong>
          </article>
          <article>
            <span>Sources configured</span>
            <strong>3</strong>
          </article>
          <article>
            <span>Job system</span>
            <strong>Ready for wiring</strong>
          </article>
        </section>

        <section className="hero-grid">
          <div className="panel stack">
            <span className="eyebrow">Editorial queue</span>
            {queueItems.map((item) => (
              <article className="list-card" key={item.title}>
                <span>
                  {item.locale} · {item.status}
                </span>
                <strong>{item.title}</strong>
              </article>
            ))}
          </div>

          <div className="panel stack">
            <span className="eyebrow">Source layer</span>
            {sourceItems.map((item) => (
              <article className="list-card" key={item.label}>
                <span>
                  {item.type} · {item.poll}
                </span>
                <strong>{item.label}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <span className="eyebrow">Next implementation slice</span>
          <p className="muted">
            Immediate build targets: environment boot checks, database migrations, site creation flow,
            article draft creation, and queue-backed ingestion jobs.
          </p>
        </section>
      </div>
    </main>
  )
}
