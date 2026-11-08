import { randomBytes } from 'crypto'

import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { safeNext } from '@/lib/account'

const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** Sends the reader to Google, remembering a one-time state to check on the way back. */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return NextResponse.redirect(`${siteUrl()}/login`)

  const state = randomBytes(16).toString('hex')
  const nonce = randomBytes(16).toString('hex')
  const next = safeNext(request.nextUrl.searchParams.get('next'))
  ;(await cookies()).set('nl-oauth', JSON.stringify({ state, nonce, next }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/auth/google',
    maxAge: 600,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl()}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    prompt: 'select_account',
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
