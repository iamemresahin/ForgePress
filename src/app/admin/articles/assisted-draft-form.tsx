'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InterfaceLocale } from '@/lib/interface-locale'

import { createAssistedDraftAction } from './actions'

export function AssistedDraftForm({
  siteOptions,
  locale,
}: {
  siteOptions: Array<{
    id: string
    name: string
    defaultLocale: string
  }>
  locale: InterfaceLocale
}) {
  const [state, formAction, pending] = useActionState(createAssistedDraftAction, undefined)
  const primarySite = siteOptions[0]
  const tr = locale === 'tr'

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <span className="eyebrow">{tr ? 'OpenAI destekli taslak' : 'OpenAI-assisted draft'}</span>
          <CardTitle className="text-[clamp(1.8rem,3vw,2.6rem)]">
            {tr ? 'İnceleme öncelikli bir makale taslağı üretin.' : 'Generate a review-first article draft.'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? 'Bu akış OpenAI Responses API ve moderasyon kontrollerini kullanır, sonra sonucu doğrudan editoryal kuyruğa kaydeder.'
              : 'This uses the OpenAI Responses API plus moderation checks, then stores the result directly in the editorial queue.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="field">
            <Label htmlFor="siteId">{tr ? 'Site' : 'Site'}</Label>
            <select id="siteId" name="siteId" defaultValue={primarySite?.id}>
              {siteOptions.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="field">
              <Label htmlFor="locale">{tr ? 'Dil' : 'Locale'}</Label>
              <Input id="locale" name="locale" type="text" defaultValue={primarySite?.defaultLocale ?? 'en'} />
            </div>

            <div className="field">
              <Label htmlFor="sourceUrl">{tr ? 'Kaynak URL' : 'Source URL'}</Label>
              <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://example.com/source-story" />
            </div>
          </div>

          <div className="field">
            <Label htmlFor="canonicalTopic">{tr ? 'Ana konu' : 'Canonical topic'}</Label>
            <Input
              id="canonicalTopic"
              name="canonicalTopic"
              type="text"
              placeholder={tr ? '2026 için yapay zeka veri merkezi harcama görünümü' : 'AI data-center spending outlook for 2026'}
            />
          </div>

          <div className="field">
            <Label htmlFor="sourceNotes">{tr ? 'Kaynak notları' : 'Source notes'}</Label>
            <Textarea
              id="sourceNotes"
              name="sourceNotes"
              rows={6}
              placeholder={
                tr
                  ? 'Taslağı şekillendirmek için özet notları, kaynak maddelerini veya editoryal yönlendirmeyi yapıştırın.'
                  : 'Paste summary notes, source bullets, or editorial framing to shape the draft.'
              }
            />
          </div>

          {state?.error ? <p className="form-error">{state.error}</p> : null}

          <Button className="h-11 rounded-xl" type="submit" disabled={pending}>
            {pending ? (tr ? 'Taslak üretiliyor...' : 'Generating draft...') : tr ? 'Destekli taslak üret' : 'Generate assisted draft'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
