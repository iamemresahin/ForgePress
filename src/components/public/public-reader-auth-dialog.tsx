'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import Script from 'next/script'
import { LogIn, Mail, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'

import {
  publicReaderSignInAction,
  publicReaderSignUpAction,
} from '@/app/comments/actions'
import { usePublicColorMode } from '@/components/public/public-color-mode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

type AuthState = { error?: string; success?: string } | undefined

export function PublicReaderAuthDialog({
  siteId,
  siteName,
  redirectPath,
  locale,
  triggerLabel,
  triggerClassName,
  currentReader,
  authBrandName,
  googleClientId,
}: {
  siteId: string
  siteName: string
  redirectPath: string
  locale: string
  triggerLabel: string
  triggerClassName?: string
  currentReader?: { id: string; displayName: string; email: string } | null
  authBrandName?: string | null
  googleClientId?: string | null
}) {
  const tr = locale.toLowerCase().startsWith('tr')
  const router = useRouter()
  const { mode: colorMode } = usePublicColorMode()
  const resolvedAuthBrand = authBrandName?.trim() || `${siteName} Reader`
  const resolvedGoogleClientId = googleClientId?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const [googleButtonElement, setGoogleButtonElement] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [googleReady, setGoogleReady] = useState(false)
  const [googleMessage, setGoogleMessage] = useState<AuthState>()
  const [googlePending, setGooglePending] = useState(false)
  const [signInState, signInAction, signingIn] = useActionState(publicReaderSignInAction, undefined)
  const [signUpState, signUpAction, signingUp] = useActionState(publicReaderSignUpAction, undefined)

  const trigger = useMemo(
    () =>
      triggerClassName ? (
        <button className={triggerClassName} type="button">
          {currentReader ? currentReader.displayName : triggerLabel}
        </button>
      ) : (
        <Button type="button" className="rounded-full">
          {currentReader ? currentReader.displayName : triggerLabel}
        </Button>
      ),
    [currentReader, triggerClassName, triggerLabel],
  )

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true)
    }
  }, [])

  useEffect(() => {
    if (open && window.google?.accounts?.id) {
      setGoogleReady(true)
    }
  }, [open])

  useEffect(() => {
    if (signInState?.success || signUpState?.success || googleMessage?.success) {
      setOpen(false)
      router.refresh()
    }
  }, [googleMessage?.success, router, signInState?.success, signUpState?.success])

  useEffect(() => {
    if (!open || !googleReady || !resolvedGoogleClientId || !googleButtonElement || !window.google?.accounts?.id) {
      return
    }

    googleButtonElement.innerHTML = ''

    window.google.accounts.id.initialize({
      client_id: resolvedGoogleClientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setGoogleMessage({
            error: tr ? 'Google oturumu alınamadı.' : 'Google sign-in could not be completed.',
          })
          return
        }

        setGooglePending(true)
        setGoogleMessage(undefined)

        try {
          const response = await fetch('/api/public-auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              credential,
              siteId,
              siteName,
              redirectPath,
            }),
          })

          const payload = (await response.json()) as AuthState
          if (!response.ok) {
            setGoogleMessage({
              error: payload?.error ?? (tr ? 'Google girişi başarısız oldu.' : 'Google sign-in failed.'),
            })
            return
          }

          setGoogleMessage({
            success: payload?.success ?? (tr ? `${siteName} için giriş yapıldı.` : `Signed in to ${siteName}.`),
          })
        } catch {
          setGoogleMessage({
            error: tr ? 'Google girişi sırasında bir sorun oluştu.' : 'A problem occurred during Google sign-in.',
          })
        } finally {
          setGooglePending(false)
        }
      },
    })

    window.google.accounts.id.renderButton(googleButtonElement, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 340,
      logo_alignment: 'left',
    })
  }, [googleButtonElement, googleReady, open, redirectPath, resolvedGoogleClientId, siteId, siteName, tr])

  return (
    <>
      {resolvedGoogleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGoogleReady(true)}
          onReady={() => setGoogleReady(true)}
        />
      ) : null}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] shadow-[0_30px_120px_rgba(0,0,0,0.45)] outline-none',
              colorMode === 'light'
                ? 'border border-slate-200 bg-white text-slate-950'
                : 'border border-white/10 bg-[#111112] text-white',
            )}
          >
            <div
              className={cn(
                'flex items-start justify-between px-6 py-6 md:px-8',
                colorMode === 'light' ? 'border-b border-slate-200' : 'border-b border-white/10',
              )}
            >
              <div>
                <p className={cn('text-xs font-medium uppercase tracking-[0.24em]', colorMode === 'light' ? 'text-slate-400' : 'text-white/40')}>
                  {resolvedAuthBrand}
                </p>
                <DialogPrimitive.Title
                  className={cn(
                    'mt-2 text-[clamp(1.9rem,3vw,2.5rem)] font-semibold tracking-tight',
                    colorMode === 'light' ? 'text-slate-950' : 'text-white',
                  )}
                >
                  {currentReader
                    ? currentReader.displayName
                    : mode === 'signin'
                      ? tr
                        ? 'Siteye giriş yap'
                        : 'Sign in to this site'
                      : tr
                        ? 'Okuyucu hesabı oluştur'
                        : 'Create a reader account'}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  className={cn('mt-3 max-w-2xl text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}
                >
                  {tr
                    ? 'Yorum yapmak ve tartışmaya katılmak için site markası altında giriş yap.'
                    : 'Sign in under this publication to comment and join the discussion.'}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  'inline-flex size-11 items-center justify-center rounded-full border transition',
                  colorMode === 'light'
                    ? 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-950'
                    : 'border-white/10 text-white/56 hover:border-white/20 hover:text-white',
                )}
              >
                <X className="size-5" />
                <span className="sr-only">{tr ? 'Kapat' : 'Close'}</span>
              </DialogPrimitive.Close>
            </div>

            {currentReader ? (
              <div className="px-6 py-6 md:px-8">
                <div className={cn('rounded-[24px] border p-5', colorMode === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]')}>
                  <p className={cn('text-sm', colorMode === 'light' ? 'text-slate-600' : 'text-white/68')}>
                    {tr ? 'Zaten giriş yapıldı:' : 'Already signed in as:'}{' '}
                    <span className={cn('font-semibold', colorMode === 'light' ? 'text-slate-950' : 'text-white')}>{currentReader.displayName}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-0 md:grid-cols-[0.94fr_1.06fr]">
                <div
                  className={cn(
                    'px-6 py-6 md:px-8',
                    colorMode === 'light'
                      ? 'border-b border-slate-200 md:border-b-0 md:border-r md:border-slate-200'
                      : 'border-b border-white/10 md:border-b-0 md:border-r md:border-white/10',
                  )}
                >
                  <div className={cn('rounded-[26px] border p-5', colorMode === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.03]')}>
                    <div className="mb-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition',
                          mode === 'signin'
                            ? colorMode === 'light'
                              ? 'bg-slate-950 text-white'
                              : 'bg-white text-black'
                            : colorMode === 'light'
                              ? 'text-slate-500 hover:text-slate-950'
                              : 'text-white/62 hover:text-white',
                        )}
                      >
                        {tr ? 'Giriş yap' : 'Sign in'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition',
                          mode === 'signup'
                            ? colorMode === 'light'
                              ? 'bg-slate-950 text-white'
                              : 'bg-white text-black'
                            : colorMode === 'light'
                              ? 'text-slate-500 hover:text-slate-950'
                              : 'text-white/62 hover:text-white',
                        )}
                      >
                        {tr ? 'Hesap oluştur' : 'Create account'}
                      </button>
                    </div>

                    {mode === 'signin' ? (
                      <form action={signInAction} className="space-y-4">
                        <input type="hidden" name="siteId" value={siteId} />
                        <input type="hidden" name="siteName" value={siteName} />
                        <input type="hidden" name="redirectPath" value={redirectPath} />
                        <Input
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        <Input
                          name="password"
                          type="password"
                          placeholder={tr ? 'Şifren' : 'Your password'}
                          className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        {signInState?.error ? <p className="text-sm text-rose-300">{signInState.error}</p> : null}
                        {signInState?.success ? <p className="text-sm text-emerald-300">{signInState.success}</p> : null}
                        <Button
                          type="submit"
                          className={cn('w-full rounded-full', colorMode === 'light' && 'bg-slate-950 text-white hover:bg-slate-800')}
                          disabled={signingIn}
                        >
                          <Mail className="size-4" />
                          {signingIn
                            ? tr
                              ? 'Giriş yapılıyor...'
                              : 'Signing in...'
                            : tr
                              ? 'E-posta ile giriş yap'
                              : 'Continue with email'}
                        </Button>
                      </form>
                    ) : (
                      <form action={signUpAction} className="space-y-4">
                        <input type="hidden" name="siteId" value={siteId} />
                        <input type="hidden" name="siteName" value={siteName} />
                        <input type="hidden" name="redirectPath" value={redirectPath} />
                        <Input
                          name="displayName"
                          type="text"
                          placeholder={tr ? 'Görünen adın' : 'Display name'}
                          className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        <Input
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        <Input
                          name="password"
                          type="password"
                          placeholder={tr ? 'Bir şifre oluştur' : 'Create a password'}
                          className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        {signUpState?.error ? <p className="text-sm text-rose-300">{signUpState.error}</p> : null}
                        {signUpState?.success ? <p className="text-sm text-emerald-300">{signUpState.success}</p> : null}
                        <Button
                          type="submit"
                          className={cn('w-full rounded-full', colorMode === 'light' && 'bg-slate-950 text-white hover:bg-slate-800')}
                          disabled={signingUp}
                        >
                          <LogIn className="size-4" />
                          {signingUp
                            ? tr
                              ? 'Hesap açılıyor...'
                              : 'Creating account...'
                            : tr
                              ? 'Okuyucu hesabı aç'
                              : 'Create reader account'}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="px-6 py-6 md:px-8">
                  <div className={cn('rounded-[26px] border p-5', colorMode === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.03]')}>
                    <p className={cn('text-xs font-medium uppercase tracking-[0.24em]', colorMode === 'light' ? 'text-slate-400' : 'text-white/40')}>
                      {tr ? 'Hızlı giriş' : 'Quick access'}
                    </p>
                    <h3 className={cn('mt-3 text-xl font-semibold', colorMode === 'light' ? 'text-slate-950' : 'text-white')}>
                      {tr ? 'Google ile devam et' : 'Continue with Google'}
                    </h3>
                    <p className={cn('mt-3 text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>
                      {tr
                        ? 'Popup kapanmadan bu site markası altında okuyucu oturumu açılır.'
                        : 'A reader session opens under this publication without leaving the page.'}
                    </p>
                    <div className="mt-6 flex min-h-12 items-center">
                      {googleClientId ? (
                        <div
                          ref={(node) => {
                            googleButtonRef.current = node
                            setGoogleButtonElement(node)
                          }}
                          className="w-full"
                        />
                      ) : (
                        <div
                          className={cn(
                            'rounded-[20px] border border-dashed px-4 py-4 text-sm',
                            colorMode === 'light' ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/54',
                          )}
                        >
                          {tr
                            ? 'Bu site için Google girişi henüz yapılandırılmadı.'
                            : 'Google sign-in is not configured for this site yet.'}
                        </div>
                      )}
                    </div>
                    {googlePending ? <p className={cn('mt-4 text-sm', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>{tr ? 'Google oturumu doğrulanıyor...' : 'Verifying Google sign-in...'}</p> : null}
                    {googleMessage?.error ? <p className="mt-4 text-sm text-rose-300">{googleMessage.error}</p> : null}
                    {googleMessage?.success ? <p className="mt-4 text-sm text-emerald-300">{googleMessage.success}</p> : null}
                  </div>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
