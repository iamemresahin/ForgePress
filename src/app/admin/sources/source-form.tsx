'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InterfaceLocale } from '@/lib/interface-locale'

type SiteOption = {
  id: string
  name: string
  defaultLocale: string
}

type SourceFormValues = {
  siteId: string
  label: string
  type: 'rss' | 'sitemap' | 'manual_url' | 'custom_feed'
  url: string
  locale: string
  pollMinutes: number
  isActive: 'true' | 'false'
}

export function SourceForm({
  action,
  siteOptions,
  initialValues,
  submitLabel,
  description,
  locale,
}: {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>
  siteOptions: SiteOption[]
  initialValues: SourceFormValues
  submitLabel: string
  description: string
  locale: InterfaceLocale
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const tr = locale === 'tr'

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="eyebrow">{tr ? 'Kaynak yönetimi' : 'Source management'}</span>
          <CardTitle className="text-lg">{submitLabel}</CardTitle>
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="form-grid">
            <div className="field">
              <Label htmlFor="siteId">{tr ? 'Site' : 'Site'}</Label>
              <select id="siteId" name="siteId" defaultValue={initialValues.siteId}>
                {siteOptions.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <Label htmlFor="type">{tr ? 'Tür' : 'Type'}</Label>
              <select id="type" name="type" defaultValue={initialValues.type}>
                <option value="rss">RSS</option>
                <option value="sitemap">{tr ? 'Site haritası' : 'Sitemap'}</option>
                <option value="manual_url">{tr ? 'Manuel URL' : 'Manual URL'}</option>
                <option value="custom_feed">{tr ? 'Özel feed' : 'Custom feed'}</option>
              </select>
            </div>

            <div className="field">
              <Label htmlFor="locale">{tr ? 'Dil' : 'Locale'}</Label>
              <Input id="locale" name="locale" type="text" defaultValue={initialValues.locale} />
            </div>

            <div className="field">
              <Label htmlFor="pollMinutes">{tr ? 'Tarama sıklığı' : 'Polling interval'}</Label>
              <select id="pollMinutes" name="pollMinutes" defaultValue={String(initialValues.pollMinutes)}>
                <option value="15">{tr ? 'Her 15 dakikada bir' : 'Every 15 minutes'}</option>
                <option value="30">{tr ? 'Her 30 dakikada bir' : 'Every 30 minutes'}</option>
                <option value="60">{tr ? 'Her saatte bir' : 'Every hour'}</option>
                <option value="120">{tr ? 'Her 2 saatte bir' : 'Every 2 hours'}</option>
                <option value="240">{tr ? 'Her 4 saatte bir' : 'Every 4 hours'}</option>
                <option value="360">{tr ? 'Her 6 saatte bir' : 'Every 6 hours'}</option>
                <option value="720">{tr ? 'Her 12 saatte bir' : 'Every 12 hours'}</option>
                <option value="1440">{tr ? 'Günde bir kez' : 'Once a day'}</option>
                <option value="4320">{tr ? 'Her 3 günde bir' : 'Every 3 days'}</option>
                <option value="10080">{tr ? 'Haftada bir kez' : 'Once a week'}</option>
              </select>
            </div>
          </div>

          <div className="field">
            <Label htmlFor="label">{tr ? 'Etiket' : 'Label'}</Label>
            <Input id="label" name="label" type="text" defaultValue={initialValues.label} />
          </div>

          <div className="field">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" type="url" defaultValue={initialValues.url} />
          </div>

          <div className="field">
            <Label htmlFor="isActive">{tr ? 'Durum' : 'Status'}</Label>
            <select id="isActive" name="isActive" defaultValue={initialValues.isActive}>
              <option value="true">{tr ? 'Aktif' : 'Active'}</option>
              <option value="false">{tr ? 'Duraklatıldı' : 'Paused'}</option>
            </select>
          </div>

          {state?.error ? <p className="form-error">{state.error}</p> : null}

          <Button className="h-11 rounded-xl" type="submit" disabled={pending}>
            {pending ? (tr ? 'Kaydediliyor...' : 'Saving...') : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
