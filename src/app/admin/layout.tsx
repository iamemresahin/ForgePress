import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth'

import { logoutAction } from './actions'

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireAdminSession()

  return (
    <main className="page admin-page">
      <div className="shell admin-shell">
        <header className="admin-topbar">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">ForgePress control plane</span>
            <strong>{session.displayName}</strong>
            <span className="muted" style={{ fontSize: '0.92rem' }}>
              {session.role.replace('_', ' ')} · {session.email}
            </span>
          </div>

          <nav className="admin-nav">
            <Link className="pill" href="/admin">
              Dashboard
            </Link>
            <Link className="pill" href="/admin/sites">
              Sites
            </Link>
            <Link className="pill" href="/admin/articles">
              Articles
            </Link>
            <Link className="pill" href="/admin/sources">
              Sources
            </Link>
            <Link className="pill" href="/admin/jobs">
              Jobs
            </Link>
            <Link className="pill" href="/admin/ops">
              Ops
            </Link>
          </nav>

          <form action={logoutAction}>
            <button className="button" type="submit">
              Sign out
            </button>
          </form>
        </header>

        {children}
      </div>
    </main>
  )
}
