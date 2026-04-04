'use client'

import { useActionState } from 'react'

type SiteFormValues = {
  name: string
  slug: string
  defaultLocale: string
  supportedLocales: string
  niche: string
  toneGuide: string
  editorialGuidelines: string
  adsensePolicyNotes: string
  prohibitedTopics: string
  requiredSections: string
  reviewChecklist: string
}

export function SiteForm({
  action,
  submitLabel,
  description,
  initialValues,
}: {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>
  submitLabel: string
  description: string
  initialValues: SiteFormValues
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="panel stack">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Site rules</span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>{submitLabel}</h2>
        <p className="muted">{description}</p>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Site name</span>
          <input name="name" type="text" defaultValue={initialValues.name} />
        </label>

        <label className="field">
          <span>Slug</span>
          <input name="slug" type="text" defaultValue={initialValues.slug} />
        </label>

        <label className="field">
          <span>Default locale</span>
          <input name="defaultLocale" type="text" defaultValue={initialValues.defaultLocale} />
        </label>

        <label className="field">
          <span>Supported locales</span>
          <input name="supportedLocales" type="text" defaultValue={initialValues.supportedLocales} />
        </label>
      </div>

      <label className="field">
        <span>Niche</span>
        <input name="niche" type="text" defaultValue={initialValues.niche} />
      </label>

      <label className="field">
        <span>Tone guide</span>
        <textarea name="toneGuide" rows={4} defaultValue={initialValues.toneGuide} />
      </label>

      <label className="field">
        <span>Editorial guidelines</span>
        <textarea
          name="editorialGuidelines"
          rows={5}
          defaultValue={initialValues.editorialGuidelines}
          placeholder="State sourcing standards, attribution rules, allowed claim strength, and editorial voice."
        />
      </label>

      <label className="field">
        <span>AdSense policy notes</span>
        <textarea
          name="adsensePolicyNotes"
          rows={5}
          defaultValue={initialValues.adsensePolicyNotes}
          placeholder="Define ad density limits, misleading click avoidance, sensitive topic handling, and page quality constraints."
        />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Prohibited topics</span>
          <textarea
            name="prohibitedTopics"
            rows={4}
            defaultValue={initialValues.prohibitedTopics}
            placeholder="Comma-separated: gambling, weapons, medical claims"
          />
        </label>

        <label className="field">
          <span>Required sections</span>
          <textarea
            name="requiredSections"
            rows={4}
            defaultValue={initialValues.requiredSections}
            placeholder="Comma-separated: Summary, Context, What to watch"
          />
        </label>
      </div>

      <label className="field">
        <span>Review checklist</span>
        <textarea
          name="reviewChecklist"
          rows={4}
          defaultValue={initialValues.reviewChecklist}
          placeholder="Comma-separated: verify source attribution, confirm no copied paragraphs, confirm headline accuracy"
        />
      </label>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
