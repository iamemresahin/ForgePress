import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isPlatformHost, normalizeHostname } from '@/lib/site-domain'

const RESERVED_PREFIXES = ['/admin', '/login', '/api', '/_next', '/_domain']
const RESERVED_FILES = new Set(['/favicon.ico', '/favicon.svg', '/robots.txt', '/sitemap.xml'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    RESERVED_FILES.has(pathname) ||
    RESERVED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.next()
  }

  const hostname = normalizeHostname(request.headers.get('host') ?? '')
  if (!hostname || isPlatformHost(hostname)) {
    return NextResponse.next()
  }

  const rewrittenUrl = request.nextUrl.clone()
  rewrittenUrl.pathname =
    pathname === '/'
      ? `/_domain/${hostname}`
      : `/_domain/${hostname}${pathname}`

  return NextResponse.rewrite(rewrittenUrl)
}

export const config = {
  matcher: '/:path*',
}
