'use client'

import { useActionState, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InterfaceLocale } from '@/lib/interface-locale'

import { quickCreateSiteAction } from './actions'

const COMMON_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export function QuickSiteForm({ locale }: { locale: InterfaceLocale }) {
  const tr = locale === 'tr'
  const [state, action, isPending] = useActionState(quickCreateSiteAction, undefined)
  const [selectedLocales, setSelectedLocales] = useState<string[]>(['en'])
  const [defaultLocale, setDefaultLocale] = useState('en')

  function toggleLocale(code: string) {
    setSelectedLocales((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev
        const next = prev.filter((l) => l !== code)
        if (defaultLocale === code) setDefaultLocale(next[0]!)
        return next
      }
      return [...prev, code]
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <span className="eyebrow">{tr ? 'Hızlı site kurulumu' : 'Quick site setup'}</span>
        </div>
        <CardTitle className="text-lg">
          {tr ? 'Sitenin içeriğini anlatın, gerisini AI ayarlasın' : 'Describe your site, AI configures the rest'}
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          {tr
            ? 'Sadece site adı, niş/konu ve dil(ler)i girin. Editoryal kurallar, ton rehberi ve içerik politikası otomatik oluşturulur.'
            : 'Just enter the site name, niche, and language(s). Editorial rules, tone guide, and content policy are generated automatically.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <input type="hidden" name="supportedLocales" value={selectedLocales.join(',')} />
          <input type="hidden" name="defaultLocale" value={defaultLocale} />

          <div className="field">
            <Label htmlFor="qs-name">{tr ? 'Site adı' : 'Site name'}</Label>
            <Input
              id="qs-name"
              name="name"
              placeholder={tr ? 'Örn: TechPulse, Global Finance Today' : 'e.g. TechPulse, Global Finance Today'}
              required
              minLength={2}
            />
          </div>

          <div className="field">
            <Label htmlFor="qs-niche">{tr ? 'Konu / niş' : 'Topic / niche'}</Label>
            <Textarea
              id="qs-niche"
              name="niche"
              rows={3}
              placeholder={
                tr
                  ? 'Bu site ne hakkında? Hedef kitle kim? Örn: Yapay zeka gelişmeleri ve girişim haberleri, teknoloji meraklısı iş dünyası okuyucuları için.'
                  : 'What is this site about? Who is the audience? e.g. AI developments and startup news for tech-savvy business readers.'
              }
            />
          </div>

          <div className="field">
            <Label>{tr ? 'İçerik dilleri' : 'Content languages'}</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {tr ? 'Birden fazla seçilebilir. Seçilen her dilde içerik otomatik üretilir.' : 'Multiple allowed. Content is auto-generated in each selected language.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_LOCALES.map(({ code, label }) => {
                const selected = selectedLocales.includes(code)
                const isDefault = defaultLocale === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleLocale(code)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {label}
                    {selected && isDefault && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                        {tr ? 'ana' : 'main'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedLocales.length > 1 && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {tr ? 'Ana dil (varsayılan)' : 'Primary language (default)'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedLocales.map((code) => {
                    const found = COMMON_LOCALES.find((l) => l.code === code)
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setDefaultLocale(code)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          defaultLocale === code
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {found?.label ?? code}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {state?.error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="rounded-xl w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {tr ? 'AI ayarları oluşturuyor...' : 'AI is configuring your site...'}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {tr ? 'Siteyi oluştur' : 'Create site'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
