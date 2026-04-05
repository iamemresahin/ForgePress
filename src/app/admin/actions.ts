'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

import { clearAdminSession } from '@/lib/auth'
import { INTERFACE_LOCALE_COOKIE, type InterfaceLocale } from '@/lib/interface-locale'

export async function logoutAction() {
  await clearAdminSession()
  redirect('/login')
}

export async function setAdminLocaleAction(formData: FormData) {
  const locale = (formData.get('locale') === 'en' ? 'en' : 'tr') satisfies InterfaceLocale
  const cookieStore = await cookies()
  const referer = (await headers()).get('referer') ?? '/admin'

  cookieStore.set(INTERFACE_LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  redirect(referer)
}
