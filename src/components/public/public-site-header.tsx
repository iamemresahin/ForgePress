'use client'

import Link from 'next/link'
import { CarFront, Eye, FlaskConical, Gamepad2, Monitor, Plus, Search, Zap } from 'lucide-react'

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
  flowModeLabel,
  signInLabel,
  otherCategoriesLabel,
  siteId,
  locale,
  redirectPath,
  currentReader,
}: {
  homeHref: string
  siteId: string
  siteName: string
  locale: string
  redirectPath: string
  navItems: NavItem[]
  extraItems: NavItem[]
  flowModeLabel: string
  signInLabel: string
  otherCategoriesLabel: string
  currentReader?: { id: string; displayName: string; email: string } | null
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-6 px-4 py-4 md:px-6">
        <Link href={homeHref} className="flex items-center gap-3 text-[1.75rem] font-semibold tracking-tight text-white">
          <span className="h-12 w-3 rounded-full bg-white/95" />
          <span>{siteName}</span>
        </Link>

        <div className="hidden items-center gap-2 xl:flex">
          {navItems.map((item, index) => {
            const Icon = item.icon ? iconMap[item.icon] : null

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.92rem] font-medium transition ${
                  item.active ?? index === 1
                    ? 'border-white/0 bg-white text-black'
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

        <div className="hidden items-center gap-3 xl:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex size-12 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:text-white">
                <Plus className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 rounded-2xl border-white/10 bg-[#111112] p-2 text-white"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/45">
                {otherCategoriesLabel}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {extraItems.length > 0 ? (
                extraItems.map((item) => {
                  const Icon = item.icon ? iconMap[item.icon] : null

                  return (
                    <DropdownMenuItem
                      key={item.label}
                      asChild
                      className="cursor-pointer rounded-xl px-3 py-3 text-white/84 focus:bg-white/8 focus:text-white"
                    >
                      <Link href={item.href}>
                        {Icon ? <Icon className="size-4 text-white/55" /> : null}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-3 py-4 text-sm text-white/55">No extra categories yet.</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="inline-flex size-12 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:text-white">
            <Search className="size-5" />
          </button>
          <button className="inline-flex size-12 items-center justify-center rounded-full border border-white/10 text-white/72 transition hover:border-white/20 hover:text-white">
            <Eye className="size-5" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[0.95rem] font-medium text-white transition hover:border-white/20">
            <Zap className="size-4" />
            {flowModeLabel}
          </button>
          <PublicReaderAuthDialog
            siteId={siteId}
            siteName={siteName}
            redirectPath={redirectPath}
            locale={locale}
            currentReader={currentReader}
            triggerLabel={signInLabel}
            triggerClassName="inline-flex items-center rounded-full bg-white px-5 py-3 text-[0.95rem] font-semibold text-black transition hover:bg-white/92"
          />
        </div>
      </div>
    </header>
  )
}
