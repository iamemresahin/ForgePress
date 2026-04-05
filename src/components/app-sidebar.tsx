"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconArticle,
  IconFolderPlus,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconNews,
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
} from "@/components/ui/sidebar"

const primaryItems = [
  { title: "Dashboard", url: "/admin", icon: IconSparkles },
  { title: "Sites", url: "/admin/sites", icon: IconTopologyStar3 },
  { title: "Articles", url: "/admin/articles", icon: IconArticle },
  { title: "Sources", url: "/admin/sources", icon: IconNews },
  { title: "Comments", url: "/admin/comments", icon: IconMessageCircle },
]

const systemItems = [
  { title: "Jobs", url: "/admin/jobs", icon: IconListDetails },
  { title: "Ops", url: "/admin/ops", icon: IconRadar2 },
]

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
    case 'Dashboard':
      return 'Panel'
    case 'Sites':
      return 'Siteler'
    case 'Articles':
      return 'Makaleler'
    case 'Sources':
      return 'Kaynaklar'
    case 'Comments':
      return 'Yorumlar'
    default:
      return title
  }
}

function translateSystemItem(locale: InterfaceLocale, title: string) {
  if (locale !== 'tr') return title

  switch (title) {
    case 'Jobs':
      return 'Görevler'
    case 'Ops':
      return 'Operasyonlar'
    default:
      return title
  }
}

function translateUtilityItem(locale: InterfaceLocale, title: string) {
  if (locale !== 'tr') return title

  switch (title) {
    case 'Overview':
      return 'Genel Bakış'
    case 'Support':
      return 'Destek'
    case 'Settings':
      return 'Ayarlar'
    default:
      return title
  }
}

export function AppSidebar({
  user,
  locale,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locale: InterfaceLocale
  user?: {
    name: string
    email: string
    role: string
  }
}) {
  const pathname = usePathname()
  const resolvedUser = user ?? {
    name: "ForgePress Admin",
    email: "admin@example.com",
    role: "platform_admin",
  }

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

            <SidebarMenu>
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
