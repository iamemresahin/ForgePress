'use client'

import { useActionState } from 'react'

import {
  publicReaderSignInAction,
  publicReaderSignUpAction,
  submitCommentAction,
} from '@/app/comments/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type ExistingComment = {
  id: string
  displayName: string
  body: string
  createdAtLabel: string
}

export function PublicCommentsPanel({
  siteId,
  siteName,
  articleId,
  redirectPath,
  locale,
  currentReader,
  comments,
}: {
  siteId: string
  siteName: string
  articleId: string
  redirectPath: string
  locale: string
  currentReader: { id: string; displayName: string; email: string } | null
  comments: ExistingComment[]
}) {
  const tr = locale.toLowerCase().startsWith('tr')
  const [signInState, signInAction, signingIn] = useActionState(publicReaderSignInAction, undefined)
  const [signUpState, signUpAction, signingUp] = useActionState(publicReaderSignUpAction, undefined)
  const [commentState, commentAction, posting] = useActionState(submitCommentAction, undefined)

  return (
    <section id="comments" className="rounded-[28px] border border-white/10 bg-[#0f0f10] p-5 md:p-6">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">
          {tr ? 'Yorumlar' : 'Comments'}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{siteName}</h2>
        <p className="mt-2 text-sm leading-7 text-white/62">
          {tr
            ? 'Yorumlar bu siteye özel okuyucu hesabıyla çalışır. ForgePress görünmez; okuyucu doğrudan yayın markasına giriş yapar.'
            : 'Comments run on reader accounts scoped to this publication. Readers sign into the site brand, not ForgePress.'}
        </p>
      </div>

      {currentReader ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/68">
              {tr ? 'Oturum açık:' : 'Signed in as:'} <span className="font-semibold text-white">{currentReader.displayName}</span>
            </p>
          </div>

          <form action={commentAction} className="space-y-4">
            <input type="hidden" name="articleId" value={articleId} />
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="redirectPath" value={redirectPath} />
            <Textarea
              name="body"
              rows={5}
              placeholder={tr ? 'Yoruma ne eklemek istersin?' : 'What would you add to the discussion?'}
              className="border-white/10 bg-white text-slate-950 placeholder:text-slate-400"
            />
            {commentState?.error ? <p className="text-sm text-rose-300">{commentState.error}</p> : null}
            {commentState?.success ? <p className="text-sm text-emerald-300">{commentState.success}</p> : null}
            <Button type="submit" className="rounded-full" disabled={posting}>
              {posting ? (tr ? 'Gönderiliyor...' : 'Posting...') : tr ? 'Yorumu yayınla' : 'Post comment'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <form action={signInAction} className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="siteName" value={siteName} />
            <input type="hidden" name="redirectPath" value={redirectPath} />
            <h3 className="text-lg font-semibold text-white">{tr ? 'Giriş yap' : 'Sign in'}</h3>
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
            <Button type="submit" className="rounded-full" disabled={signingIn}>
              {signingIn ? (tr ? 'Giriş yapılıyor...' : 'Signing in...') : tr ? 'Siteye giriş yap' : 'Sign in to this site'}
            </Button>
          </form>

          <form action={signUpAction} className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <input type="hidden" name="siteId" value={siteId} />
            <input type="hidden" name="siteName" value={siteName} />
            <input type="hidden" name="redirectPath" value={redirectPath} />
            <h3 className="text-lg font-semibold text-white">{tr ? 'Hesap oluştur' : 'Create account'}</h3>
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
            <Button type="submit" className="rounded-full" disabled={signingUp}>
              {signingUp ? (tr ? 'Hesap açılıyor...' : 'Creating account...') : tr ? 'Okuyucu hesabı aç' : 'Create reader account'}
            </Button>
          </form>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-white/56">
            {tr ? 'Henüz yorum yok. İlk yorumu bu toplulukta sen başlat.' : 'No comments yet. Start the discussion for this community.'}
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-white">{comment.displayName}</strong>
                <span className="text-xs uppercase tracking-[0.18em] text-white/42">{comment.createdAtLabel}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/72">{comment.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
