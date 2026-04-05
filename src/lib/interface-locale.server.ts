import { cookies } from 'next/headers'

import { INTERFACE_LOCALE_COOKIE, type InterfaceLocale } from '@/lib/interface-locale'

export async function getInterfaceLocale(): Promise<InterfaceLocale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(INTERFACE_LOCALE_COOKIE)?.value

  return locale === 'en' ? 'en' : 'tr'
}
