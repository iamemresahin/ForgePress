'use client'

import { SourceForm } from '../source-form'
import type { InterfaceLocale } from '@/lib/interface-locale'

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
  locale,
}: {
  sourceId: string
  siteOptions: SiteOption[]
  initialValues: SourceValues
  locale: InterfaceLocale
  action: (
    sourceId: string,
    state: { error?: string } | undefined,
    formData: FormData,
  ) => Promise<{ error?: string }>
}) {
  return (
    <SourceForm
      locale={locale}
      action={action.bind(null, sourceId)}
      siteOptions={siteOptions}
      initialValues={initialValues}
      submitLabel={locale === 'tr' ? 'Kaynak değişikliklerini kaydet' : 'Save source changes'}
      description={
        locale === 'tr'
          ? 'Feed davranışını, dil hedeflemesini ve tarama ritmini tek yüzeyden ayarlayın.'
          : 'Adjust feed behavior, locale targeting, and polling cadence from one editing surface.'
      }
    />
  )
}
