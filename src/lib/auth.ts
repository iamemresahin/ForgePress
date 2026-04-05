import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { adminUsers, siteMembers } from '@/lib/db/schema'
import { env } from '@/lib/env'

const SESSION_COOKIE = 'forgepress_session'
const READER_SESSION_COOKIE = 'forgepress_reader_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const DEV_SESSION_SECRET = 'forgepress-dev-session-secret-change-me-now'

type AdminRecord = typeof adminUsers.$inferSelect
type SiteMemberRecord = typeof siteMembers.$inferSelect

export type AdminSession = Pick<AdminRecord, 'id' | 'email' | 'displayName' | 'role'>
export type PublicReaderSession = Pick<SiteMemberRecord, 'id' | 'email' | 'displayName' | 'siteId'>

export function getPublicReaderSessionCookieName(siteId: string) {
  const normalizedSiteKey = siteId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toLowerCase()
  return normalizedSiteKey ? `${READER_SESSION_COOKIE}_${normalizedSiteKey}` : READER_SESSION_COOKIE
}

function getSessionSecret() {
  if (env.FORGEPRESS_SESSION_SECRET) {
    return env.FORGEPRESS_SESSION_SECRET
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('FORGEPRESS_SESSION_SECRET is required in production.')
  }

  return DEV_SESSION_SECRET
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derivedKey = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')
  if (!salt || !originalHash) return false

  const passwordHash = scryptSync(password, salt, 64)
  const originalBuffer = Buffer.from(originalHash, 'hex')

  if (passwordHash.length !== originalBuffer.length) return false

  return timingSafeEqual(passwordHash, originalBuffer)
}

function signSessionPayload(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

function serializeSession(admin: AdminSession) {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = `${admin.id}.${admin.role}.${expiresAt}`
  const signature = signSessionPayload(payload)
  return `${payload}.${signature}`
}

async function parseSessionCookie(rawValue?: string) {
  if (!rawValue) return null

  const lastDotIndex = rawValue.lastIndexOf('.')
  if (lastDotIndex === -1) return null

  const payload = rawValue.slice(0, lastDotIndex)
  const signature = rawValue.slice(lastDotIndex + 1)
  const expectedSignature = signSessionPayload(payload)

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  const [adminId, role, expiresAt] = payload.split('.')

  if (!adminId || !role || !expiresAt) return null
  if (Date.now() > Number(expiresAt)) return null

  return { adminId, role }
}

async function findAdminByEmail(email: string) {
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)
  return admin ?? null
}

async function findAdminById(id: string) {
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1)
  return admin ?? null
}

async function findSiteMemberByEmail(siteId: string, email: string) {
  const normalized = email.trim().toLowerCase()
  const [member] = await db
    .select()
    .from(siteMembers)
    .where(and(eq(siteMembers.siteId, siteId), eq(siteMembers.email, normalized)))
    .limit(1)

  return member ?? null
}

async function findSiteMemberById(id: string) {
  const [member] = await db.select().from(siteMembers).where(eq(siteMembers.id, id)).limit(1)
  return member ?? null
}

export async function ensureBootstrapAdmin() {
  const existingAdmin = await findAdminByEmail(env.FORGEPRESS_ADMIN_EMAIL)
  if (existingAdmin) return existingAdmin

  const [createdAdmin] = await db
    .insert(adminUsers)
    .values({
      email: env.FORGEPRESS_ADMIN_EMAIL,
      passwordHash: hashPassword(env.FORGEPRESS_ADMIN_PASSWORD),
      displayName: 'Platform Admin',
      role: 'platform_admin',
    })
    .returning()

  return createdAdmin
}

export async function authenticateAdmin(email: string, password: string) {
  await ensureBootstrapAdmin()

  const admin = await findAdminByEmail(email)
  if (!admin) return null
  if (!verifyPassword(password, admin.passwordHash)) return null

  await db
    .update(adminUsers)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, admin.id))

  return admin
}

export async function createAdminSession(admin: AdminSession) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, serializeSession(admin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(Date.now() + SESSION_TTL_MS),
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

function serializeReaderSession(reader: PublicReaderSession) {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = `${reader.id}.${reader.siteId}.${expiresAt}`
  const signature = signSessionPayload(payload)
  return `${payload}.${signature}`
}

export function createPublicReaderSessionCookieValue(reader: PublicReaderSession) {
  return serializeReaderSession(reader)
}

export function getPublicReaderSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(Date.now() + SESSION_TTL_MS),
  }
}

async function parseReaderSessionCookie(rawValue?: string) {
  if (!rawValue) return null

  const lastDotIndex = rawValue.lastIndexOf('.')
  if (lastDotIndex === -1) return null

  const payload = rawValue.slice(0, lastDotIndex)
  const signature = rawValue.slice(lastDotIndex + 1)
  const expectedSignature = signSessionPayload(payload)

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  const [memberId, siteId, expiresAt] = payload.split('.')

  if (!memberId || !siteId || !expiresAt) return null
  if (Date.now() > Number(expiresAt)) return null

  return { memberId, siteId }
}

export async function createPublicReaderSession(reader: PublicReaderSession) {
  const cookieStore = await cookies()
  cookieStore.set(
    getPublicReaderSessionCookieName(reader.siteId),
    createPublicReaderSessionCookieValue(reader),
    getPublicReaderSessionCookieOptions(),
  )
}

export async function clearPublicReaderSession(siteId: string) {
  const cookieStore = await cookies()
  cookieStore.delete(getPublicReaderSessionCookieName(siteId))
}

export async function findOrCreateGoogleSiteMember(siteId: string, email: string, displayName: string) {
  const existingMember = await findSiteMemberByEmail(siteId, email)
  if (existingMember) {
    return existingMember
  }

  const [member] = await db
    .insert(siteMembers)
    .values({
      siteId,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || email.trim().split('@')[0] || 'Reader',
      passwordHash: hashPassword(randomBytes(24).toString('hex')),
    })
    .returning()

  return member
}

export async function getPublicReaderSession(siteId: string) {
  const cookieStore = await cookies()
  const rawCookie =
    cookieStore.get(getPublicReaderSessionCookieName(siteId))?.value ??
    cookieStore.get(READER_SESSION_COOKIE)?.value
  const parsed = await parseReaderSessionCookie(rawCookie)

  if (!parsed || parsed.siteId !== siteId) return null

  const member = await findSiteMemberById(parsed.memberId)
  if (!member || member.siteId !== siteId) return null

  return {
    id: member.id,
    email: member.email,
    displayName: member.displayName,
    siteId: member.siteId,
  } satisfies PublicReaderSession
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const rawCookie = cookieStore.get(SESSION_COOKIE)?.value
  const parsed = await parseSessionCookie(rawCookie)

  if (!parsed) return null

  const admin = await findAdminById(parsed.adminId)
  if (!admin || admin.role !== parsed.role) return null

  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
  } satisfies AdminSession
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/login')
  }

  return session
}

export function requirePlatformAdminRole(session: AdminSession) {
  if (session.role !== 'platform_admin') {
    throw new Error('Only platform admins can perform this action.')
  }
}
