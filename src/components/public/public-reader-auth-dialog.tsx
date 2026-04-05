'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Script from 'next/script'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { usePublicColorMode } from '@/components/public/public-color-mode'
import { Button } from '@/components/ui/button'
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
  const [googleReady, setGoogleReady] = useState(false)
  const [googleMessage, setGoogleMessage] = useState<AuthState>()
  const [googlePending, setGooglePending] = useState(false)

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
    if (googleMessage?.success) {
      setOpen(false)
      router.refresh()
    }
  }, [googleMessage?.success, router])

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
              'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] shadow-[0_30px_120px_rgba(0,0,0,0.45)] outline-none',
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
                    : tr
                      ? 'Google ile devam et'
                      : 'Continue with Google'}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  className={cn('mt-3 max-w-2xl text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}
                >
                  {tr
                    ? 'Yorum yapmak ve tartışmaya katılmak için bu yayın markası altında yalnızca Google hesabınla giriş yap.'
                    : 'Use only your Google account under this publication to comment and join the discussion.'}
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
              <div className="px-6 py-6 md:px-8">
                <div className={cn('rounded-[28px] border p-6 md:p-8', colorMode === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.03]')}>
                  <div className="text-center">
                    <p className={cn('text-xs font-medium uppercase tracking-[0.24em]', colorMode === 'light' ? 'text-slate-400' : 'text-white/40')}>
                      {tr ? 'Tek giriş yöntemi' : 'Only sign-in method'}
                    </p>
                    <h3 className={cn('mt-3 text-2xl font-semibold tracking-tight', colorMode === 'light' ? 'text-slate-950' : 'text-white')}>
                      {tr ? 'Google ile giriş yap' : 'Sign in with Google'}
                    </h3>
                    <p className={cn('mt-3 text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>
                      {tr
                        ? 'Bu yayında okuyucu erişimi yalnızca Google hesabı ile açılır.'
                        : 'Reader access on this site is available only through Google.'}
                    </p>
                  </div>

                  <div className={cn('mt-6 rounded-[24px] border p-5', colorMode === 'light' ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/20')}>
                    <p className={cn('text-xs font-medium uppercase tracking-[0.24em]', colorMode === 'light' ? 'text-slate-400' : 'text-white/40')}>
                      Google
                    </p>
                    <h3 className={cn('mt-3 text-xl font-semibold', colorMode === 'light' ? 'text-slate-950' : 'text-white')}>
                      {tr ? 'Yayın markası altında güvenli giriş' : 'Secure sign-in under the publication brand'}
                    </h3>
                    <p className={cn('mt-3 text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>
                      {tr
                        ? 'Google butonu bu siteye ait istemciyle açılır. Okuyucu oturumu yalnızca bu yayın için geçerlidir.'
                        : 'This Google button belongs to this site and keeps the reader session scoped here.'}
                    </p>

                    <div className="mt-5">
                      {resolvedGoogleClientId ? (
                        <div
                          ref={(node) => {
                            googleButtonRef.current = node
                            setGoogleButtonElement(node)
                          }}
                          className="mx-auto min-h-[54px] max-w-[340px]"
                        />
                      ) : (
                        <p className={cn('text-sm leading-7', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>
                          {tr
                            ? 'Bu site için Google girişi henüz yapılandırılmadı.'
                            : 'Google sign-in is not configured for this site yet.'}
                        </p>
                      )}
                    </div>

                    {googleMessage?.error ? (
                      <p className={cn('mt-4 text-sm', colorMode === 'light' ? 'text-rose-500' : 'text-rose-300')}>{googleMessage.error}</p>
                    ) : null}
                    {googleMessage?.success ? (
                      <p className={cn('mt-4 text-sm', colorMode === 'light' ? 'text-emerald-600' : 'text-emerald-300')}>{googleMessage.success}</p>
                    ) : null}
                    {googlePending ? (
                      <p className={cn('mt-4 text-sm', colorMode === 'light' ? 'text-slate-500' : 'text-white/62')}>
                        {tr ? 'Google oturumu açılıyor...' : 'Signing in with Google...'}
                      </p>
                    ) : null}
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
