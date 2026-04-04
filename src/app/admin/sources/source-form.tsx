'use client'

import { useActionState } from 'react'

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
}: {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>
  siteOptions: SiteOption[]
  initialValues: SourceFormValues
  submitLabel: string
  description: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="panel stack">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Source management</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>{submitLabel}</h2>
        <p className="muted">{description}</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Site</span>
          <select name="siteId" defaultValue={initialValues.siteId}>
            {siteOptions.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Type</span>
          <select name="type" defaultValue={initialValues.type}>
            <option value="rss">RSS</option>
            <option value="sitemap">Sitemap</option>
            <option value="manual_url">Manual URL</option>
            <option value="custom_feed">Custom feed</option>
          </select>
        </label>

        <label className="field">
          <span>Locale</span>
          <input name="locale" type="text" defaultValue={initialValues.locale} />
        </label>

        <label className="field">
          <span>Poll minutes</span>
          <input name="pollMinutes" type="number" min={1} defaultValue={initialValues.pollMinutes} />
        </label>
      </div>

      <label className="field">
        <span>Label</span>
        <input name="label" type="text" defaultValue={initialValues.label} />
      </label>

      <label className="field">
        <span>URL</span>
        <input name="url" type="url" defaultValue={initialValues.url} />
      </label>

      <label className="field">
        <span>Status</span>
        <select name="isActive" defaultValue={initialValues.isActive}>
          <option value="true">Active</option>
          <option value="false">Paused</option>
        </select>
      </label>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
