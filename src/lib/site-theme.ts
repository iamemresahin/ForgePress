import type { CSSProperties } from 'react'
import type { InferSelectModel } from 'drizzle-orm'

import type { sites } from '@/lib/db/schema'

export type ThemePresetKey =
  | 'forge_blue'
  | 'editorial_glow'
  | 'news_sand'
  | 'midnight_signal'
  | 'kantan_editorial'
export type HomepageLayoutKey = 'spotlight' | 'digest'
export type ArticleLayoutKey = 'editorial' | 'feature'

type ThemeRecord = Pick<
  InferSelectModel<typeof sites>,
  'themePreset' | 'homepageLayout' | 'articleLayout' | 'themePrimary' | 'themeAccent' | 'themeBackground'
>

export type ThemePresetDefinition = {
  key: ThemePresetKey
  label: {
    tr: string
    en: string
  }
  description: {
    tr: string
    en: string
  }
  tokens: {
    background: string
    backgroundSoft: string
    panel: string
    panelStrong: string
    border: string
    foreground: string
    muted: string
    primary: string
    accent: string
    buttonForeground: string
    heroGlow: string
  }
}

type ThemeTokens = ThemePresetDefinition['tokens']

export const THEME_PRESETS: Record<ThemePresetKey, ThemePresetDefinition> = {
  forge_blue: {
    key: 'forge_blue',
    label: { tr: 'Forge Blue', en: 'Forge Blue' },
    description: {
      tr: 'Marka ile uyumlu soğuk mavi, temiz SaaS yayını hissi.',
      en: 'Brand-aligned cool blue with a clean SaaS publishing feel.',
    },
    tokens: {
      background: '#f7fbff',
      backgroundSoft: '#eef6ff',
      panel: 'rgba(255,255,255,0.82)',
      panelStrong: '#ffffff',
      border: 'rgba(14, 104, 195, 0.14)',
      foreground: '#10233b',
      muted: '#5b7391',
      primary: '#1782f6',
      accent: '#6ed6ff',
      buttonForeground: '#ffffff',
      heroGlow: 'rgba(23,130,246,0.18)',
    },
  },
  editorial_glow: {
    key: 'editorial_glow',
    label: { tr: 'Editorial Glow', en: 'Editorial Glow' },
    description: {
      tr: 'Daha sıcak, premium dergi tonu; kültür ve yaşam siteleri için.',
      en: 'A warmer premium magazine tone for culture and lifestyle brands.',
    },
    tokens: {
      background: '#fffaf5',
      backgroundSoft: '#fff1de',
      panel: 'rgba(255,250,245,0.86)',
      panelStrong: '#ffffff',
      border: 'rgba(205, 114, 46, 0.16)',
      foreground: '#382014',
      muted: '#8d6855',
      primary: '#de7a3a',
      accent: '#ffbf70',
      buttonForeground: '#ffffff',
      heroGlow: 'rgba(222,122,58,0.16)',
    },
  },
  news_sand: {
    key: 'news_sand',
    label: { tr: 'News Sand', en: 'News Sand' },
    description: {
      tr: 'Gazete-benzeri açık zemin, daha editoryal ve güven veren görünüm.',
      en: 'A paper-like light surface with an editorial, trustworthy tone.',
    },
    tokens: {
      background: '#fbf7ef',
      backgroundSoft: '#f3ebdb',
      panel: 'rgba(255,255,252,0.84)',
      panelStrong: '#fffdf8',
      border: 'rgba(116, 91, 45, 0.14)',
      foreground: '#2d2619',
      muted: '#75674d',
      primary: '#7b5f2d',
      accent: '#ccb57b',
      buttonForeground: '#fffdf8',
      heroGlow: 'rgba(123,95,45,0.12)',
    },
  },
  midnight_signal: {
    key: 'midnight_signal',
    label: { tr: 'Midnight Signal', en: 'Midnight Signal' },
    description: {
      tr: 'Koyu, teknoloji odaklı ve daha dramatik yayın yüzeyi.',
      en: 'Dark, tech-forward, and more dramatic publishing surface.',
    },
    tokens: {
      background: '#08111d',
      backgroundSoft: '#0f1c2e',
      panel: 'rgba(11,23,39,0.76)',
      panelStrong: '#102038',
      border: 'rgba(114, 196, 255, 0.16)',
      foreground: '#f2f7ff',
      muted: '#a0b7d5',
      primary: '#6cc5ff',
      accent: '#8af0ff',
      buttonForeground: '#08111d',
      heroGlow: 'rgba(108,197,255,0.18)',
    },
  },
  kantan_editorial: {
    key: 'kantan_editorial',
    label: { tr: 'Signal Editorial', en: 'Signal Editorial' },
    description: {
      tr: 'Siyah zemin, yoğun haber akışı ve güçlü görsel odaklı koyu editoryal yüzey.',
      en: 'Black-surface, image-led, dense editorial feed for a premium dark newsroom feel.',
    },
    tokens: {
      background: '#050505',
      backgroundSoft: '#0b0b0b',
      panel: 'rgba(13,13,13,0.94)',
      panelStrong: '#111111',
      border: 'rgba(255,255,255,0.12)',
      foreground: '#ffffff',
      muted: '#a1a1aa',
      primary: '#f97316',
      accent: '#fdba74',
      buttonForeground: '#ffffff',
      heroGlow: 'rgba(249,115,22,0.12)',
    },
  },
}

