'use client'

import { useActionState } from 'react'

import { createAssistedDraftAction } from './actions'

export function AssistedDraftForm({
  siteOptions,
}: {
  siteOptions: Array<{
    id: string
    name: string
    defaultLocale: string
  }>
}) {
  const [state, formAction, pending] = useActionState(createAssistedDraftAction, undefined)
  const primarySite = siteOptions[0]

  return (
    <form action={formAction} className="panel stack">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">OpenAI-assisted draft</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>Generate a review-first article draft.</h2>
        <p className="muted">
          This uses the OpenAI Responses API plus moderation checks, then stores the result directly
          in the editorial queue.
        </p>
      </div>

      <label className="field">
        <span>Site</span>
        <select name="siteId" defaultValue={primarySite?.id}>
          {siteOptions.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Locale</span>
          <input name="locale" type="text" defaultValue={primarySite?.defaultLocale ?? 'en'} />
        </label>

        <label className="field">
          <span>Source URL</span>
          <input name="sourceUrl" type="url" placeholder="https://example.com/source-story" />
        </label>
      </div>

      <label className="field">
        <span>Canonical topic</span>
        <input
          name="canonicalTopic"
          type="text"
          placeholder="AI data-center spending outlook for 2026"
        />
      </label>

      <label className="field">
        <span>Source notes</span>
        <textarea
          name="sourceNotes"
          rows={6}
          placeholder="Paste summary notes, source bullets, or editorial framing to shape the draft."
        />
      </label>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Generating draft...' : 'Generate assisted draft'}
      </button>
    </form>
  )
}
