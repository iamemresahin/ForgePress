'use client'

import { useActionState } from 'react'

import { createJobAction } from './actions'

type SiteOption = {
  id: string
  name: string
}

export function JobTriggerForm({
  siteOptions,
}: {
  siteOptions: SiteOption[]
}) {
  const [state, formAction, pending] = useActionState(createJobAction, undefined)

  return (
    <form action={formAction} className="panel stack">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Queue control</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Trigger a manual job.</h2>
        <p className="muted">
          This is the bridge between admin actions and the future worker pipeline. Start with manual
          runs, then attach schedules and automation rules.
        </p>
      </div>

      <label className="field">
        <span>Site</span>
        <select name="siteId" defaultValue={siteOptions[0]?.id}>
          {siteOptions.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Job kind</span>
        <select name="kind" defaultValue="ingestion">
          <option value="ingestion">Ingestion</option>
          <option value="rewrite">Rewrite</option>
          <option value="localization">Localization</option>
          <option value="image">Image</option>
          <option value="publish">Publish</option>
        </select>
      </label>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Queueing...' : 'Queue job'}
      </button>
    </form>
  )
}
