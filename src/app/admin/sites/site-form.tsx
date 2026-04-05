'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InterfaceLocale } from '@/lib/interface-locale'

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
  locale,
}: {
  action: (state: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>
  submitLabel: string
  description: string
  initialValues: SiteFormValues
  locale: InterfaceLocale
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const tr = locale === 'tr'

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="eyebrow">{tr ? 'Site kuralları' : 'Site rules'}</span>
          <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">{submitLabel}</CardTitle>
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="form-grid">
            <div className="field">
              <Label htmlFor="name">{tr ? 'Site adı' : 'Site name'}</Label>
              <Input id="name" name="name" type="text" defaultValue={initialValues.name} />
            </div>
            <div className="field">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" type="text" defaultValue={initialValues.slug} />
            </div>
            <div className="field">
              <Label htmlFor="defaultLocale">{tr ? 'Varsayılan dil' : 'Default locale'}</Label>
              <Input
                id="defaultLocale"
                name="defaultLocale"
                type="text"
                defaultValue={initialValues.defaultLocale}
              />
            </div>
            <div className="field">
              <Label htmlFor="supportedLocales">{tr ? 'Desteklenen diller' : 'Supported locales'}</Label>
              <Input
                id="supportedLocales"
                name="supportedLocales"
                type="text"
                defaultValue={initialValues.supportedLocales}
              />
            </div>
          </div>

          <div className="field">
            <Label htmlFor="niche">{tr ? 'Niş alan' : 'Niche'}</Label>
            <Input id="niche" name="niche" type="text" defaultValue={initialValues.niche} />
          </div>

          <div className="field">
            <Label htmlFor="toneGuide">{tr ? 'Ton kılavuzu' : 'Tone guide'}</Label>
            <Textarea id="toneGuide" name="toneGuide" rows={4} defaultValue={initialValues.toneGuide} />
          </div>

          <div className="field">
            <Label htmlFor="editorialGuidelines">{tr ? 'Editoryal kurallar' : 'Editorial guidelines'}</Label>
            <Textarea
              id="editorialGuidelines"
              name="editorialGuidelines"
              rows={5}
              defaultValue={initialValues.editorialGuidelines}
              placeholder={
                tr
                  ? 'Kaynak kullanımı, atıf kuralları, izin verilen iddia seviyesi ve yayın dilini belirtin.'
                  : 'State sourcing standards, attribution rules, allowed claim strength, and editorial voice.'
              }
            />
          </div>

          <div className="field">
            <Label htmlFor="adsensePolicyNotes">{tr ? 'AdSense politika notları' : 'AdSense policy notes'}</Label>
            <Textarea
              id="adsensePolicyNotes"
              name="adsensePolicyNotes"
              rows={5}
              defaultValue={initialValues.adsensePolicyNotes}
              placeholder={
                tr
                  ? 'Reklam yoğunluğu, yanıltıcı tıklamadan kaçınma, hassas konu yönetimi ve sayfa kalite kurallarını tanımlayın.'
                  : 'Define ad density limits, misleading click avoidance, sensitive topic handling, and page quality constraints.'
              }
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <Label htmlFor="prohibitedTopics">{tr ? 'Yasaklı konular' : 'Prohibited topics'}</Label>
              <Textarea
                id="prohibitedTopics"
                name="prohibitedTopics"
                rows={4}
                defaultValue={initialValues.prohibitedTopics}
                placeholder={
                  tr
                    ? 'Virgülle ayırın: kumar, silahlar, tıbbi iddialar'
                    : 'Comma-separated: gambling, weapons, medical claims'
                }
              />
            </div>
            <div className="field">
              <Label htmlFor="requiredSections">{tr ? 'Zorunlu bölümler' : 'Required sections'}</Label>
              <Textarea
                id="requiredSections"
                name="requiredSections"
                rows={4}
                defaultValue={initialValues.requiredSections}
                placeholder={
                  tr
                    ? 'Virgülle ayırın: Özet, Bağlam, Dikkat edilmesi gerekenler'
                    : 'Comma-separated: Summary, Context, What to watch'
                }
              />
            </div>
          </div>

          <div className="field">
            <Label htmlFor="reviewChecklist">{tr ? 'İnceleme kontrol listesi' : 'Review checklist'}</Label>
            <Textarea
              id="reviewChecklist"
              name="reviewChecklist"
              rows={4}
              defaultValue={initialValues.reviewChecklist}
              placeholder={
                tr
                  ? 'Virgülle ayırın: kaynak atfını doğrula, kopya paragraf olmadığını kontrol et, başlık doğruluğunu onayla'
                  : 'Comma-separated: verify source attribution, confirm no copied paragraphs, confirm headline accuracy'
              }
            />
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
