'use client'

import Link from 'next/link'
import { CarFront, FlaskConical, Gamepad2, Monitor, Moon, Plus, Sun } from 'lucide-react'

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
}) {
  const tr = locale.toLowerCase().startsWith('tr')
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
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-6 px-4 py-4 md:px-6">
        <Link href={homeHref} className={`flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight ${mode === 'light' ? 'text-slate-950' : 'text-white'}`}>
          <span className={brandBarClassName} />
          <span>{siteName}</span>
        </Link>

        <div className="flex items-center gap-2 lg:hidden">
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
                ? 'inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'
                : 'inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/92'
            }
          />
          <button type="button" onClick={toggleMode} className={ghostButtonClassName}>
            {mode === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>

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

        <div className="hidden items-center gap-3 lg:flex">
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
    </header>
  )
}
