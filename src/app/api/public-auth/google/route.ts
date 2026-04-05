import { NextResponse } from 'next/server'

import {
  createPublicReaderSessionCookieValue,
  findOrCreateGoogleSiteMember,
  getPublicReaderSessionCookieOptions,
} from '@/lib/auth'
import { env } from '@/lib/env'

type GoogleTokenInfo = {
  aud?: string
  email?: string
  email_verified?: string
  name?: string
  sub?: string
}

export async function POST(request: Request) {
  if (!env.GOOGLE_CLIENT_ID && !env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Google sign-in is not configured yet.' }, { status: 503 })
  }

  const expectedAudience = env.GOOGLE_CLIENT_ID ?? env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  try {
    const body = await request.json()
    const credential = String(body.credential ?? '').trim()
    const siteId = String(body.siteId ?? '').trim()
    const siteName = String(body.siteName ?? '').trim()

    if (!credential || !siteId || !siteName) {
      return NextResponse.json({ error: 'Missing Google credential or site context.' }, { status: 400 })
    }

    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    )

    if (!tokenInfoResponse.ok) {
      return NextResponse.json({ error: 'Google could not verify this sign-in.' }, { status: 401 })
    }

    const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo

    if (
      !tokenInfo.email ||
      tokenInfo.email_verified !== 'true' ||
      !tokenInfo.aud ||
      tokenInfo.aud !== expectedAudience
    ) {
      return NextResponse.json({ error: 'Google sign-in could not be validated for this site.' }, { status: 401 })
    }

    const member = await findOrCreateGoogleSiteMember(
      siteId,
      tokenInfo.email,
      tokenInfo.name?.trim() || tokenInfo.email.split('@')[0] || 'Reader',
    )

    const response = NextResponse.json({
      success: `Signed in to ${siteName}.`,
      member: {
        id: member.id,
        email: member.email,
        displayName: member.displayName,
      },
    })

    response.cookies.set(
      'forgepress_reader_session',
      createPublicReaderSessionCookieValue({
        id: member.id,
        email: member.email,
        displayName: member.displayName,
        siteId: member.siteId,
      }),
      getPublicReaderSessionCookieOptions(),
    )

    return response
  } catch {
    return NextResponse.json({ error: 'Google sign-in failed. Try again.' }, { status: 500 })
  }
}
