import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgres://postgres:postgres@127.0.0.1:5432/forgepress'),
  QUEUE_URL: z.string().min(1, 'QUEUE_URL is required').default('redis://127.0.0.1:6379'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_TEXT_MODEL: z.string().default('gpt-5.4-mini'),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1-mini'),
  OPENAI_MODERATION_MODEL: z.string().default('omni-moderation-latest'),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  FORGEPRESS_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  FORGEPRESS_ADMIN_PASSWORD: z.string().min(8).default('change-me'),
  FORGEPRESS_SESSION_SECRET: z.string().min(32).optional(),
})

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  QUEUE_URL: process.env.QUEUE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
  OPENAI_MODERATION_MODEL: process.env.OPENAI_MODERATION_MODEL,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  FORGEPRESS_ADMIN_EMAIL: process.env.FORGEPRESS_ADMIN_EMAIL,
  FORGEPRESS_ADMIN_PASSWORD: process.env.FORGEPRESS_ADMIN_PASSWORD,
  FORGEPRESS_SESSION_SECRET: process.env.FORGEPRESS_SESSION_SECRET,
})

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
  throw new Error(`Invalid environment configuration\n${issues}`)
}

export const env = parsed.data
