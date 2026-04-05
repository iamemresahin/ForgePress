export const INTERFACE_LOCALE_COOKIE = 'forgepress_interface_locale'

export type InterfaceLocale = 'tr' | 'en'

export function isTurkish(locale: InterfaceLocale) {
  return locale === 'tr'
}

export function t(locale: InterfaceLocale, tr: string, en: string) {
  return isTurkish(locale) ? tr : en
}

export function translateRole(locale: InterfaceLocale, role: string) {
  const normalized = role.replace('_', ' ')

  if (!isTurkish(locale)) return normalized

  switch (role) {
    case 'platform_admin':
      return 'platform yöneticisi'
    case 'site_editor':
      return 'site editörü'
    case 'reviewer':
      return 'incelemeci'
    default:
      return normalized
  }
}

export function translateArticleStatus(locale: InterfaceLocale, status: string) {
  if (!isTurkish(locale)) return status

  switch (status) {
    case 'draft':
      return 'taslak'
    case 'review':
      return 'inceleme'
    case 'scheduled':
      return 'planlandı'
    case 'published':
      return 'yayında'
    case 'rejected':
      return 'reddedildi'
    default:
      return status
  }
}

export function translateSourceType(locale: InterfaceLocale, type: string) {
  if (!isTurkish(locale)) return type

  switch (type) {
    case 'rss':
      return 'RSS'
    case 'sitemap':
      return 'Site haritası'
    case 'manual_url':
      return 'Manuel URL'
    case 'custom_feed':
      return 'Özel feed'
    default:
      return type
  }
}

export function translateJobKind(locale: InterfaceLocale, kind: string) {
  if (!isTurkish(locale)) return kind

  switch (kind) {
    case 'ingestion':
      return 'içe aktarma'
    case 'rewrite':
      return 'yeniden yazım'
    case 'localization':
      return 'yerelleştirme'
    case 'image':
      return 'görsel'
    case 'publish':
      return 'yayın'
    default:
      return kind
  }
}
