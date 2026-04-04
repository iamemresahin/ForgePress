import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

export async function GET() {
  return NextResponse.json({
    message: 'ForgePress bootstrap contract',
    requirements: {
      databaseUrlConfigured: Boolean(env.DATABASE_URL),
      queueUrlConfigured: Boolean(env.QUEUE_URL),
      openAiConfigured: Boolean(env.OPENAI_API_KEY),
      openAiTextModel: env.OPENAI_TEXT_MODEL,
      moderationModel: env.OPENAI_MODERATION_MODEL,
      sessionSecretConfigured: Boolean(env.FORGEPRESS_SESSION_SECRET),
      cloudflareConfigured: Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID),
    },
  })
}
