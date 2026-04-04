'use client'

import { useActionState } from 'react'

import { loginAction } from './actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined)

  return (
    <form action={formAction} className="panel stack auth-form">
      <div className="stack">
        <span className="eyebrow">Admin access</span>
        <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 4.4rem)', lineHeight: 0.96 }}>
          Sign in to ForgePress.
        </h1>
        <p className="muted">
          Platform admins can manage sites, editorial operations, and queue-backed publishing flows
          from one control plane.
        </p>
      </div>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="admin@example.com" />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your admin password"
        />
      </label>

      {state?.error ? <p className="form-error">{state.error}</p> : null}

      <button className="button primary" type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
