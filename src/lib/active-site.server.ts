import { cookies } from 'next/headers'

export const ACTIVE_SITE_COOKIE = 'forgepress-active-site'

export async function getActiveSiteId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_SITE_COOKIE)?.value ?? null
}
