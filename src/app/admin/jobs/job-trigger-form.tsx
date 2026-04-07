'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { InterfaceLocale } from '@/lib/interface-locale'

import { createJobAction } from './actions'

type SiteOption = {
  id: string
  name: string
}

export function JobTriggerForm({
  siteOptions,
  locale,
}: {
  siteOptions: SiteOption[]
  locale: InterfaceLocale
}) {
  const [state, formAction, pending] = useActionState(createJobAction, undefined)
  const tr = locale === 'tr'

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="eyebrow">{tr ? 'Kuyruk kontrolü' : 'Queue control'}</span>
          <CardTitle className="text-lg">
            {tr ? 'Manuel görev tetikle.' : 'Trigger a manual job.'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? 'Bu, admin aksiyonları ile gelecekteki worker pipeline arasındaki köprüdür. Manuel çalıştırmalarla başlayın, sonra zamanlama ve otomasyon kuralları ekleyin.'
              : 'This is the bridge between admin actions and the future worker pipeline. Start with manual runs, then attach schedules and automation rules.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="field">
            <Label htmlFor="siteId">{tr ? 'Site' : 'Site'}</Label>
            <select id="siteId" name="siteId" defaultValue={siteOptions[0]?.id}>
              {siteOptions.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <Label htmlFor="kind">{tr ? 'Görev tipi' : 'Job kind'}</Label>
            <select id="kind" name="kind" defaultValue="ingestion">
              <option value="ingestion">{tr ? 'İçe aktarma' : 'Ingestion'}</option>
              <option value="rewrite">{tr ? 'Yeniden yazım' : 'Rewrite'}</option>
              <option value="localization">{tr ? 'Yerelleştirme' : 'Localization'}</option>
              <option value="image">{tr ? 'Görsel' : 'Image'}</option>
              <option value="publish">{tr ? 'Yayın' : 'Publish'}</option>
            </select>
          </div>

          {state?.error ? <p className="form-error">{state.error}</p> : null}

          <Button className="h-11 rounded-xl" type="submit" disabled={pending}>
            {pending ? (tr ? 'Kuyruğa ekleniyor...' : 'Queueing...') : tr ? 'Görevi kuyruğa al' : 'Queue job'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
