import Link from 'next/link'
import { LogOut, Plus } from 'lucide-react'
import { desc } from 'drizzle-orm'

import { AppSidebar } from '@/components/app-sidebar'
import { AdminRouteHeader } from '@/components/admin/admin-route-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { logoutAction, setAdminLocaleAction } from './actions'

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireAdminSession()
  const locale = await getInterfaceLocale()

  const siteList = await db
    .select({ id: sites.id, name: sites.name, slug: sites.slug })
    .from(sites)
    .orderBy(desc(sites.createdAt))

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--header-height': '4rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar
        locale={locale}
        sites={siteList}
        user={{
          name: session.displayName,
          email: session.email,
          role: session.role,
        }}
      />
      <SidebarInset>
        <main
          data-admin-surface="true"
          style={
            {
              '--background': '#ffffff',
              '--foreground': '#0f172a',
              '--card': '#ffffff',
              '--card-foreground': '#0f172a',
              '--popover': '#ffffff',
              '--popover-foreground': '#0f172a',
              '--primary': '#0ea5e9',
              '--primary-foreground': '#f0f9ff',
              '--secondary': '#f3f6fb',
              '--secondary-foreground': '#0f172a',
              '--muted': '#f8fafc',
              '--muted-foreground': '#64748b',
              '--accent': '#eff6ff',
              '--accent-foreground': '#0f172a',
              '--destructive': '#ef4444',
              '--border': 'rgba(15, 23, 42, 0.08)',
              '--input': '#ffffff',
              '--ring': 'rgba(14, 165, 233, 0.28)',
              '--sidebar': '#ffffff',
              '--sidebar-foreground': '#0f172a',
              '--sidebar-primary': '#0ea5e9',
              '--sidebar-primary-foreground': '#f0f9ff',
              '--sidebar-accent': '#f8fafc',
              '--sidebar-accent-foreground': '#0f172a',
              '--sidebar-border': 'rgba(15, 23, 42, 0.08)',
              '--sidebar-ring': 'rgba(14, 165, 233, 0.28)',
            } as React.CSSProperties
          }
          className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f4faff_100%)] text-foreground"
        >
          <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-4 lg:gap-6 lg:px-6 lg:py-6">
            <Card className="rounded-[28px] border-sky-100/80 bg-white/95 shadow-[0_28px_80px_-42px_rgba(2,132,199,0.24)] backdrop-blur">
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <SidebarTrigger className="-ml-1 mt-0.5 shrink-0 text-primary hover:bg-sky-50 hover:text-primary" />
                  <div className="min-w-0 flex-1">
                    <AdminRouteHeader locale={locale} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setAdminLocaleAction} className="flex items-center gap-1 rounded-2xl border border-border/80 bg-muted/60 p-1">
                    <button
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${locale === 'tr' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      name="locale"
                      value="tr"
                      type="submit"
                    >
                      TR
                    </button>
                    <button
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${locale === 'en' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      name="locale"
                      value="en"
                      type="submit"
                    >
                      EN
                    </button>
                  </form>
                  <Button asChild variant="outline" className="rounded-2xl lg:hidden">
                    <Link href="/admin/sites">{locale === 'tr' ? 'Siteler' : 'Sites'}</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl lg:hidden">
                    <Link href="/admin/articles">{locale === 'tr' ? 'Makaleler' : 'Articles'}</Link>
                  </Button>
                  <Button asChild className="rounded-2xl">
                    <Link href="/admin/articles">
                      <Plus className="size-4" />
                      {locale === 'tr' ? 'Yeni taslak' : 'New draft'}
                    </Link>
                  </Button>
                  <form action={logoutAction}>
                    <Button variant="outline" className="rounded-2xl">
                      <LogOut className="size-4" />
                      {locale === 'tr' ? 'Çıkış yap' : 'Sign out'}
                    </Button>
                  </form>
                </div>
              </div>
            </Card>

            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
