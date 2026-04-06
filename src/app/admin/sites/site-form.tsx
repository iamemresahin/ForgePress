'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { InterfaceLocale } from '@/lib/interface-locale'
import {
  ARTICLE_LAYOUT_OPTIONS,
  HOMEPAGE_LAYOUT_OPTIONS,
  THEME_PRESETS,
  resolveThemePreview,
} from '@/lib/site-theme'

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
  topicLabelOverrides: string
  featuredNavLabel: string
  allNavLabel: string
  navTopicSlugs: string
  authBrandName: string
  googleClientId: string
  adsensePublisherId: string
  primaryHostname: string
  additionalHostnames: string
  themePreset:
    | 'forge_blue'
    | 'editorial_glow'
    | 'news_sand'
    | 'midnight_signal'
    | 'kantan_editorial'
  homepageLayout: 'spotlight' | 'digest'
  articleLayout: 'editorial' | 'feature'
  themePrimary: string
  themeAccent: string
  themeBackground: string
}

const THEME_STARTERS: Array<{
  key: SiteFormValues['themePreset']
  homepageLayout: SiteFormValues['homepageLayout']
  articleLayout: SiteFormValues['articleLayout']
  primary: string
  accent: string
  background: string
}> = [
  {
    key: 'forge_blue',
    homepageLayout: 'spotlight',
    articleLayout: 'editorial',
    primary: '#1782f6',
    accent: '#6ed6ff',
    background: '#f7fbff',
  },
  {
    key: 'kantan_editorial',
    homepageLayout: 'spotlight',
    articleLayout: 'feature',
    primary: '#f97316',
    accent: '#fdba74',
    background: '#050505',
  },
  {
    key: 'news_sand',
    homepageLayout: 'digest',
    articleLayout: 'editorial',
    primary: '#7b5f2d',
    accent: '#ccb57b',
    background: '#fbf7ef',
  },
]

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
  const [themePreset, setThemePreset] = useState<SiteFormValues['themePreset']>(initialValues.themePreset)
  const [homepageLayout, setHomepageLayout] = useState<SiteFormValues['homepageLayout']>(initialValues.homepageLayout)
  const [articleLayout, setArticleLayout] = useState<SiteFormValues['articleLayout']>(initialValues.articleLayout)
  const [themePrimary, setThemePrimary] = useState(initialValues.themePrimary)
  const [themeAccent, setThemeAccent] = useState(initialValues.themeAccent)
  const [themeBackground, setThemeBackground] = useState(initialValues.themeBackground)

  const themePreview = resolveThemePreview({
    themePreset,
    homepageLayout,
    articleLayout,
    themePrimary,
    themeAccent,
    themeBackground,
  })

  const selectedPreset = THEME_PRESETS[themePreset]

  function applyThemeStarter(starterKey: SiteFormValues['themePreset']) {
    const starter = THEME_STARTERS.find((item) => item.key === starterKey)
    if (!starter) return

    setThemePreset(starter.key)
    setHomepageLayout(starter.homepageLayout)
    setArticleLayout(starter.articleLayout)
    setThemePrimary(starter.primary)
    setThemeAccent(starter.accent)
    setThemeBackground(starter.background)
  }

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

          <div className="form-grid">
            <div className="field">
              <Label htmlFor="primaryHostname">{tr ? 'Birincil domain' : 'Primary domain'}</Label>
              <Input
                id="primaryHostname"
                name="primaryHostname"
                type="text"
                defaultValue={initialValues.primaryHostname}
                placeholder={tr ? 'ornek.com' : 'example.com'}
              />
            </div>
            <div className="field">
              <Label htmlFor="additionalHostnames">{tr ? 'Ek domainler' : 'Additional domains'}</Label>
              <Input
                id="additionalHostnames"
                name="additionalHostnames"
                type="text"
                defaultValue={initialValues.additionalHostnames}
                placeholder={tr ? 'www.ornek.com, blog.ornek.com' : 'www.example.com, blog.example.com'}
              />
            </div>
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

          <div className="field">
            <Label htmlFor="topicLabelOverrides">{tr ? 'Topic etiket override' : 'Topic label overrides'}</Label>
            <Textarea
              id="topicLabelOverrides"
              name="topicLabelOverrides"
              rows={3}
              defaultValue={initialValues.topicLabelOverrides}
              placeholder={
                tr
                  ? 'Virgülle ayırın: ai:Yapay Zeka, tools:Araçlar, startups:Girişimler'
                  : 'Comma-separated: ai:Artificial Intelligence, tools:Tools, startups:Startups'
              }
            />
          </div>

          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="space-y-1">
              <p className="eyebrow">{tr ? 'Üst navigasyon' : 'Header navigation'}</p>
              <p className="text-sm text-slate-600">
                {tr
                  ? 'Öne çıkanlar ve tümü etiketlerini değiştirin, üst barda hangi 4 konunun görüneceğini belirleyin.'
                  : 'Change the featured and all labels, and control which 4 topics appear in the top navigation.'}
              </p>
            </div>

            <div className="form-grid">
              <div className="field">
                <Label htmlFor="featuredNavLabel">{tr ? 'Öne çıkanlar etiketi' : 'Featured label'}</Label>
                <Input
                  id="featuredNavLabel"
                  name="featuredNavLabel"
                  type="text"
                  defaultValue={initialValues.featuredNavLabel}
                  placeholder={tr ? 'Öne Çıkanlar' : 'Featured'}
                />
              </div>
              <div className="field">
                <Label htmlFor="allNavLabel">{tr ? 'Tümü etiketi' : 'All label'}</Label>
                <Input
                  id="allNavLabel"
                  name="allNavLabel"
                  type="text"
                  defaultValue={initialValues.allNavLabel}
                  placeholder={tr ? 'Tümü' : 'All'}
                />
              </div>
            </div>

            <div className="field">
              <Label htmlFor="navTopicSlugs">{tr ? 'Üst barda görünecek konu slugları' : 'Top-bar topic slugs'}</Label>
              <Input
                id="navTopicSlugs"
                name="navTopicSlugs"
                type="text"
                defaultValue={initialValues.navTopicSlugs}
                placeholder={
                  tr
                    ? 'Virgülle ayırın: ai, tools, startups, technology'
                    : 'Comma-separated: ai, tools, startups, technology'
                }
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="space-y-1">
              <p className="eyebrow">{tr ? 'Okuyucu girişi' : 'Reader authentication'}</p>
              <p className="text-sm text-slate-600">
                {tr
                  ? 'Her site kendi markasıyla giriş yapmalı. Google client id değerini site bazlı girerek yayınları birbirinden ayırın.'
                  : 'Each site should sign readers in under its own brand. Set a site-specific Google client id to isolate publications.'}
              </p>
              <p className="text-xs leading-6 text-slate-500">
                {tr
                  ? 'Birbiriyle alakasız yayınlarda aynı Google OAuth uygulamasını paylaşmayın. Her site için ayrı auth marka adı ve ayrı Google client id kullanın.'
                  : 'Do not share the same Google OAuth app across unrelated publications. Use a separate auth brand and Google client id for each site.'}
              </p>
            </div>

            <div className="form-grid">
              <div className="field">
                <Label htmlFor="authBrandName">{tr ? 'Auth marka adı' : 'Auth brand name'}</Label>
                <Input
                  id="authBrandName"
                  name="authBrandName"
                  type="text"
                  defaultValue={initialValues.authBrandName}
                  placeholder={tr ? 'Nocode Builds Reader' : 'Nocode Builds Reader'}
                />
              </div>
              <div className="field">
                <Label htmlFor="googleClientId">{tr ? 'Google client id' : 'Google client id'}</Label>
                <Input
                  id="googleClientId"
                  name="googleClientId"
                  type="text"
                  defaultValue={initialValues.googleClientId}
                  placeholder="1234567890-abcdef.apps.googleusercontent.com"
                />
              </div>
              <div className="field">
                <Label htmlFor="adsensePublisherId">{tr ? 'AdSense yayıncı kimliği' : 'AdSense publisher ID'}</Label>
                <Input
                  id="adsensePublisherId"
                  name="adsensePublisherId"
                  type="text"
                  defaultValue={initialValues.adsensePublisherId}
                  placeholder="ca-pub-0000000000000000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
            <div className="space-y-1">
              <p className="eyebrow">{tr ? 'Tema sistemi' : 'Theme system'}</p>
              <p className="text-sm text-slate-600">
                {tr
                  ? 'Her site için görsel yön, anasayfa akışı ve makale tonu burada tanımlanır.'
                  : 'Define the visual direction, homepage flow, and article tone for each site here.'}
              </p>
            </div>

            <div className="space-y-3">
              <Label>{tr ? 'Başlangıç teması' : 'Starter theme'}</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {THEME_STARTERS.map((starter) => {
                  const preset = THEME_PRESETS[starter.key]
                  const isActive = themePreset === starter.key

                  return (
                    <button
                      key={starter.key}
                      type="button"
                      onClick={() => applyThemeStarter(starter.key)}
                      className={`rounded-[20px] border p-4 text-left transition ${
                        isActive
                          ? 'border-sky-300 bg-white shadow-[0_16px_36px_-24px_rgba(14,104,195,0.35)]'
                          : 'border-sky-100 bg-white/80 hover:border-sky-200'
                      }`}
                    >
                      <div
                        className="mb-3 overflow-hidden rounded-[16px] border"
                        style={{
                          background:
                            starter.key === 'kantan_editorial'
                              ? 'linear-gradient(180deg, #050505, #111111)'
                              : `linear-gradient(180deg, ${starter.background}, ${starter.background})`,
                          borderColor: starter.key === 'kantan_editorial' ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.2)',
                        }}
                      >
                        <div className="flex items-center justify-between border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: starter.key === 'kantan_editorial' ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.16)',
                            color: starter.key === 'kantan_editorial' ? 'rgba(255,255,255,0.82)' : '#334155',
                          }}
                        >
                          <span>{starter.key === 'kantan_editorial' ? 'Dark Feed' : 'Starter'}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: starter.primary }} />
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: starter.accent }} />
                          </div>
                        </div>
                        <div className="grid gap-2 p-3">
                          <div
                            className="rounded-[12px]"
                            style={{
                              height: starter.key === 'kantan_editorial' ? 54 : 46,
                              background:
                                starter.key === 'kantan_editorial'
                                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 58%), #1a1a1a'
                                  : `linear-gradient(135deg, ${starter.primary}22, transparent 58%), ${starter.background}`,
                            }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div
                              className="rounded-[10px]"
                              style={{
                                height: 30,
                                background:
                                  starter.key === 'kantan_editorial'
                                    ? 'rgba(255,255,255,0.06)'
                                    : `${starter.primary}16`,
                              }}
                            />
                            <div
                              className="rounded-[10px]"
                              style={{
                                height: 30,
                                background:
                                  starter.key === 'kantan_editorial'
                                    ? 'rgba(255,255,255,0.09)'
                                    : `${starter.accent}22`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {tr ? preset.label.tr : preset.label.en}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {tr ? preset.description.tr : preset.description.en}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="field">
              <Label htmlFor="themePreset">{tr ? 'Tema preset’i' : 'Theme preset'}</Label>
              <select
                id="themePreset"
                name="themePreset"
                value={themePreset}
                onChange={(event) => setThemePreset(event.target.value as SiteFormValues['themePreset'])}
              >
                {Object.values(THEME_PRESETS).map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {tr ? preset.label.tr : preset.label.en}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                {tr
                  ? selectedPreset?.description.tr ?? ''
                  : selectedPreset?.description.en ?? ''}
              </p>
            </div>

            <div className="form-grid">
              <div className="field">
                <Label htmlFor="homepageLayout">{tr ? 'Anasayfa düzeni' : 'Homepage layout'}</Label>
                <select
                  id="homepageLayout"
                  name="homepageLayout"
                  value={homepageLayout}
                  onChange={(event) => setHomepageLayout(event.target.value as SiteFormValues['homepageLayout'])}
                >
                  {HOMEPAGE_LAYOUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {tr ? option.label.tr : option.label.en}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <Label htmlFor="articleLayout">{tr ? 'Makale düzeni' : 'Article layout'}</Label>
                <select
                  id="articleLayout"
                  name="articleLayout"
                  value={articleLayout}
                  onChange={(event) => setArticleLayout(event.target.value as SiteFormValues['articleLayout'])}
                >
                  {ARTICLE_LAYOUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {tr ? option.label.tr : option.label.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <Label htmlFor="themePrimary">{tr ? 'Ana renk' : 'Primary color'}</Label>
                <Input
                  id="themePrimary"
                  name="themePrimary"
                  type="color"
                  value={themePrimary}
                  onChange={(event) => setThemePrimary(event.target.value)}
                />
              </div>
              <div className="field">
                <Label htmlFor="themeAccent">{tr ? 'Vurgu rengi' : 'Accent color'}</Label>
                <Input
                  id="themeAccent"
                  name="themeAccent"
                  type="color"
                  value={themeAccent}
                  onChange={(event) => setThemeAccent(event.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <Label htmlFor="themeBackground">{tr ? 'Arka plan rengi' : 'Background color'}</Label>
              <Input
                id="themeBackground"
                name="themeBackground"
                type="color"
                value={themeBackground}
                onChange={(event) => setThemeBackground(event.target.value)}
              />
            </div>

            <div className="rounded-[24px] border border-sky-200/70 bg-white/90 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">{tr ? 'Canlı önizleme' : 'Live preview'}</p>
                  <p className="text-sm text-slate-600">
                    {tr
                      ? 'Tema seçiminin public yüzeyde nasıl hissedileceğini burada hızlıca görün.'
                      : 'Quickly preview how this theme choice will feel on the public surface.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-4 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: themePreview.tokens.primary }} />
                  <span className="size-4 rounded-full border border-white/70 shadow-sm" style={{ backgroundColor: themePreview.tokens.accent }} />
                  <span className="size-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: themePreview.tokens.background }} />
                </div>
              </div>

              <div
                className="overflow-hidden rounded-[28px] border p-4 md:p-5"
                style={{
                  background: `linear-gradient(180deg, ${themePreview.tokens.backgroundSoft}, ${themePreview.tokens.background})`,
                  borderColor: themePreview.tokens.border,
                }}
              >
                <div
                  className="rounded-[24px] border p-5"
                  style={{
                    background: `radial-gradient(circle at top left, ${themePreview.tokens.heroGlow}, transparent 32%), ${themePreview.tokens.panel}`,
                    borderColor: themePreview.tokens.border,
                    color: themePreview.tokens.foreground,
                  }}
                >
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                    <span
                      className="rounded-full border px-3 py-1"
                      style={{
                        borderColor: themePreview.tokens.border,
                        background: themePreview.tokens.panelStrong,
                      }}
                    >
                      {homepageLayout === 'digest' ? (tr ? 'Bülten' : 'Digest') : (tr ? 'Spot ışığı' : 'Spotlight')}
                    </span>
                    <span style={{ color: themePreview.tokens.muted }}>
                      {articleLayout === 'feature' ? (tr ? 'Öne çıkan makale' : 'Feature article') : (tr ? 'Editoryal akış' : 'Editorial flow')}
                    </span>
                  </div>

                  <div className={homepageLayout === 'digest' ? 'grid gap-4 lg:grid-cols-[0.95fr_1.05fr]' : 'grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'}>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-semibold leading-tight">{initialValues.name || (tr ? 'Site adı' : 'Site name')}</h3>
                      <p className="text-sm leading-6" style={{ color: themePreview.tokens.muted }}>
                        {initialValues.niche || (tr ? 'Tema, tipografi ve kart ritmi önizlemesi burada görünür.' : 'Theme, typography, and card rhythm preview appears here.')}
                      </p>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold"
                          style={{
                            backgroundColor: themePreview.tokens.primary,
                            color: themePreview.tokens.buttonForeground,
                          }}
                        >
                          {tr ? 'Öne çıkan içerik' : 'Featured story'}
                        </span>
                        <span className="text-sm" style={{ color: themePreview.tokens.muted }}>
                          {tr ? 'Tema vurgusu' : 'Theme accent'}
                        </span>
                      </div>
                    </div>

                    <div
                      className="rounded-[20px] border p-4"
                      style={{
                        background: themePreview.tokens.panelStrong,
                        borderColor: themePreview.tokens.border,
                      }}
                    >
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                        <span
                          className="rounded-full border px-3 py-1"
                          style={{
                            borderColor: themePreview.tokens.border,
                            backgroundColor: themePreview.tokens.panel,
                          }}
                        >
                          {tr ? 'Kart görünümü' : 'Card preview'}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold">
                        {articleLayout === 'feature'
                          ? tr
                            ? 'Geniş hero makale tonu'
                            : 'Wide hero article tone'
                          : tr
                            ? 'Dengeli editoryal makale tonu'
                            : 'Balanced editorial article tone'}
                      </h4>
                      <p className="mt-2 text-sm leading-6" style={{ color: themePreview.tokens.muted }}>
                        {tr
                          ? 'Bu önizleme public homepage ve article yüzeylerinin renk ailesini ve kontrast hissini simgeler.'
                          : 'This preview approximates the color family and contrast feel of the public homepage and article surfaces.'}
                      </p>
                      <div className="mt-4 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${themePreview.tokens.primary}, ${themePreview.tokens.accent})` }} />
                    </div>
                  </div>
                </div>
              </div>
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
