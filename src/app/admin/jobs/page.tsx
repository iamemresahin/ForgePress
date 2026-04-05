import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { Activity, Bot, Clock3, Layers3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs, sites } from '@/lib/db/schema'
import { translateJobKind } from '@/lib/interface-locale'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { JobTriggerForm } from './job-trigger-form'

export default async function AdminJobsPage() {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'

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
      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{tr ? 'Görevler' : 'Jobs'}</span>
          <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">
            {tr ? 'Görevleri kuyruğa almadan önce bir site oluşturun.' : 'Create a site before queueing jobs.'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? 'Görevlerin içe aktarma, taslak, yerelleştirme ve yayın işlerini kapsamlandırması için bir site hedefine ihtiyacı var.'
              : 'Jobs need a site target to scope ingestion, drafting, localization, and publishing work.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/admin/sites">{tr ? 'Site yönetimini aç' : 'Open site management'}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-5">
          <div className="space-y-2">
            <span className="eyebrow">{tr ? 'Görevler' : 'Jobs'}</span>
            <CardTitle className="text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.96]">
              {tr ? 'Kuyruk tabanlı operasyonlar artık admin tetikleme yüzeyine sahip.' : 'Queue-backed operations now have an admin trigger surface.'}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {tr
                ? 'Bu ekran kalıcı görev kayıtları oluşturur ve BullMQ görevlerini kuyruğa almayı dener. İçe aktarma, yeniden yazım, görsel, yerelleştirme ve yayın akışları için operasyon merkezidir.'
                : 'This screen creates persistent job records and attempts to enqueue BullMQ tasks. It is the operational hinge for ingestion, rewrite, image, localization, and publish flows.'}
            </CardDescription>
          </div>
          <div className="stats-grid">
            <article>
              <Activity className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Toplam görev' : 'Total jobs'}</span>
              <strong>{jobRows.length}</strong>
            </article>
            <article>
              <Layers3 className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Mevcut siteler' : 'Available sites'}</span>
              <strong>{siteOptions.length}</strong>
            </article>
            <article>
              <Bot className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Worker modu' : 'Worker mode'}</span>
              <strong>{tr ? 'Manuel tetikleme' : 'Manual trigger'}</strong>
            </article>
            <article>
              <Clock3 className="mb-3 size-5 text-primary" />
              <span>{tr ? 'Ritim' : 'Cadence'}</span>
              <strong>{tr ? 'İhtiyaç halinde' : 'On demand'}</strong>
            </article>
          </div>
        </CardHeader>
      </Card>

      <div className="hero-grid">
        <JobTriggerForm siteOptions={siteOptions} locale={locale} />

        <Card>
          <CardHeader className="space-y-2">
            <span className="eyebrow">{tr ? 'Son çalışmalar' : 'Recent runs'}</span>
            <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">
              {tr ? 'Operasyon izi' : 'Operational trace'}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {tr
                ? 'Kuyruğa teslim başarısız olsa bile görev kaydı kalır; operatör denemeleri ve yeniden deneme mantığını inceleyebilir.'
                : 'Jobs persist even when queue delivery fails, so the operator can inspect attempts and retry logic.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobRows.length === 0 ? (
              <div className="empty-state">
                <strong>{tr ? 'Henüz görev yok.' : 'No jobs yet.'}</strong>
                <p className="muted">{tr ? 'Pipeline sözleşmesini doğrulamak için ilk manuel görevi kuyruğa alın.' : 'Queue the first manual job to validate the pipeline contract.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobRows.map((job) => (
                  <article className="list-card space-y-3" key={job.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {job.siteName ?? (tr ? 'Site yok' : 'No site')}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                        {translateJobKind(locale, job.kind)}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1 capitalize">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <strong className="mt-0 text-xl">{job.id.slice(0, 8)}</strong>
                      <p className="muted">{tr ? 'Deneme' : 'Attempts'}: {job.attempts}</p>
                    </div>
                    {job.errorMessage ? <p className="form-error">{job.errorMessage}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
