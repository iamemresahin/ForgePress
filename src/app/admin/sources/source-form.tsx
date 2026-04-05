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
          <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">{submitLabel}</CardTitle>
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
              <Label htmlFor="pollMinutes">{tr ? 'Tarama dakikası' : 'Poll minutes'}</Label>
              <Input id="pollMinutes" name="pollMinutes" type="number" min={1} defaultValue={initialValues.pollMinutes} />
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
