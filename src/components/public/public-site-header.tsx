'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CarFront, ChevronDown, FlaskConical, Gamepad2, Globe, Monitor, Moon, Plus, Sun, X } from 'lucide-react'

import { usePublicColorMode } from '@/components/public/public-color-mode'
import { PublicReaderAuthDialog } from '@/components/public/public-reader-auth-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = {
  href: string
  label: string
  icon?: 'monitor' | 'gamepad' | 'flask' | 'car'
  accentDot?: boolean
  active?: boolean
}

const iconMap = {
  monitor: Monitor,
  gamepad: Gamepad2,
  flask: FlaskConical,
  car: CarFront,
} as const

const LOCALE_LABELS: Record<string, string> = {
  en: 'English', tr: 'Türkçe', de: 'Deutsch', fr: 'Français',
  es: 'Español', it: 'Italiano', pt: 'Português', ar: 'العربية',
  ja: '日本語', zh: '中文',
}

function MobileCategoryBar({
  navItems,
  extraItems,
  otherCategoriesLabel,
  mode,
}: {
  navItems: NavItem[]
  extraItems: NavItem[]
  otherCategoriesLabel: string
  mode: 'light' | 'dark'
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative lg:hidden">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3 pt-0.5">
        {navItems.map((item, index) => {
          const Icon = item.icon ? iconMap[item.icon] : null
          const isActive = item.active ?? index === 1

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition ${
                isActive
                  ? mode === 'light'
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-white/0 bg-white text-black'
                  : mode === 'light'
                    ? 'border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-950'
                    : 'border-white/12 text-white/68 hover:border-white/30 hover:text-white'
              }`}
            >
              {item.accentDot ? <span className="size-1.5 rounded-full bg-[#ff5a4f]" /> : null}
              {Icon ? <Icon className="size-3.5" /> : null}
              {item.label}
            </Link>
          )
        })}

        {extraItems.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition ${
              open
                ? mode === 'light'
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-white/0 bg-white text-black'
                : mode === 'light'
                  ? 'border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-950'
                  : 'border-white/12 text-white/68 hover:border-white/30 hover:text-white'
            }`}
          >
            <Plus className="size-3" />
            {otherCategoriesLabel}
            <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Extra topics dropdown panel */}
      {open && extraItems.length > 0 && (
        <div
          className={`absolute left-0 right-0 z-50 mx-4 mb-2 rounded-[20px] border p-3 shadow-xl ${
            mode === 'light'
              ? 'border-slate-200 bg-white'
              : 'border-white/10 bg-[#111112]'
          }`}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className={`text-[0.72rem] font-semibold uppercase tracking-[0.2em] ${mode === 'light' ? 'text-slate-400' : 'text-white/38'}`}>
              {otherCategoriesLabel}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`inline-flex size-6 items-center justify-center rounded-full ${mode === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white/80'}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {extraItems.map((item) => {
              const Icon = item.icon ? iconMap[item.icon] : null

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition ${
                    mode === 'light'
                      ? 'border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-950'
                      : 'border-white/12 text-white/68 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {Icon ? <Icon className="size-3.5" /> : null}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function PublicSiteHeader({
  homeHref,
  siteName,
  navItems,
  extraItems,
  signInLabel,
  otherCategoriesLabel,
  siteId,
  locale,
  redirectPath,
  currentReader,
  authBrandName,
  googleClientId,
  supportedLocales,
}: {
  homeHref: string
  siteId: string
  siteName: string
  locale: string
  redirectPath: string
  navItems: NavItem[]
  extraItems: NavItem[]
  signInLabel: string
  otherCategoriesLabel: string
  currentReader?: { id: string; displayName: string; email: string } | null
  authBrandName?: string | null
  googleClientId?: string | null
  supportedLocales?: string[]
}) {
  const tr = locale.toLowerCase().startsWith('tr')
  const searchParams = useSearchParams()
  const activeLang = searchParams.get('lang')
  const { mode, toggleMode } = usePublicColorMode()
  const headerClassName =
    mode === 'light'
      ? 'sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl'
      : 'sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl'
  const brandBarClassName = mode === 'light' ? 'h-12 w-3 rounded-full bg-slate-950' : 'h-12 w-3 rounded-full bg-white/95'
  const ghostButtonClassName =
    mode === 'light'
      ? 'inline-flex size-12 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-950'
      : 'inline-flex size-12 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:text-white'
  const utilityButtonClassName =
    mode === 'light'
      ? 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[0.92rem] font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950'
      : 'inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-[0.92rem] font-medium text-white transition hover:border-white/20'

  return (
    <header className={headerClassName}>
      {/* ── Top bar ── */}
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-6 px-4 py-4 md:px-6">
        <Link href={homeHref} className={`flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight ${mode === 'light' ? 'text-slate-950' : 'text-white'}`}>
          <span className={brandBarClassName} />
          <span>{siteName}</span>
        </Link>

        {/* Mobile: only dark mode toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={toggleMode} className={ghostButtonClassName}>
            {mode === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>

        {/* Desktop: nav items */}
        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item, index) => {
            const Icon = item.icon ? iconMap[item.icon] : null

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.92rem] font-medium transition ${
                  item.active ?? index === 1
                    ? mode === 'light'
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-white/0 bg-white text-black'
                    : mode === 'light'
                      ? 'border-transparent text-slate-500 hover:text-slate-950'
                      : 'border-transparent text-white/72 hover:text-white'
                }`}
              >
                {item.accentDot ? <span className="size-2 rounded-full bg-[#ff5a4f]" /> : null}
                {Icon ? <Icon className="size-4" /> : null}
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Desktop: utility buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          {supportedLocales && supportedLocales.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={utilityButtonClassName}>
                  <Globe className="size-4" />
                  {LOCALE_LABELS[activeLang ?? locale] ?? (activeLang ?? locale).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-48 rounded-2xl p-2 ${
                  mode === 'light'
                    ? 'border-slate-200 bg-white text-slate-950'
                    : 'border-white/10 bg-[#111112] text-white'
                }`}
              >
                <DropdownMenuLabel className={`px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] ${mode === 'light' ? 'text-slate-400' : 'text-white/45'}`}>
                  {tr ? 'Dil' : 'Language'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={mode === 'light' ? 'bg-slate-200' : 'bg-white/10'} />
                {supportedLocales.map((loc) => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (loc === locale) {
                    params.delete('lang')
                  } else {
                    params.set('lang', loc)
                  }
                  const isActive = (activeLang ?? locale) === loc
                  return (
                    <DropdownMenuItem
                      key={loc}
                      asChild
                      className={`cursor-pointer rounded-xl px-3 py-3 ${
                        mode === 'light'
                          ? isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-700 focus:bg-slate-100 focus:text-slate-950'
                          : isActive ? 'bg-white/8 text-white' : 'text-white/84 focus:bg-white/8 focus:text-white'
                      }`}
                    >
                      <Link href={`${homeHref}?${params.toString()}`}>
                        {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={utilityButtonClassName}>
                <Plus className="size-5" />
                {otherCategoriesLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={`w-72 rounded-2xl p-2 ${
                mode === 'light'
                  ? 'border-slate-200 bg-white text-slate-950'
                  : 'border-white/10 bg-[#111112] text-white'
              }`}
            >
              <DropdownMenuLabel className={`px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] ${mode === 'light' ? 'text-slate-400' : 'text-white/45'}`}>
                {otherCategoriesLabel}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={mode === 'light' ? 'bg-slate-200' : 'bg-white/10'} />
              {extraItems.length > 0 ? (
                extraItems.map((item) => {
                  const Icon = item.icon ? iconMap[item.icon] : null

                  return (
                    <DropdownMenuItem
                      key={item.label}
                      asChild
                      className={`cursor-pointer rounded-xl px-3 py-3 ${
                        mode === 'light'
                          ? 'text-slate-700 focus:bg-slate-100 focus:text-slate-950'
                          : 'text-white/84 focus:bg-white/8 focus:text-white'
                      }`}
                    >
                      <Link href={item.href}>
                        {Icon ? <Icon className={`size-4 ${mode === 'light' ? 'text-slate-400' : 'text-white/55'}`} /> : null}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className={`px-3 py-4 text-sm ${mode === 'light' ? 'text-slate-500' : 'text-white/55'}`}>
                  {tr ? 'Henüz ek kategori yok.' : 'No extra categories yet.'}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" onClick={toggleMode} className={utilityButtonClassName}>
            {mode === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {mode === 'light' ? (tr ? 'Karanlık' : 'Dark') : tr ? 'Aydınlık' : 'Light'}
          </button>
          <PublicReaderAuthDialog
            siteId={siteId}
            siteName={siteName}
            redirectPath={redirectPath}
            locale={locale}
            currentReader={currentReader}
            authBrandName={authBrandName}
            googleClientId={googleClientId}
            triggerLabel={signInLabel}
            triggerClassName={
              mode === 'light'
                ? 'inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-[0.92rem] font-semibold text-white transition hover:bg-slate-800'
                : 'inline-flex items-center rounded-full bg-white px-5 py-2.5 text-[0.92rem] font-semibold text-black transition hover:bg-white/92'
            }
          />
        </div>
      </div>

      {/* ── Mobile: horizontal category scroll with +More dropdown ── */}
      <MobileCategoryBar
        navItems={navItems}
        extraItems={extraItems}
        otherCategoriesLabel={otherCategoriesLabel}
        mode={mode}
      />
    </header>
  )
}
