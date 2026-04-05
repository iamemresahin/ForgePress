'use client'

import { usePathname } from 'next/navigation'
import type { InterfaceLocale } from '@/lib/interface-locale'

type AdminRouteKey =
  | '/admin'
  | '/admin/sites'
  | '/admin/articles'
  | '/admin/sources'
  | '/admin/comments'
  | '/admin/jobs'
  | '/admin/ops'

const titles = {
  en: {
    '/admin': {
      title: 'Dashboard',
      description: 'Publishing health, content flow, and runtime readiness in one control surface.',
    },
    '/admin/sites': {
      title: 'Sites',
      description: 'Manage publication surfaces, locales, and site-specific editorial rules.',
    },
    '/admin/articles': {
      title: 'Articles',
      description: 'Create, review, and refine drafts before they move into publishing.',
    },
    '/admin/sources': {
      title: 'Sources',
      description: 'Control every feed, sitemap, and manual ingestion source from one place.',
    },
    '/admin/comments': {
      title: 'Comments',
      description: 'Review publication comments, hide risky replies, and keep discussion quality high.',
    },
    '/admin/jobs': {
      title: 'Jobs',
      description: 'Trigger queue-backed workflows and inspect operational traces.',
    },
    '/admin/ops': {
      title: 'Operations',
      description: 'Check deploy readiness, runtime reachability, and integration status.',
    },
  },
  tr: {
    '/admin': {
      title: 'Panel',
      description: 'Yayın sağlığı, içerik akışı ve çalışma hazırlığı tek yüzeyde görünür.',
    },
    '/admin/sites': {
      title: 'Siteler',
      description: 'Yayın yüzeylerini, dilleri ve siteye özel editoryal kuralları yönetin.',
    },
    '/admin/articles': {
      title: 'Makaleler',
      description: 'Taslakları yayın öncesinde oluşturun, gözden geçirin ve iyileştirin.',
    },
    '/admin/sources': {
      title: 'Kaynaklar',
      description: 'Tüm feed, sitemap ve manuel içe aktarma kaynaklarını tek yerden yönetin.',
    },
    '/admin/comments': {
      title: 'Yorumlar',
      description: 'Yayın yorumlarını inceleyin, riskli yanıtları gizleyin ve tartışma kalitesini koruyun.',
    },
    '/admin/jobs': {
      title: 'Görevler',
      description: 'Kuyruk tabanlı akışları tetikleyin ve operasyon kayıtlarını izleyin.',
    },
    '/admin/ops': {
      title: 'Operasyonlar',
      description: 'Dağıtım hazırlığını, erişilebilirliği ve entegrasyon durumunu kontrol edin.',
    },
  },
} satisfies Record<InterfaceLocale, Record<AdminRouteKey, { title: string; description: string }>>

function matchRoute(pathname: string, locale: InterfaceLocale) {
  const dictionary = titles[locale]

  if (pathname.startsWith('/admin/sites/')) return dictionary['/admin/sites']
  if (pathname.startsWith('/admin/articles/')) return dictionary['/admin/articles']
  if (pathname.startsWith('/admin/sources/')) return dictionary['/admin/sources']
  if (pathname.startsWith('/admin/comments/')) return dictionary['/admin/comments']
  if (pathname in dictionary) return dictionary[pathname as AdminRouteKey]
  return dictionary['/admin']
}

export function AdminRouteHeader({
  locale,
}: {
  locale: InterfaceLocale
}) {
  const pathname = usePathname()
  const current = matchRoute(pathname, locale)

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
        {locale === 'tr' ? 'ForgePress kontrol paneli' : 'ForgePress control plane'}
      </p>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {current.title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{current.description}</p>
    </div>
  )
}
