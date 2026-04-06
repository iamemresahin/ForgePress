"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconArticle,
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

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> }
type SiteItem = { id: string; name: string; slug: string }

const allPrimaryItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: IconSparkles },
  { title: "Articles", url: "/admin/articles", icon: IconArticle },
  { title: "Sources", url: "/admin/sources", icon: IconNews },
  { title: "Comments", url: "/admin/comments", icon: IconMessageCircle },
]

const allSystemItems: NavItem[] = [
  { title: "Jobs", url: "/admin/jobs", icon: IconListDetails },
  { title: "Ops", url: "/admin/ops", icon: IconRadar2 },
]

function getPrimaryItems(role: string): NavItem[] {
  if (role === 'platform_admin') return allPrimaryItems
  if (role === 'site_editor') return allPrimaryItems
  return allPrimaryItems.filter((i) => i.title === 'Dashboard' || i.title === 'Articles')
}

function getSystemItems(role: string): NavItem[] {
  if (role === 'platform_admin') return allSystemItems
  if (role === 'site_editor') return allSystemItems.filter((i) => i.title === 'Jobs')
  return []
}

const utilityItems = [
  { title: "Overview", url: "/", icon: IconFolderPlus },
  { title: "Support", url: "/admin/ops", icon: IconHelp },
  { title: "Settings", url: "/admin/sites", icon: IconSettings },
]

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`))
}

function translatePrimaryItem(locale: InterfaceLocale, title: string) {
  if (locale !== 'tr') return title

  switch (title) {
    case 'Dashboard': return 'Panel'
    case 'Articles': return 'Makaleler'
    case 'Sources': return 'Kaynaklar'
    case 'Comments': return 'Yorumlar'
    default: return title
  }
}

function translateSystemItem(locale: InterfaceLocale, title: string) {
  if (locale !== 'tr') return title

  switch (title) {
    case 'Jobs': return 'Görevler'
    case 'Ops': return 'Operasyonlar'
    default: return title
  }
}

function translateUtilityItem(locale: InterfaceLocale, title: string) {
  if (locale !== 'tr') return title

  switch (title) {
    case 'Overview': return 'Genel Bakış'
    case 'Support': return 'Destek'
    case 'Settings': return 'Ayarlar'
    default: return title
  }
}

export function AppSidebar({
  user,
  locale,
  sites = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locale: InterfaceLocale
  sites?: SiteItem[]
  user?: {
    name: string
    email: string
    role: string
  }
}) {
  const pathname = usePathname()
  const [sitesOpen, setSitesOpen] = useState(
    pathname.startsWith('/admin/sites')
  )

  const resolvedUser = user ?? {
    name: "ForgePress Admin",
    email: "admin@example.com",
    role: "platform_admin",
  }
  const primaryItems = getPrimaryItems(resolvedUser.role)
  const systemItems = getSystemItems(resolvedUser.role)
  const showSites = resolvedUser.role === 'platform_admin'

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
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            {resolvedUser.role !== 'reviewer' && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
                  >
                    <Link href="/admin/articles">
                      <IconFolderPlus />
                      <span>{locale === 'tr' ? 'Hızlı Taslak' : 'Quick Draft'}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}

            <SidebarMenu>
              {/* Sites collapsible — platform_admin only */}
              {showSites && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setSitesOpen((o) => !o)}
                    isActive={pathname.startsWith('/admin/sites')}
                    tooltip={locale === 'tr' ? 'Siteler' : 'Sites'}
                    className="cursor-pointer"
                  >
                    <IconTopologyStar3 />
                    <span>{locale === 'tr' ? 'Siteler' : 'Sites'}</span>
                    <IconChevronDown
                      className={`ml-auto size-4 shrink-0 transition-transform duration-200 ${sitesOpen ? 'rotate-180' : ''}`}
                    />
                  </SidebarMenuButton>

                  {sitesOpen && (
                    <SidebarMenuSub>
                      {sites.map((site) => (
                        <SidebarMenuSubItem key={site.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/admin/sites/${site.id}` || pathname.startsWith(`/admin/sites/${site.id}/`)}
                          >
                            <Link href={`/admin/sites/${site.id}`}>
                              <span className="truncate">{site.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin/sites" className="text-muted-foreground hover:text-foreground">
                            <IconPlus className="size-3.5" />
                            <span>{locale === 'tr' ? 'Site ekle' : 'Add site'}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}

              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.url)}
                    tooltip={translatePrimaryItem(locale, item.title)}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{translatePrimaryItem(locale, item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {systemItems.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{locale === 'tr' ? 'Sistem' : 'System'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(pathname, item.url)}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{translateSystemItem(locale, item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{locale === 'tr' ? 'Araçlar' : 'Utility'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{translateUtilityItem(locale, item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