export const HOMEPAGE_LAYOUT_OPTIONS: Array<{
  value: HomepageLayoutKey
  label: { tr: string; en: string }
  description: { tr: string; en: string }
}> = [
  {
    value: 'spotlight',
    label: { tr: 'Spotlight', en: 'Spotlight' },
    description: {
      tr: 'Tek güçlü hero ve büyük öne çıkan içerik akışı.',
      en: 'One strong hero with a prominent featured-content flow.',
    },
  },
  {
    value: 'digest',
    label: { tr: 'Digest', en: 'Digest' },
    description: {
      tr: 'Bülten gibi daha yoğun, başlık odaklı liste görünümü.',
      en: 'A denser, headline-led digest style.',
    },
  },
]

export const ARTICLE_LAYOUT_OPTIONS: Array<{
  value: ArticleLayoutKey
  label: { tr: string; en: string }
  description: { tr: string; en: string }
}> = [
  {
    value: 'editorial',
    label: { tr: 'Editorial', en: 'Editorial' },
    description: {
      tr: 'Temiz başlık, bilgi rozeti ve klasik editoryal akış.',
      en: 'Clean headline, metadata chips, and a classic editorial flow.',
    },
  },
  {
    value: 'feature',
    label: { tr: 'Feature', en: 'Feature' },
    description: {
      tr: 'Daha görsel, daha geniş hero ve premium makale hissi.',
      en: 'A more visual, wider hero with a premium feature feel.',
    },
  },
]

function isHexColor(value?: string | null) {
  return Boolean(value && /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value))
}

export function getThemePreset(preset?: string | null) {
  const key = (preset ?? 'forge_blue') as ThemePresetKey
  return THEME_PRESETS[key] ?? THEME_PRESETS.forge_blue
}

function buildTheme(site: ThemeRecord) {
  const preset = getThemePreset(site.themePreset)

  return {
    preset: preset.key,
    homepageLayout: (site.homepageLayout ?? 'spotlight') as HomepageLayoutKey,
    articleLayout: (site.articleLayout ?? 'editorial') as ArticleLayoutKey,
    tokens: {
      ...preset.tokens,
      primary: isHexColor(site.themePrimary) ? site.themePrimary! : preset.tokens.primary,
      accent: isHexColor(site.themeAccent) ? site.themeAccent! : preset.tokens.accent,
      background: isHexColor(site.themeBackground) ? site.themeBackground! : preset.tokens.background,
    },
  }
}

