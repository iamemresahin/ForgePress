'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InterfaceLocale } from '@/lib/interface-locale'

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
  videoUrl: string
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
  locale: InterfaceLocale
}

export function ArticleForm({ submitLabel, description, siteOptions, initialValues, action, locale }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const tr = locale === 'tr'

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="eyebrow">{tr ? 'Manuel makale editörü' : 'Manual article editor'}</span>
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
              <Label htmlFor="status">{tr ? 'Durum' : 'Status'}</Label>
              <select id="status" name="status" defaultValue={initialValues.status}>
                <option value="draft">{tr ? 'Taslak' : 'Draft'}</option>
                <option value="review">{tr ? 'İnceleme' : 'Review'}</option>
                <option value="scheduled">{tr ? 'Planlandı' : 'Scheduled'}</option>
                <option value="published">{tr ? 'Yayında' : 'Published'}</option>
                <option value="rejected">{tr ? 'Reddedildi' : 'Rejected'}</option>
              </select>
            </div>

            <div className="field">
              <Label htmlFor="locale">{tr ? 'Dil' : 'Locale'}</Label>
              <Input id="locale" name="locale" type="text" defaultValue={initialValues.locale} />
            </div>

            <div className="field">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" type="text" defaultValue={initialValues.slug} />
            </div>
          </div>

          <div className="field">
            <Label htmlFor="sourceUrl">{tr ? 'Kaynak URL' : 'Source URL'}</Label>
            <Input id="sourceUrl" name="sourceUrl" type="url" defaultValue={initialValues.sourceUrl} />
          </div>

          <div className="field">
            <Label htmlFor="videoUrl">{tr ? 'Video URL (YouTube)' : 'Video URL (YouTube)'}</Label>
            <Input id="videoUrl" name="videoUrl" type="url" defaultValue={initialValues.videoUrl} placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div className="field">
            <Label htmlFor="canonicalTopic">{tr ? 'Ana konu' : 'Canonical topic'}</Label>
            <Input id="canonicalTopic" name="canonicalTopic" type="text" defaultValue={initialValues.canonicalTopic} />
          </div>

          <div className="field">
            <Label htmlFor="title">{tr ? 'Başlık' : 'Title'}</Label>
            <Input id="title" name="title" type="text" defaultValue={initialValues.title} />
          </div>

          <div className="field">
            <Label htmlFor="excerpt">{tr ? 'Özet' : 'Excerpt'}</Label>
            <Textarea id="excerpt" name="excerpt" rows={3} defaultValue={initialValues.excerpt} />
          </div>

          <div className="field">
            <Label htmlFor="body">{tr ? 'Gövde' : 'Body'}</Label>
            <Textarea id="body" name="body" rows={14} defaultValue={initialValues.body} />
          </div>

          <div className="form-grid">
            <div className="field">
              <Label htmlFor="seoTitle">{tr ? 'SEO başlığı' : 'SEO title'}</Label>
              <Input id="seoTitle" name="seoTitle" type="text" defaultValue={initialValues.seoTitle} />
            </div>

            <div className="field">
              <Label htmlFor="seoDescription">{tr ? 'SEO açıklaması' : 'SEO description'}</Label>
              <Textarea id="seoDescription" name="seoDescription" rows={3} defaultValue={initialValues.seoDescription} />
            </div>
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
