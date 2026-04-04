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

  const admin = await authenticateAdmin(parsed.data.email, parsed.data.password)

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
