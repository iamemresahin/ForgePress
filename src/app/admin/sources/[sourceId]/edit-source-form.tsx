'use client'

import { SourceForm } from '../source-form'

type SiteOption = {
  id: string
  name: string
  defaultLocale: string
}

type SourceValues = {
  siteId: string
  label: string
  type: 'rss' | 'sitemap' | 'manual_url' | 'custom_feed'
  url: string
  locale: string
  pollMinutes: number
  isActive: 'true' | 'false'
}

export function EditSourceForm({
  sourceId,
  siteOptions,
  initialValues,
  action,
}: {
  sourceId: string
  siteOptions: SiteOption[]
  initialValues: SourceValues
  action: (
    sourceId: string,
    state: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>
}) {
  return (
    <SourceForm
      action={action.bind(null, sourceId)}
      siteOptions={siteOptions}
      initialValues={initialValues}
      submitLabel="Save source changes"
      description="Adjust feed behavior, locale targeting, and polling cadence from one editing surface."
    />
  )
}
