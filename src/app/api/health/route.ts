import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'forgepress',
    mode: env.NODE_ENV,
    stack: {
      app: 'nextjs',
      db: 'postgresql',
      queue: 'valkey',
      orm: 'drizzle',
    },
    timestamp: new Date().toISOString(),
  })
}
