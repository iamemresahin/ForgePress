import { redirect } from 'next/navigation'

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  redirect(`/admin/sites/${siteId}`)
}
