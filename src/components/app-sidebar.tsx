"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconArticle,
  IconCheck,
  IconChevronDown,
  IconListDetails,
  IconMessageCircle,
  IconNews,
  IconPlus,
  IconRadar2,
  IconSparkles,
  IconTopologyStar3,
} from "@tabler/icons-react"

import { BrandMark } from "@/components/brand-mark"
import type { InterfaceLocale } from "@/lib/interface-locale"
import { translateRole } from "@/lib/interface-locale"
import { setActiveSiteAction } from "@/app/admin/actions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type SiteItem = { id: string; name: string; slug: string }

function extractActiveSiteId(pathname: string): string | null {
  const match = pathname.match(/^\/admin\/sites\/([^/]+)/)
  return match?.[1] ?? null
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
}

// ---------------------------------------------------------------------------
// Site Switcher
// ---------------------------------------------------------------------------
function SiteSwitcher({
  sites,
  activeSite,
  tr,
}: {
  sites: SiteItem[]
  activeSite: SiteItem | null
  tr: boolean
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  function select(site: SiteItem) {
    setOpen(false)
    startTransition(async () => {
      await setActiveSiteAction(site.id)
      router.push(`/admin/sites/${site.id}`)
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/60 px-3 py-2 text-sm font-medium transition hover:bg-sidebar-accent"
      >
        <IconTopologyStar3 className="size-4 shrink-0 text-primary" />
        <span className="flex-1 truncate text-left text-sidebar-foreground">
          {activeSite ? activeSite.name : tr ? "Site seçin" : "Select a site"}
        </span>
        <IconChevronDown
          className={`size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-sidebar-border bg-white shadow-lg">
            <div className="max-h-56 overflow-y-auto py-1">
              {sites.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {tr ? "Henüz site yok." : "No sites yet."}
                </p>
              )}
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-accent"
                  onClick={() => select(site)}
                >
                  <span className="flex-1 truncate text-left">{site.name}</span>
                  {activeSite?.id === site.id && (
                    <IconCheck className="size-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-sidebar-border/60">
              <Link
                href="/admin/sites"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent"
              >
                <IconPlus className="size-3.5" />
                <span>{tr ? "Site ekle" : "Add site"}</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------
export function AppSidebar({
  user,
  locale,
  sites = [],
  cookieActiveSiteId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locale: InterfaceLocale
  sites?: SiteItem[]
  cookieActiveSiteId?: string | null
  user?: { name: string; email: string; role: string }
}) {
  const pathname = usePathname()
  const tr = locale === "tr"
  const [articlesOpen, setArticlesOpen] = useState(
    pathname.includes("/articles"),
  )

  const resolvedUser = user ?? {
    name: "ForgePress Admin",
    email: "admin@example.com",
    role: "platform_admin",
  }

  // URL takes priority; fall back to cookie
  const urlSiteId = extractActiveSiteId(pathname)
  const activeSiteId = urlSiteId ?? cookieActiveSiteId ?? null
  const activeSite = sites.find((s) => s.id === activeSiteId) ?? null

  const showPlatformAdmin = resolvedUser.role === "platform_admin"

  // Site-scoped nav items
  const siteBase = activeSite ? `/admin/sites/${activeSite.id}` : null

  const articleStatuses = activeSite
    ? [
        { label: tr ? "Tümü" : "All", url: `${siteBase}/articles` },
        { label: tr ? "Taslak" : "Draft", url: `${siteBase}/articles?status=draft` },
        { label: tr ? "İnceleme" : "Review", url: `${siteBase}/articles?status=review` },
        { label: tr ? "Yayında" : "Published", url: `${siteBase}/articles?status=published` },
      ]
    : []

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      {/* ------------------------------------------------------------------ */}
      {/* Header: Logo + Site Switcher                                        */}
      {/* ------------------------------------------------------------------ */}
      <SidebarHeader className="gap-3 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:rounded-2xl data-[slot=sidebar-menu-button]:border data-[slot=sidebar-menu-button]:border-sidebar-border/70 data-[slot=sidebar-menu-button]:bg-white data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/admin">
                <BrandMark className="size-5 text-primary" />
                <span className="text-base font-semibold">ForgePress</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Site Switcher — always visible */}
        {showPlatformAdmin && (
          <SiteSwitcher sites={sites} activeSite={activeSite} tr={tr} />
        )}
      </SidebarHeader>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                             */}
      {/* ------------------------------------------------------------------ */}
      <SidebarContent>

        {/* ---- Site-scoped nav ---- */}
        {activeSite && siteBase ? (
          <SidebarGroup>
            <SidebarGroupLabel className="truncate text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {activeSite.name}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>

                {/* Site Rules / Settings */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === siteBase || pathname === `${siteBase}/settings`}
                    tooltip={tr ? "Site Kuralları" : "Site Rules"}
                  >
                    <Link href={siteBase}>
                      <IconSparkles />
                      <span>{tr ? "Site Kuralları" : "Site Rules"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Articles (collapsible) */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.includes("/articles")}
                    tooltip={tr ? "Makaleler" : "Articles"}
                    className="cursor-pointer"
                    onClick={() => setArticlesOpen((o) => !o)}
                  >
                    <IconArticle />
                    <span>{tr ? "Makaleler" : "Articles"}</span>
                    <IconChevronDown
                      className={`ml-auto size-3.5 shrink-0 transition-transform duration-150 ${articlesOpen ? "rotate-180" : ""}`}
                    />
                  </SidebarMenuButton>
                  {articlesOpen && (
                    <SidebarMenuSub>
                      {articleStatuses.map((item) => (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url}>{item.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/articles" className="font-medium text-primary">
                            <IconPlus className="size-3" />
                            {tr ? "Yeni taslak" : "New draft"}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                {/* Sources */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`${siteBase}/sources`)}
                    tooltip={tr ? "Kaynaklar" : "Sources"}
                  >
                    <Link href={`${siteBase}/sources`}>
                      <IconNews />
                      <span>{tr ? "Kaynaklar" : "Sources"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Comments */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`${siteBase}/comments`)}
                    tooltip={tr ? "Yorumlar" : "Comments"}
                  >
                    <Link href={`${siteBase}/comments`}>
                      <IconMessageCircle />
                      <span>{tr ? "Yorumlar" : "Comments"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>


              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* ---- No site selected: show minimal nav ---- */
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Dashboard">
                    <Link href="/admin">
                      <IconSparkles />
                      <span>{tr ? "Panel" : "Dashboard"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!showPlatformAdmin && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive(pathname, "/admin/articles")}>
                        <Link href="/admin/articles">
                          <IconArticle />
                          <span>{tr ? "Makaleler" : "Articles"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive(pathname, "/admin/comments")}>
                        <Link href="/admin/comments">
                          <IconMessageCircle />
                          <span>{tr ? "Yorumlar" : "Comments"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ---- Genel Ayarlar (platform_admin only) ---- */}
        {showPlatformAdmin && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {tr ? "Genel Ayarlar" : "Platform"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin"}
                    tooltip="Dashboard"
                  >
                    <Link href="/admin">
                      <IconSparkles />
                      <span>{tr ? "Panel" : "Dashboard"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, "/admin/jobs")}
                    tooltip={tr ? "Görevler" : "Jobs"}
                  >
                    <Link href="/admin/jobs">
                      <IconListDetails />
                      <span>{tr ? "Görevler" : "Jobs"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, "/admin/ops")}
                    tooltip={tr ? "Operasyonlar" : "Ops"}
                  >
                    <Link href="/admin/ops">
                      <IconRadar2 />
                      <span>{tr ? "Operasyonlar" : "Ops"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/sites"}
                    tooltip={tr ? "Tüm Siteler" : "All Sites"}
                  >
                    <Link href="/admin/sites">
                      <IconTopologyStar3 />
                      <span>{tr ? "Tüm Siteler" : "All Sites"}  </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ------------------------------------------------------------------ */}
      {/* Footer: user info                                                   */}
      {/* ------------------------------------------------------------------ */}
      <SidebarFooter>
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent px-3 py-3 text-sm shadow-sm">
          <p className="truncate font-medium text-sidebar-foreground">{resolvedUser.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{resolvedUser.email}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/60">
            {translateRole(locale, resolvedUser.role)}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
