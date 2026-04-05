'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { authenticateAdmin, createAdminSession } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Enter a valid email and password.' }
  }

  let admin = null

  try {
    admin = await authenticateAdmin(parsed.data.email, parsed.data.password)
  } catch (error) {
    console.error('Login failed during admin authentication.', error)
    return {
      error:
        'Login is temporarily unavailable. Check the database connection and local environment, then try again.',
    }
  }

  if (!admin) {
    return { error: 'Email or password is incorrect.' }
  }

  await createAdminSession({
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
  })

  redirect('/admin')
}
