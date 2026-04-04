import { NextResponse } from 'next/server'

import { getOperationalChecks } from '@/lib/ops'

export async function GET() {
  const checks = await getOperationalChecks()

  return NextResponse.json(checks, {
    status: checks.ok ? 200 : 503,
  })
}
