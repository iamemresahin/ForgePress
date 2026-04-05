import { redirect } from 'next/navigation'

import { BrandMark } from '@/components/brand-mark'
import { LoginForm } from '@/components/login-form'
import { getAdminSession } from '@/lib/auth'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

export default async function LoginPage() {
  const session = await getAdminSession()
  const locale = await getInterfaceLocale()

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <div className="flex items-center gap-3 text-foreground">
            <BrandMark className="size-6 text-sky-600" />
            <span className="text-base font-semibold tracking-tight">ForgePress</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm locale={locale} />
          </div>
        </div>
        <div />
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <iframe
          src="https://my.spline.design/animatedbackgroundgradientforweb-jvJDeBWjMvShkjPKxPRUswLq"
          className="absolute inset-0 h-full w-full border-0"
          title="ForgePress login background"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  )
}
