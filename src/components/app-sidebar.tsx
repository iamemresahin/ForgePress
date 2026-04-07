"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconArticle,
  IconCheck,
  IconChevronDown,
  IconFolderPlus,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconNews,
  IconPlus,
  IconRadar2,
  IconSettings,
  IconSparkles,
  IconTopologyStar3,
} from "@tabler/icons-react"

import { BrandMark } from "@/components/brand-mark"
import type { InterfaceLocale } from "@/lib/interface-locale"
import { translateRole } from "@/lib/interface-locale"
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

const allSystemItems = [
  { title: "Jobs", url: "/admin/jobs", icon: IconListDetails },
  { title: "Ops", url: "/admin/ops", icon: IconRadar2 },
]

function getSystemItems(role: string) {
  if (role === "platform_admin") return allSystemItems
  if (role === "site_editor") return allSystemItems.filter((i) => i.title === "Jobs")
  return []
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
}

function extractActiveSiteId(pathname: string): string | null {
  const match = pathname.match(/^\/admin\/sites\/([^/]+)/)
  return match?.[1] ?? null
}

export function AppSidebar({
  user,
  locale,
  sites = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locale: InterfaceLocale
  sites?: SiteItem[]
  user?: { name: string; email: string; role: string }
}) {
  const pathname = usePathname()
  const tr = locale === "tr"

  const activeSiteId = extractActiveSiteId(pathname)
  const activeSite = sites.find((s) => s.id === activeSiteId) ?? null

  const [sitesOpen, setSitesOpen] = useState(
    pathname.startsWith("/admin/sites")
  )

  const resolvedUser = user ?? { name: "ForgePress Admin", email: "admin@example.com", role: "platform_admin" }
  const systemItems = getSystemItems(resolvedUser.role)
  const showSites = resolvedUser.role === "platform_admin"

  // Site-scoped nav shown when a site is active
  const siteNav = activeSite
    ? [
        { title: tr ? "Genel Bakış" : "Overview", url: `/admin/sites/${activeSite.id}`, icon: IconSparkles },
        { title: tr ? "Makaleler" : "Articles", url: `/admin/sites/${activeSite.id}/articles`, icon: IconArticle },
        { title: tr ? "Kaynaklar" : "Sources", url: `/admin/sites/${activeSite.id}/sources`, icon: IconNews },
        { title: tr ? "Yorumlar" : "Comments", url: `/admin/sites/${activeSite.id}/comments`, icon: IconMessageCircle },
        { title: tr ? "Ayarlar" : "Settings", url: `/admin/sites/${activeSite.id}/settings`, icon: IconSettings },
      ]
    : null

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
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
      </SidebarHeader>

      <SidebarContent>
        {/* Site context nav — shown when a site is selected */}
        {activeSite && siteNav ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="truncate text-xs font-semibold text-sidebar-foreground/70">
                {activeSite.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {siteNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || (item.url !== `/admin/sites/${activeSite.id}` && pathname.startsWith(item.url))}
                        tooltip={item.title}
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Site switcher in context mode */}
            {showSites && (
              <SidebarGroup>
                <SidebarGroupLabel>{tr ? "Siteler" : "Sites"}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sites.map((site) => (
                      <SidebarMenuItem key={site.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={site.id === activeSiteId}
                          tooltip={site.name}
                        >
                          <Link href={`/admin/sites/${site.id}`}>
                            <span className="truncate">{site.name}</span>
                            {site.id === activeSiteId && <IconCheck className="ml-auto size-3.5 shrink-0" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/admin/sites" className="text-muted-foreground">
                          <IconPlus className="size-3.5" />
                          <span>{tr ? "Site ekle" : "Add site"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        ) : (
          /* Global nav — shown when no site is selected */
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
              {resolvedUser.role !== "reviewer" && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                    >
                      <Link href="/admin/articles">
                        <IconFolderPlus />
                        <span>{tr ? "Hızlı Taslak" : "Quick Draft"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin"}
                    tooltip={tr ? "Panel" : "Dashboard"}
                  >
                    <Link href="/admin">
                      <IconSparkles />
                      <span>{tr ? "Panel" : "Dashboard"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {showSites && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSitesOpen((o) => !o)}
                      isActive={pathname.startsWith("/admin/sites")}
                      tooltip={tr ? "Siteler" : "Sites"}
                      className="cursor-pointer"
                    >
                      <IconTopologyStar3 />
                      <span>{tr ? "Siteler" : "Sites"}</span>
                      <IconChevronDown
                        className={`ml-auto size-4 shrink-0 transition-transform duration-200 ${sitesOpen ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>

                    {sitesOpen && (
                      <SidebarMenuSub>
                        {sites.map((site) => (
                          <SidebarMenuSubItem key={site.id}>
                            <SidebarMenuSubButton asChild>
                              <Link href={`/admin/sites/${site.id}`}>
                                <span className="truncate">{site.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href="/admin/sites" className="text-muted-foreground">
                              <IconPlus className="size-3.5" />
                              <span>{tr ? "Site ekle" : "Add site"}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )}

                {resolvedUser.role !== "reviewer" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive(pathname, "/admin/articles")} tooltip={tr ? "Tüm Makaleler" : "All Articles"}>
                        <Link href="/admin/articles">
                          <IconArticle />
                          <span>{tr ? "Makaleler" : "Articles"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive(pathname, "/admin/sources")} tooltip={tr ? "Tüm Kaynaklar" : "All Sources"}>
                        <Link href="/admin/sources">
                          <IconNews />
                          <span>{tr ? "Kaynaklar" : "Sources"}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(pathname, "/admin/comments")} tooltip={tr ? "Tüm Yorumlar" : "All Comments"}>
                    <Link href="/admin/comments">
                      <IconMessageCircle />
                      <span>{tr ? "Yorumlar" : "Comments"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {systemItems.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{tr ? "Sistem" : "System"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(pathname, item.url)}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title === "Jobs" ? (tr ? "Görevler" : "Jobs") : (tr ? "Operasyonlar" : "Ops")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent px-3 py-3 text-sm shadow-sm">
          <p className="truncate font-medium text-sidebar-foreground">{resolvedUser.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{resolvedUser.email}</p>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.2em] text-sidebar-foreground/60 uppercase">
            {translateRole(locale, resolvedUser.role)}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
