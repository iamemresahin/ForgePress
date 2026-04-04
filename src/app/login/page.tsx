import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getAdminSession } from '@/lib/auth'

import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await getAdminSession()
  if (session) {
    redirect('/admin')
  }

  return (
    <main className="page auth-page">
      <div className="shell auth-shell">
        <section className="stack auth-copy">
          <span className="eyebrow">ForgePress Platform</span>
          <h2 style={{ fontSize: 'clamp(3rem, 8vw, 5.6rem)', lineHeight: 0.92 }}>
            Multi-site publishing ops without blind automation.
          </h2>
          <p className="muted" style={{ maxWidth: 580 }}>
            This admin surface is now protected by first-party auth. The next layers are site
            creation, manual article drafting, source control, jobs, and assisted publishing flows.
          </p>
          <Link className="button" href="/">
            Back to overview
          </Link>
        </section>

        <LoginForm />
      </div>
    </main>
  )
}
