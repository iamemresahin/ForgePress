import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { MessageSquare, ShieldAlert, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleComments, articleLocalizations, articles, siteMembers, sites } from '@/lib/db/schema'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { deleteCommentAction, setCommentApprovalAction } from './actions'

export default async function AdminCommentsPage() {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'

  const commentRows = await db
    .select({
      id: articleComments.id,
      body: articleComments.body,
      isApproved: articleComments.isApproved,
      createdAt: articleComments.createdAt,
      updatedAt: articleComments.updatedAt,
      articleId: articles.id,
      articleTitle: articleLocalizations.title,
      articleSlug: articleLocalizations.slug,
      siteName: sites.name,
      siteSlug: sites.slug,
      memberDisplayName: siteMembers.displayName,
      memberEmail: siteMembers.email,
    })
    .from(articleComments)
    .innerJoin(articles, eq(articles.id, articleComments.articleId))
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articleComments.siteId))
    .innerJoin(siteMembers, eq(siteMembers.id, articleComments.memberId))
    .orderBy(desc(articleComments.createdAt))

  const uniqueRows = Array.from(
    new Map(commentRows.map((row) => [row.id, row])).values(),
  )

  const approvedCount = uniqueRows.filter((comment) => comment.isApproved).length
  const hiddenCount = uniqueRows.length - approvedCount

  const dateFormatter = new Intl.DateTimeFormat(tr ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-2">
            <Badge className="w-fit rounded-full bg-primary/12 px-3 py-1 text-primary shadow-none">
              {tr ? 'Toplam yorum' : 'Total comments'}
            </Badge>
            <CardTitle className="text-2xl">{uniqueRows.length}</CardTitle>
            <CardDescription>
              {tr ? 'Yayın yüzeylerinde oluşan tüm okuyucu yorumları.' : 'All reader comments arriving across publication surfaces.'}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              {tr ? 'Yayında' : 'Visible'}
            </Badge>
            <CardTitle className="text-2xl">{approvedCount}</CardTitle>
            <CardDescription>
              {tr ? 'Şu anda public tarafta görünen yorumlar.' : 'Comments currently visible on public article pages.'}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              {tr ? 'Gizlenen' : 'Hidden'}
            </Badge>
            <CardTitle className="text-2xl">{hiddenCount}</CardTitle>
            <CardDescription>
              {tr ? 'Moderasyon nedeniyle public akıştan kaldırılan yorumlar.' : 'Comments removed from the public discussion by moderation.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{tr ? 'Moderasyon kuyruğu' : 'Moderation queue'}</span>
          <CardTitle className="text-lg">
            {tr ? 'Okuyucu yorumlarını yönetin' : 'Manage reader comments'}
          </CardTitle>
          <CardDescription>
            {tr
              ? 'Yorumları yayınlayın, gizleyin ya da kalıcı olarak silin. Public yüzey onay durumuna göre anında güncellenir.'
              : 'Approve, hide, or delete comments. The public surface updates from the moderation state.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uniqueRows.length === 0 ? (
            <div className="empty-state">
              <strong>{tr ? 'Henüz yorum yok.' : 'No comments yet.'}</strong>
              <p className="muted">
                {tr
                  ? 'Okuyucu girişiyle ilk yorumlar geldiğinde moderasyon akışı burada görünecek.'
                  : 'The moderation queue will populate here when the first reader comments arrive.'}
              </p>
            </div>
          ) : (
            uniqueRows.map((comment) => {
              const articleHref = `/${comment.siteSlug}/${comment.articleSlug}`
              const hostArticleHref = `/${comment.articleSlug}`

              return (
                <article key={comment.id} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={comment.isApproved ? 'success' : 'outline'} className="rounded-full px-3 py-1">
                          {comment.isApproved ? (tr ? 'Yayında' : 'Visible') : tr ? 'Gizli' : 'Hidden'}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {comment.siteName}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {dateFormatter.format(new Date(comment.createdAt))}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-base font-semibold tracking-tight">{comment.memberDisplayName}</p>
                        <p className="text-sm text-muted-foreground">{comment.memberEmail}</p>
                      </div>

                      <p className="rounded-2xl border border-border/70 bg-background px-4 py-4 text-sm leading-7 text-foreground/85">
                        {comment.body}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <MessageSquare className="size-4" />
                        <span>{tr ? 'Makale:' : 'Article:'}</span>
                        <Link href={`/admin/articles/${comment.articleId}`} className="font-medium text-foreground hover:text-primary">
                          {comment.articleTitle}
                        </Link>
                        <Link href={articleHref} className="font-medium text-primary hover:underline" target="_blank">
                          {tr ? 'Public görünümü aç' : 'Open public view'}
                        </Link>
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px]">
                      <form action={setCommentApprovalAction}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="approved" value={comment.isApproved ? 'false' : 'true'} />
                        <input type="hidden" name="publicPath" value={articleHref} />
                        <input type="hidden" name="hostPath" value={hostArticleHref} />
                        <Button type="submit" variant="outline" className="w-full justify-start rounded-2xl">
                          <ShieldAlert className="size-4" />
                          {comment.isApproved
                            ? tr
                              ? 'Yorumu gizle'
                              : 'Hide comment'
                            : tr
                              ? 'Yorumu yayınla'
                              : 'Publish comment'}
                        </Button>
                      </form>

                      <form action={deleteCommentAction}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="publicPath" value={articleHref} />
                        <input type="hidden" name="hostPath" value={hostArticleHref} />
                        <Button type="submit" variant="outline" className="w-full justify-start rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                          <Trash2 className="size-4" />
                          {tr ? 'Kalıcı sil' : 'Delete permanently'}
                        </Button>
                      </form>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </CardContent>
      </Card>
    </section>
  )
}
