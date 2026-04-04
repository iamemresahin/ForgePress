'use client'

import { useActionState } from 'react'

type SiteOption = {
  id: string
  name: string
  defaultLocale: string
}

type ArticleFormValues = {
  siteId: string
  locale: string
  canonicalTopic: string
  title: string
  slug: string
  sourceUrl: string
  excerpt: string
  body: string
  seoTitle: string
  seoDescription: string
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'rejected'
}

type ArticleFormProps = {
  submitLabel: string
  description: string
  siteOptions: SiteOption[]
  initialValues: ArticleFormValues
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>
}

export function ArticleForm({ submitLabel, description, siteOptions, initialValues, action }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="panel stack">
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Manual article editor</span>
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
          <span>Status</span>
          <select name="status" defaultValue={initialValues.status}>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="field">
          <span>Locale</span>
          <input name="locale" type="text" defaultValue={initialValues.locale} />
        </label>

        <label className="field">
          <span>Slug</span>
          <input name="slug" type="text" defaultValue={initialValues.slug} />
        </label>
      </div>

      <label className="field">
        <span>Source URL</span>
        <input name="sourceUrl" type="url" defaultValue={initialValues.sourceUrl} />
      </label>

      <label className="field">
        <span>Canonical topic</span>
        <input name="canonicalTopic" type="text" defaultValue={initialValues.canonicalTopic} />
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" type="text" defaultValue={initialValues.title} />
      </label>

      <label className="field">
        <span>Excerpt</span>
        <textarea name="excerpt" rows={3} defaultValue={initialValues.excerpt} />
      </label>

      <label className="field">
        <span>Body</span>
        <textarea name="body" rows={14} defaultValue={initialValues.body} />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>SEO title</span>
          <input name="seoTitle" type="text" defaultValue={initialValues.seoTitle} />
        </label>

        <label className="field">
          <span>SEO description</span>
          <textarea name="seoDescription" rows={3} defaultValue={initialValues.seoDescription} />
        </label>
      </div>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
