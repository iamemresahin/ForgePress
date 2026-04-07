'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { eq } from 'drizzle-orm'

import { clearAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { platformSettings } from '@/lib/db/schema'
import { ACTIVE_SITE_COOKIE } from '@/lib/active-site.server'
import { INTERFACE_LOCALE_COOKIE, type InterfaceLocale } from '@/lib/interface-locale'

export async function logoutAction() {
  await clearAdminSession()
  redirect('/login')
}

export async function toggleAutopilotAction() {
  const current = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, 'autopilot'))
    .then((rows) => rows[0]?.value === true)

  await db
    .insert(platformSettings)
    .values({ key: 'autopilot', value: !current })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: !current, updatedAt: new Date() } })

  revalidatePath('/admin', 'layout')
}

export async function setActiveSiteAction(siteId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_SITE_COOKIE, siteId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
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
