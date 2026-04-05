export const PLATFORM_HOSTS = new Set(['forgepress.cc', 'www.forgepress.cc', 'localhost', '127.0.0.1'])

export function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '')
}

export function parseHostnameList(rawValue?: string | null) {
  if (!rawValue) return []

  return Array.from(
    new Set(
      rawValue
        .split(',')
        .map((item) => normalizeHostname(item))
        .filter(Boolean),
    ),
  )
}

export function isPlatformHost(hostname: string) {
  const normalized = normalizeHostname(hostname)
  return PLATFORM_HOSTS.has(normalized)
}
