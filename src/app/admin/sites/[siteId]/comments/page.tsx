import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { articleComments, articleLocalizations, articles, siteMembers, sites } from '@/lib/db/schema'
import { getInterfaceLocale } from '@/lib/interface-locale.server'

import { deleteCommentAction, setCommentApprovalAction } from '@/app/admin/comments/actions'

export default async function SiteCommentsPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireAdminSession()
  const locale = await getInterfaceLocale()
  const tr = locale === 'tr'
  const { siteId } = await params

  const [site] = await db.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1)
  if (!site) notFound()

  const commentRows = await db
    .select({
      id: articleComments.id,
      body: articleComments.body,
      isApproved: articleComments.isApproved,
      createdAt: articleComments.createdAt,
      articleId: articles.id,
      articleTitle: articleLocalizations.title,
      articleSlug: articleLocalizations.slug,
      siteSlug: sites.slug,
      memberDisplayName: siteMembers.displayName,
      memberEmail: siteMembers.email,
    })
    .from(articleComments)
    .innerJoin(articles, eq(articles.id, articleComments.articleId))
    .innerJoin(articleLocalizations, eq(articleLocalizations.articleId, articles.id))
    .innerJoin(sites, eq(sites.id, articleComments.siteId))
    .innerJoin(siteMembers, eq(siteMembers.id, articleComments.memberId))
    .where(eq(articleComments.siteId, siteId))
    .orderBy(desc(articleComments.createdAt))

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <span className="eyebrow">{site.name}</span>
          <CardTitle className="text-xl font-semibold">
            {tr ? 'Yorumlar' : 'Comments'}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {tr
              ? `${site.name} sitesine ait ${commentRows.length} yorum`
              : `${commentRows.length} comments for ${site.name}`}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {commentRows.length === 0 ? (
            <div className="empty-state">
              <strong>{tr ? 'Bu siteye ait yorum yok.' : 'No comments for this site.'}</strong>
            </div>
          ) : (
            <div className="space-y-4">
              {commentRows.map((comment) => (
                <div key={comment.id} className="list-card space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={comment.isApproved ? 'success' : 'outline'} className="rounded-full px-3 py-1">
                      {comment.isApproved ? (tr ? 'Onaylı' : 'Approved') : (tr ? 'Bekliyor' : 'Pending')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{comment.memberDisplayName} · {comment.memberEmail}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      <Link href={`/admin/articles/${comment.articleId}`} className="hover:underline">
                        {comment.articleTitle}
                      </Link>
                    </p>
                    <p className="text-sm text-foreground/80">{comment.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={setCommentApprovalAction}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="approved" value={comment.isApproved ? 'false' : 'true'} />
                      <button type="submit" className="text-xs text-primary hover:underline">
                        {comment.isApproved ? (tr ? 'Onayı kaldır' : 'Unapprove') : (tr ? 'Onayla' : 'Approve')}
                      </button>
                    </form>
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button type="submit" className="text-xs text-destructive hover:underline">
                        {tr ? 'Sil' : 'Delete'}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
