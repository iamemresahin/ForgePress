import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { ArrowRight, FileText, Globe2, RadioTower, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleLocalizations, articles, jobs, sites, sources } from '@/lib/db/schema'
import { getInterfaceLocale } from '@/lib/interface-locale.server'
import { translateArticleStatus, translateJobKind, translateSourceType } from '@/lib/interface-locale'

export default async function AdminPage() {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'

  const [siteRows, articleRows, sourceRows, jobRows] = await Promise.all([
    db.select().from(sites).orderBy(desc(sites.updatedAt)).limit(4),
    db
      .select({
        id: articles.id,
        status: articles.status,
        updatedAt: articles.updatedAt,
        title: articleLocalizations.title,
        locale: articleLocalizations.locale,
        siteName: sites.name,
      })
      .from(articles)
      .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
      .innerJoin(sites, eq(sites.id, articles.siteId))
      .orderBy(desc(articles.updatedAt))
      .limit(5),
    db.select().from(sources).orderBy(desc(sources.createdAt)).limit(5),
    db
      .select({
        id: jobs.id,
        kind: jobs.kind,
        status: jobs.status,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .orderBy(desc(jobs.createdAt))
      .limit(6),
  ])

  const publishedCount = articleRows.filter((article) => article.status === 'published').length
  const queuedJobs = jobRows.filter((job) => job.status === 'queued' || job.status === 'running').length
  const formatDate = (value: Date) => new Date(value).toLocaleDateString(tr ? 'tr-TR' : 'en-US')

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-[0_24px_60px_-42px_rgba(14,165,233,0.22)]">
          <CardHeader className="space-y-3">
            <Badge className="w-fit rounded-full bg-primary/12 px-3 py-1 text-primary shadow-none">
              {tr ? 'Siteler' : 'Sites'}
            </Badge>
            <CardTitle className="text-4xl">{siteRows.length}</CardTitle>
            <CardDescription className="text-slate-600">
              {tr ? 'ForgePress için yapılandırılmış yayın yüzeyleri.' : 'Publication surfaces configured for ForgePress.'}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.16)]">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              {tr ? 'Makaleler' : 'Articles'}
            </Badge>
            <CardTitle className="text-4xl">{articleRows.length}</CardTitle>
            <CardDescription>{tr ? 'İş akışında ilerleyen güncel editoryal kayıtlar.' : 'Recent editorial items currently moving through the workflow.'}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.16)]">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              {tr ? 'Yayında' : 'Published'}
            </Badge>
            <CardTitle className="text-4xl">{publishedCount}</CardTitle>
            <CardDescription>{tr ? 'Genel site yüzeylerinde görünür olan içerikler.' : 'Items already visible on public site surfaces.'}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.16)]">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              {tr ? 'Görevler' : 'Jobs'}
            </Badge>
            <CardTitle className="text-4xl">{queuedJobs}</CardTitle>
            <CardDescription>{tr ? 'Arka planda bekleyen ya da çalışan kuyruk öğeleri.' : 'Queue items currently waiting or running in the background.'}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-sky-100 shadow-[0_24px_70px_-46px_rgba(14,165,233,0.18)]">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-sky-50 via-white to-cyan-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                  {tr ? 'Akış özeti' : 'Workflow pulse'}
                </span>
                <CardTitle className="text-3xl">{tr ? 'Yayın kontrolü tek bakışta' : 'Publishing control at a glance'}</CardTitle>
                <CardDescription className="max-w-2xl text-slate-600">
                  {tr
                    ? 'Sıradaki önemli noktalar için özet görünüm: site hazırlığı, son taslaklar ve kuyruk yoğunluğu.'
                    : 'A dashboard-01 style overview for what matters next: site readiness, recent drafts, and queue pressure.'}
                </CardDescription>
              </div>
              <Button asChild className="rounded-2xl">
                <Link href="/admin/articles">
                  {tr ? 'Editoryal kuyruğu aç' : 'Open editorial queue'}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <Globe2 className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium">{tr ? 'Site kuralları' : 'Site rules'}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {siteRows.length > 0
                  ? tr
                    ? 'Politika, dil ve gelir kuralları her yayın için ayrı tutuluyor.'
                    : 'Policy, locale, and monetization rules are available per publication.'
                  : tr
                    ? 'İş akışının kalanını açmak için bir site oluşturun.'
                    : 'Create a site to activate the rest of the workflow.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <FileText className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium">{tr ? 'Editoryal kuyruk' : 'Editorial queue'}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {tr ? 'Manuel ve AI destekli taslaklar aynı inceleme öncelikli pipeline üzerinden ilerler.' : 'Manual and AI-assisted drafts flow through the same review-first pipeline.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <Workflow className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium">{tr ? 'Operasyon görünürlüğü' : 'Operational visibility'}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {tr ? 'Görevler, readiness kontrolleri ve kaynak kapsamı tek kabukta görünür kalır.' : 'Jobs, readiness checks, and source coverage stay visible from one shell.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.14)]">
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Hızlı bağlantılar' : 'Quick links'}</span>
            <CardTitle className="text-[clamp(1.8rem,3vw,2.4rem)]">{tr ? 'Operatör kısayolları' : 'Operator shortcuts'}</CardTitle>
            <CardDescription>{tr ? 'Sık kullanılan akışlara doğrudan geçin.' : 'Jump straight into the high-frequency flows.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="h-12 w-full justify-between rounded-2xl">
              <Link href="/admin/sites">
                {tr ? 'Siteleri yönet' : 'Manage sites'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full justify-between rounded-2xl">
              <Link href="/admin/articles">
                {tr ? 'Makale taslağı oluştur' : 'Create article draft'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full justify-between rounded-2xl">
              <Link href="/admin/sources">
                {tr ? 'Kaynak kapsamını incele' : 'Review source coverage'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full justify-between rounded-2xl">
              <Link href="/admin/ops">
                {tr ? 'Çalışma sağlığını kontrol et' : 'Check runtime health'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.14)]">
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Son taslaklar' : 'Recent drafts'}</span>
            <CardTitle className="text-[clamp(1.8rem,3vw,2.4rem)]">{tr ? 'Editoryal kuyruk' : 'Editorial queue'}</CardTitle>
            <CardDescription>{tr ? 'Tüm tanımlı sitelerdeki son içerik hareketleri.' : 'Latest content activity across all configured sites.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articleRows.length === 0 ? (
              <div className="empty-state">
                <strong>{tr ? 'Henüz makale yok.' : 'No articles yet.'}</strong>
                <p className="muted">{tr ? 'Dashboard akışını doldurmak için ilk taslağı oluşturun.' : 'Create the first draft to populate the dashboard feed.'}</p>
              </div>
            ) : (
              articleRows.map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/articles/${article.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {article.siteName}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {article.locale}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                      {translateArticleStatus(locale, article.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold tracking-tight">{article.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tr ? 'Güncellendi' : 'Updated'} {formatDate(article.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.14)]">
            <CardHeader className="space-y-2">
              <span className="eyebrow">{tr ? 'Kaynak kapsamı' : 'Source coverage'}</span>
              <CardTitle className="text-[clamp(1.8rem,3vw,2.4rem)]">{tr ? 'Son kaynak uçları' : 'Latest source endpoints'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sourceRows.length === 0 ? (
                <div className="empty-state">
                  <strong>{tr ? 'Henüz kaynak tanımlı değil.' : 'No sources configured.'}</strong>
                  <p className="muted">{tr ? 'İçe aktarmayı başlatmak için RSS, sitemap veya manuel feed ekleyin.' : 'Add RSS, sitemap, or manual feeds to begin ingestion.'}</p>
                </div>
              ) : (
                sourceRows.map((source) => (
                  <div key={source.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{source.label}</p>
                      <Badge variant={source.isActive ? 'success' : 'outline'} className="rounded-full px-3 py-1 capitalize">
                        {source.isActive ? (tr ? 'aktif' : 'active') : tr ? 'duraklatıldı' : 'paused'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {translateSourceType(locale, source.type)} · {tr ? `her ${source.pollMinutes} dk` : `every ${source.pollMinutes} min`}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-100/70 shadow-[0_24px_60px_-46px_rgba(59,130,246,0.14)]">
            <CardHeader className="space-y-2">
              <span className="eyebrow">{tr ? 'Görev akışı' : 'Job stream'}</span>
              <CardTitle className="text-[clamp(1.8rem,3vw,2.4rem)]">{tr ? 'Son arka plan işleri' : 'Recent background work'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobRows.length === 0 ? (
                <div className="empty-state">
                  <strong>{tr ? 'Henüz görev yok.' : 'No jobs yet.'}</strong>
                  <p className="muted">{tr ? 'Sistem hareketini burada görmek için manuel görev kuyruğa alın.' : 'Queue a manual job to see system activity here.'}</p>
                </div>
              ) : (
                jobRows.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold capitalize">{translateJobKind(locale, job.kind)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === 'completed' ? 'success' : 'outline'}
                      className="rounded-full px-3 py-1 capitalize"
                    >
                      {job.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-[0_24px_60px_-42px_rgba(14,165,233,0.2)]">
            <CardHeader className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                {tr ? 'Çalışma zamanı' : 'Runtime'}
              </span>
              <CardTitle className="text-2xl">{tr ? 'Sistem korkulukları' : 'System guardrails'}</CardTitle>
              <CardDescription className="text-slate-600">
                {tr ? 'OpenAI, kuyruk ve operasyon kontrolleri tek operatör kabuğunda toplanır.' : 'OpenAI, queue, and ops checks live under one operator shell.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 shadow-none">
                <RadioTower className="mr-1 size-3.5" />
                {tr ? 'Kaynaklar' : 'Sources'}
              </Badge>
              <Badge className="rounded-full bg-orange-100 px-3 py-1 text-orange-700 shadow-none">
                <Sparkles className="mr-1 size-3.5" />
                {tr ? 'Taslaklar' : 'Drafting'}
              </Badge>
              <Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 shadow-none">
                <ShieldCheck className="mr-1 size-3.5" />
                {tr ? 'Operasyonlar' : 'Ops'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
