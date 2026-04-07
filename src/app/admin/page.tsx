import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { ArrowRight, FileText, Globe2, RadioTower, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

  const publishedCount = articleRows.filter((a) => a.status === 'published').length
  const queuedJobs = jobRows.filter((j) => j.status === 'queued' || j.status === 'running').length
  const formatDate = (value: Date) =>
    new Date(value).toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short' })

  return (
    <section className="space-y-5">
      {/* Stat row */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: tr ? 'Siteler' : 'Sites', value: siteRows.length, icon: Globe2 },
          { label: tr ? 'Makaleler' : 'Articles', value: articleRows.length, icon: FileText },
          { label: tr ? 'Yayında' : 'Published', value: publishedCount, icon: RadioTower },
          { label: tr ? 'Görevler' : 'Jobs', value: queuedJobs, icon: Workflow },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8">
              <Icon className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold tracking-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Recent articles */}
        <Card>
          <CardHeader className="space-y-0 border-b border-border/60 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow">{tr ? 'Son taslaklar' : 'Recent drafts'}</span>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tr ? 'Editoryal kuyruk' : 'Editorial queue'}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl">
                <Link href="/admin/articles">
                  {tr ? 'Tümü' : 'All'}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {articleRows.length === 0 ? (
              <div className="empty-state m-4">
                <strong>{tr ? 'Henüz makale yok.' : 'No articles yet.'}</strong>
                <p className="muted">{tr ? 'İlk taslağı oluşturun.' : 'Create the first draft.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {articleRows.map((article) => (
                  <Link
                    key={article.id}
                    href={`/admin/articles/${article.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{article.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {article.siteName} · {article.locale} · {formatDate(article.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full px-2.5 py-0.5 text-xs capitalize">
                      {translateArticleStatus(locale, article.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {tr ? 'Hızlı erişim' : 'Quick access'}
              </p>
            </CardHeader>
            <CardContent className="grid gap-1 pt-0">
              {[
                { href: '/admin/sites', label: tr ? 'Siteleri yönet' : 'Manage sites' },
                { href: '/admin/articles', label: tr ? 'Makale taslağı' : 'Article draft' },
                { href: '/admin/sources', label: tr ? 'Kaynak kapsamı' : 'Source coverage' },
                { href: '/admin/ops', label: tr ? 'Sistem sağlığı' : 'Runtime health' },
              ].map(({ href, label }) => (
                <Button key={href} asChild variant="ghost" className="h-9 w-full justify-between rounded-lg px-3 text-sm font-normal">
                  <Link href={href}>
                    {label}
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader className="space-y-0 border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">{tr ? 'Kaynaklar' : 'Sources'}</span>
                <Button asChild size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs">
                  <Link href="/admin/sources">{tr ? 'Tümü' : 'All'}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sourceRows.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">{tr ? 'Henüz kaynak yok.' : 'No sources yet.'}</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {sourceRows.map((source) => (
                    <div key={source.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{source.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {translateSourceType(locale, source.type)} · {tr ? `her ${source.pollMinutes} dk` : `every ${source.pollMinutes} min`}
                        </p>
                      </div>
                      <div className={`size-2 shrink-0 rounded-full ${source.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs */}
          <Card>
            <CardHeader className="space-y-0 border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow">{tr ? 'Görev akışı' : 'Job stream'}</span>
                <Button asChild size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs">
                  <Link href="/admin/jobs">{tr ? 'Tümü' : 'All'}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {jobRows.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">{tr ? 'Henüz görev yok.' : 'No jobs yet.'}</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {jobRows.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{translateJobKind(locale, job.kind)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
                      </div>
                      <Badge
                        variant={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'destructive' : 'outline'}
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs capitalize"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
