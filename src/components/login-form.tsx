'use client'

import { useActionState } from 'react'

import type { InterfaceLocale } from '@/lib/interface-locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { loginAction } from '@/app/login/actions'

export function LoginForm({
  className,
  locale,
  ...props
}: React.ComponentProps<'form'> & {
  locale: InterfaceLocale
}) {
  const [state, formAction, pending] = useActionState(loginAction, undefined)
  const tr = locale === 'tr'

  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup className="rounded-[2rem] border border-sky-100 bg-card/95 p-8 shadow-[0_24px_70px_-40px_rgba(14,116,144,0.28)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">
            {tr ? 'ForgePress girişi' : 'Sign in to ForgePress'}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {tr
              ? 'Admin paneline erişmek için e-posta ve şifrenizi girin.'
              : 'Enter your email and password to access the admin control plane.'}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">{tr ? 'E-posta' : 'Email'}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            className="h-11 rounded-xl border-sky-200/80 bg-white/90 text-slate-950 placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-sky-200/80"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{tr ? 'Şifre' : 'Password'}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={tr ? 'Admin şifreniz' : 'Your admin password'}
            className="h-11 rounded-xl border-sky-200/80 bg-white/90 text-slate-950 placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-sky-200/80"
            required
          />
        </Field>
        <FieldError>{state?.error}</FieldError>
        <Field>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-200"
            disabled={pending}
          >
            {pending ? (tr ? 'Giriş yapılıyor...' : 'Signing in...') : tr ? 'Giriş yap' : 'Sign in'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