function hexToRgbTuple(value: string) {
  const normalized = value.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized

  const numeric = Number.parseInt(expanded, 16)

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgbTuple(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgbTuple(hex)
  const toLinear = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function buildLightTokens(tokens: ThemeTokens) {
  return {
    background: '#f7f7f5',
    backgroundSoft: '#eceff4',
    panel: 'rgba(255,255,255,0.92)',
    panelStrong: '#ffffff',
    border: 'rgba(15, 23, 42, 0.1)',
    foreground: '#14181f',
    muted: '#64748b',
    primary: tokens.primary,
    accent: tokens.accent,
    buttonForeground: '#ffffff',
    heroGlow: withAlpha(tokens.primary, 0.16),
  }
}

function buildDarkTokens(tokens: ThemeTokens) {
  return {
    background: '#050505',
    backgroundSoft: '#0b0d12',
    panel: 'rgba(13,13,13,0.94)',
    panelStrong: '#111214',
    border: 'rgba(255,255,255,0.12)',
    foreground: '#ffffff',
    muted: '#a1a1aa',
    primary: tokens.primary,
    accent: tokens.accent,
    buttonForeground: '#ffffff',
    heroGlow: withAlpha(tokens.primary, 0.12),
  }
}

function buildPublicModeTokens(tokens: ThemeTokens) {
  const isDarkBase = getLuminance(tokens.background) < 0.2

  return {
    dark: isDarkBase ? tokens : buildDarkTokens(tokens),
    light: isDarkBase ? buildLightTokens(tokens) : tokens,
  }
}

export function resolveSiteTheme(site: ThemeRecord) {
  const theme = buildTheme(site)
  const publicModes = buildPublicModeTokens(theme.tokens)

  return {
    ...theme,
    publicModes,
    style: {
      '--site-background': theme.tokens.background,
      '--site-background-soft': theme.tokens.backgroundSoft,
      '--site-panel': theme.tokens.panel,
      '--site-panel-strong': theme.tokens.panelStrong,
      '--site-border': theme.tokens.border,
      '--site-foreground': theme.tokens.foreground,
      '--site-muted': theme.tokens.muted,
      '--site-primary': theme.tokens.primary,
      '--site-accent': theme.tokens.accent,
      '--site-button-foreground': theme.tokens.buttonForeground,
      '--site-hero-glow': theme.tokens.heroGlow,
      '--site-background-dark': publicModes.dark.background,
      '--site-background-soft-dark': publicModes.dark.backgroundSoft,
      '--site-panel-dark': publicModes.dark.panel,
      '--site-panel-strong-dark': publicModes.dark.panelStrong,
      '--site-border-dark': publicModes.dark.border,
      '--site-foreground-dark': publicModes.dark.foreground,
      '--site-muted-dark': publicModes.dark.muted,
      '--site-primary-dark': publicModes.dark.primary,
      '--site-accent-dark': publicModes.dark.accent,
      '--site-button-foreground-dark': publicModes.dark.buttonForeground,
      '--site-hero-glow-dark': publicModes.dark.heroGlow,
      '--site-background-light': publicModes.light.background,
      '--site-background-soft-light': publicModes.light.backgroundSoft,
      '--site-panel-light': publicModes.light.panel,
      '--site-panel-strong-light': publicModes.light.panelStrong,
      '--site-border-light': publicModes.light.border,
      '--site-foreground-light': publicModes.light.foreground,
      '--site-muted-light': publicModes.light.muted,
      '--site-primary-light': publicModes.light.primary,
      '--site-accent-light': publicModes.light.accent,
      '--site-button-foreground-light': publicModes.light.buttonForeground,
      '--site-hero-glow-light': publicModes.light.heroGlow,
    } as CSSProperties,
  }
}

export type ResolvedSiteTheme = ReturnType<typeof resolveSiteTheme>

export function resolveThemePreview(site: ThemeRecord) {
  return buildTheme(site)
}
