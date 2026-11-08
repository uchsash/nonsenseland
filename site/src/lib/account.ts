import { randomBytes, randomUUID } from 'crypto'

import { cookies, headers } from 'next/headers'
import { getFieldsToSign, jwtSign, type Payload } from 'payload'

import type { User } from '../payload-types'
import { payloadClient } from './data'

/** Readable by the browser; only says “this browser may be logged in”, never who. */
export const HINT_COOKIE = 'nl-in'
const WEEK = 60 * 60 * 24 * 7

export const newPassword = () => randomBytes(32).toString('hex')

/** The logged-in user for this request, or null. */
export async function currentUser(): Promise<User | null> {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return (user as User | null) ?? null
}

/** Only allow redirects inside this site. */
export const safeNext = (value: unknown, fallback = '/account') => {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
}

export async function setLoginCookies(payload: Payload, token: string, exp?: number) {
  const store = await cookies()
  const secure = process.env.NODE_ENV === 'production'
  const expires = new Date(exp ? exp * 1000 : Date.now() + WEEK * 1000)
  store.set(`${payload.config.cookiePrefix}-token`, token, { httpOnly: true, sameSite: 'lax', secure, path: '/', expires })
  store.set(HINT_COOKIE, '1', { httpOnly: false, sameSite: 'lax', secure, path: '/', expires })
}

/** Signs a user in without a password (after Google has confirmed who they are). */
export async function signInUser(payload: Payload, user: User) {
  const collection = payload.collections.users.config
  const sid = randomUUID()
  const now = new Date()
  const tokenExpiration = collection.auth.tokenExpiration
  const sessions = (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now)
  sessions.push({
    id: sid,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + tokenExpiration * 1000).toISOString(),
  })
  await payload.db.updateOne({ collection: 'users', id: user.id, data: { sessions }, returning: false })
  const { token, exp } = await jwtSign({
    fieldsToSign: getFieldsToSign({
      collectionConfig: collection,
      email: user.email,
      sid,
      user: { ...user, collection: 'users' } as never,
    }),
    secret: payload.secret,
    tokenExpiration,
  })
  await setLoginCookies(payload, token, exp)
}

export type GoogleProfile = { sub: string; email: string; name?: string }
export type GoogleResult = { user: User } | { error: 'staff' }

/**
 * Finds or creates the account for a Google sign-in. Staff accounts must use their
 * password. An account whose email was never proven is taken over by the Google owner:
 * its password is replaced, so someone who registered that address earlier loses access.
 */
export async function accountForGoogle(payload: Payload, profile: GoogleProfile): Promise<GoogleResult> {
  const email = profile.email.toLowerCase()
  const found = await payload.find({
    collection: 'users',
    where: { or: [{ googleId: { equals: profile.sub } }, { email: { equals: email } }] },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  })
  const existing = found.docs.find((u) => u.googleId === profile.sub) ?? found.docs[0]
  if (existing) {
    if (existing.role !== 'reader') return { error: 'staff' }
    if (existing.googleId === profile.sub && existing.emailVerified) return { user: existing }
    const user = await payload.update({
      collection: 'users',
      id: existing.id,
      data: {
        googleId: profile.sub,
        emailVerified: true,
        name: existing.name || profile.name,
        ...(existing.emailVerified ? {} : { password: newPassword() }),
      },
      overrideAccess: true,
      context: { keepVerified: true },
    })
    return { user }
  }
  const user = await payload.create({
    collection: 'users',
    data: {
      email,
      password: newPassword(),
      name: profile.name,
      role: 'reader',
      googleId: profile.sub,
      emailVerified: true,
    },
    overrideAccess: true,
    context: { readerSignup: true },
  })
  return { user }
}
