import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { sites } from '@/lib/db/schema'

import { updateSiteAction } from '../actions'
import { SiteForm } from '../site-form'

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireAdminSession()
  const { siteId } = await params

  const [site] = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1)

  if (!site) {
    notFound()
  }

  return (
    <section className="stack" style={{ gap: 24 }}>
      <header className="panel stack">
        <span className="eyebrow">Edit site rules</span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', lineHeight: 0.96 }}>{site.name}</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Tighten editorial behavior, prohibited topics, required structure, and AdSense safety per site.
        </p>
        <Link className="button" href="/admin/sites">
          Back to sites
        </Link>
      </header>

      <SiteForm
        action={updateSiteAction.bind(null, site.id)}
        submitLabel="Save site rules"
        description="These rules will be used as the site-specific control layer for future OpenAI-assisted drafts and editorial review."
        initialValues={{
          name: site.name,
          slug: site.slug,
          defaultLocale: site.defaultLocale,
          supportedLocales: site.supportedLocales.join(', '),
          niche: site.niche ?? '',
          toneGuide: site.toneGuide ?? '',
          editorialGuidelines: site.editorialGuidelines ?? '',
          adsensePolicyNotes: site.adsensePolicyNotes ?? '',
          prohibitedTopics: site.prohibitedTopics.join(', '),
          requiredSections: site.requiredSections.join(', '),
          reviewChecklist: site.reviewChecklist.join(', '),
        }}
      />
    </section>
  )
}
