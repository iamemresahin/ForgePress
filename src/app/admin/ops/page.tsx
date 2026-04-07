import { requirePlatformAdminSession } from '@/lib/auth'
import { getOperationalChecks } from '@/lib/ops'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Cloud, Database, KeyRound, ShieldCheck, Workflow } from 'lucide-react'

export default async function AdminOpsPage() {
  await requirePlatformAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const ops = await getOperationalChecks()

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Operasyonlar' : 'Operations'}</span>
            <CardTitle className="text-2xl font-bold">
              {tr ? 'Coolify ve çalışma hazırlık kontrolleri.' : 'Coolify and runtime readiness checks.'}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Bu yüzey, uygulamanın Coolify dağıtımı ve çalışma sağlık kontrolleri için hazır olup olmadığını özetler. Harici izleme için readiness endpointini, operatör görünürlüğü için bu sayfayı kullanın.'
                : 'This surface summarizes whether the app is ready for deployment and runtime health checks in Coolify. Use the readiness endpoint for external monitoring and this page for operator visibility.'}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <section className="stats-grid">
        <article>
          <Activity className="mb-3 size-5 text-primary" />
          <span>{tr ? 'Siteler' : 'Sites'}</span>
          <strong>{ops.counts.sites}</strong>
        </article>
        <article>
          <Workflow className="mb-3 size-5 text-primary" />
          <span>{tr ? 'Makaleler' : 'Articles'}</span>
          <strong>{ops.counts.articles}</strong>
        </article>
        <article>
          <Database className="mb-3 size-5 text-primary" />
          <span>{tr ? 'Görevler' : 'Jobs'}</span>
          <strong>{ops.counts.jobs}</strong>
        </article>
        <article>
          <ShieldCheck className="mb-3 size-5 text-primary" />
          <span>{tr ? 'Genel durum' : 'Overall'}</span>
          <strong>{ops.ok ? (tr ? 'Hazır' : 'Ready') : tr ? 'Dikkat gerekiyor' : 'Needs attention'}</strong>
        </article>
      </section>

      <div className="hero-grid">
        <Card>
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Kontroller' : 'Checks'}</span>
            <CardTitle className="text-lg">
              {tr ? 'Yapılandırma durumu' : 'Configuration status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <article className="list-card">
              <div className="flex items-center gap-3">
                <Cloud className="size-5 text-primary" />
                <div>
                  <span>{tr ? 'Uygulama URL' : 'Application URL'}</span>
                  <strong>{ops.checks.appUrlConfigured ? (tr ? 'Tanımlı' : 'Configured') : tr ? 'Eksik' : 'Missing'}</strong>
                </div>
              </div>
            </article>
            <article className="list-card">
              <div className="flex items-center gap-3">
                <KeyRound className="size-5 text-primary" />
                <div>
                  <span>{tr ? 'Session secret' : 'Session secret'}</span>
                  <strong>{ops.checks.sessionSecretConfigured ? (tr ? 'Tanımlı' : 'Configured') : tr ? 'Eksik' : 'Missing'}</strong>
                </div>
              </div>
            </article>
            <article className="list-card">
              <div className="flex items-center gap-3">
                <Badge variant={ops.checks.openAiConfigured ? 'success' : 'outline'}>OpenAI</Badge>
                <div>
                  <span>OpenAI</span>
                  <strong>{ops.checks.openAiConfigured ? (tr ? 'Tanımlı' : 'Configured') : tr ? 'Eksik' : 'Missing'}</strong>
                </div>
              </div>
            </article>
            <article className="list-card">
              <div className="flex items-center gap-3">
                <Badge variant={ops.checks.cloudflareConfigured ? 'success' : 'outline'}>Cloudflare</Badge>
                <div>
                  <span>Cloudflare</span>
                  <strong>{ops.checks.cloudflareConfigured ? (tr ? 'Tanımlı' : 'Configured') : tr ? 'Opsiyonel / eksik' : 'Optional / missing'}</strong>
                </div>
              </div>
            </article>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Bağlantı' : 'Connectivity'}</span>
            <CardTitle className="text-lg">
              {tr ? 'Çalışma erişilebilirliği' : 'Runtime reachability'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <article className="list-card">
              <span>{tr ? 'Veritabanı' : 'Database'}</span>
              <strong>{ops.checks.database.ok ? (tr ? 'Erişilebilir' : 'Reachable') : tr ? 'Ulaşılamıyor' : 'Unavailable'}</strong>
              {'error' in ops.checks.database && ops.checks.database.error ? (
                <p className="form-error">{ops.checks.database.error}</p>
              ) : null}
            </article>
            <article className="list-card">
              <span>{tr ? 'Kuyruk' : 'Queue'}</span>
              <strong>{ops.checks.queue.ok ? (tr ? 'Erişilebilir' : 'Reachable') : tr ? 'Ulaşılamıyor' : 'Unavailable'}</strong>
              {'error' in ops.checks.queue && ops.checks.queue.error ? (
                <p className="form-error">{ops.checks.queue.error}</p>
              ) : null}
            </article>
            <article className="list-card">
              <span>{tr ? 'Readiness endpointi' : 'Readiness endpoint'}</span>
              <strong>/api/ops/readiness</strong>
            </article>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
