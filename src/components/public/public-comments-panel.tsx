'use client'

import { useActionState } from 'react'
import { LogOut } from 'lucide-react'

import { signOutPublicReaderAction, submitCommentAction } from '@/app/comments/actions'
import { usePublicColorMode } from '@/components/public/public-color-mode'
import { PublicReaderAuthDialog } from '@/components/public/public-reader-auth-dialog'
import { Button } from '@/components/ui/button'
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
  authBrandName,
  googleClientId,
  comments,
}: {
  siteId: string
  siteName: string
  articleId: string
  redirectPath: string
  locale: string
  currentReader: { id: string; displayName: string; email: string } | null
  authBrandName?: string | null
  googleClientId?: string | null
  comments: ExistingComment[]
}) {
  const tr = locale.toLowerCase().startsWith('tr')
  const { mode } = usePublicColorMode()
  const [commentState, commentAction, posting] = useActionState(submitCommentAction, undefined)
  const [signOutState, signOutAction, signingOut] = useActionState(signOutPublicReaderAction, undefined)

  return (
    <section id="comments" className="public-panel rounded-[28px] border p-5 md:p-6">
      <div className="public-border border-b pb-4">
        <p className="public-text-faint text-xs font-medium uppercase tracking-[0.24em]">
          {tr ? 'Yorumlar' : 'Comments'}
        </p>
        <h2 className="public-text mt-2 text-2xl font-semibold">{siteName}</h2>
        <p className="public-text-dim mt-2 text-sm leading-7">
          {tr
            ? 'Yorumlar bu siteye özel okuyucu hesabıyla çalışır. ForgePress görünmez; okuyucu doğrudan yayın markasına giriş yapar.'
            : 'Comments run on reader accounts scoped to this publication. Readers sign into the site brand, not ForgePress.'}
        </p>
      </div>

      {currentReader ? (
        <div className="mt-5 space-y-5">
          <div className={mode === 'light' ? 'rounded-[24px] border border-slate-200 bg-slate-50 p-4' : 'rounded-[24px] border border-white/10 bg-white/[0.03] p-4'}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={mode === 'light' ? 'text-xs font-medium uppercase tracking-[0.2em] text-slate-400' : 'text-xs font-medium uppercase tracking-[0.2em] text-white/40'}>
                  {tr ? 'Okuyucu oturumu' : 'Reader session'}
                </p>
                <p className={mode === 'light' ? 'mt-2 text-base font-semibold text-slate-950' : 'mt-2 text-base font-semibold text-white'}>
                  {currentReader.displayName}
                </p>
                <p className={mode === 'light' ? 'mt-1 text-sm text-slate-500' : 'mt-1 text-sm text-white/62'}>
                  {currentReader.email}
                </p>
              </div>

              <form action={signOutAction}>
                <input type="hidden" name="siteId" value={siteId} />
                <input type="hidden" name="redirectPath" value={redirectPath} />
                <Button
                  type="submit"
                  variant="outline"
                  className={mode === 'light' ? 'rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100' : 'rounded-full border-white/10 bg-transparent text-white hover:bg-white/8'}
                  disabled={signingOut}
                >
                  <LogOut className="size-4" />
                  {signingOut ? (tr ? 'Çıkılıyor...' : 'Signing out...') : tr ? 'Çıkış yap' : 'Sign out'}
                </Button>
              </form>
            </div>
            {signOutState?.error ? <p className="mt-3 text-sm text-rose-300">{signOutState.error}</p> : null}
            {signOutState?.success ? <p className="mt-3 text-sm text-emerald-300">{signOutState.success}</p> : null}
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
            <Button type="submit" className={mode === 'light' ? 'rounded-full bg-slate-950 text-white hover:bg-slate-800' : 'rounded-full'} disabled={posting}>
              {posting ? (tr ? 'Gönderiliyor...' : 'Posting...') : tr ? 'Yorumu yayınla' : 'Post comment'}
            </Button>
          </form>
        </div>
      ) : (
        <div className={mode === 'light' ? 'mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5' : 'mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5'}>
          <p className={mode === 'light' ? 'max-w-2xl text-sm leading-7 text-slate-600' : 'max-w-2xl text-sm leading-7 text-white/64'}>
            {tr
              ? 'Yorum bırakmak için yalnızca Google ile giriş yapman yeterli.'
              : 'Use Google sign-in to join the discussion.'}
          </p>
          <div className="mt-5">
            <PublicReaderAuthDialog
              siteId={siteId}
              siteName={siteName}
              redirectPath={redirectPath}
              locale={locale}
              authBrandName={authBrandName}
              googleClientId={googleClientId}
              triggerLabel={tr ? 'Yorum yapmak için giriş yap' : 'Sign in to comment'}
              triggerClassName={
                mode === 'light'
                  ? 'inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800'
                  : 'inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/92'
              }
            />
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <p className="public-text-dim text-sm">
            {tr ? 'Henüz yorum yok. İlk yorumu bu toplulukta sen başlat.' : 'No comments yet. Start the discussion for this community.'}
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className={mode === 'light' ? 'rounded-[24px] border border-slate-200 bg-white p-5' : 'rounded-[24px] border border-white/10 bg-white/[0.03] p-5'}>
              <div className="flex items-center justify-between gap-3">
                <strong className={mode === 'light' ? 'text-slate-950' : 'text-white'}>{comment.displayName}</strong>
                <span className={mode === 'light' ? 'text-xs uppercase tracking-[0.18em] text-slate-400' : 'text-xs uppercase tracking-[0.18em] text-white/42'}>{comment.createdAtLabel}</span>
              </div>
              <p className={mode === 'light' ? 'mt-3 text-sm leading-7 text-slate-700' : 'mt-3 text-sm leading-7 text-white/72'}>{comment.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
