import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { accountForGoogle, safeNext, signInUser } from '@/lib/account'
import { payloadClient } from '@/lib/data'

const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const fail = (code: string) => NextResponse.redirect(`${siteUrl()}/login?error=${code}`)

type IdToken = {
  iss?: string
  aud?: string
  exp?: number
  nonce?: string
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
}

/** Google sends the reader back here with a one-time code; swap it for who they are. */
export async function GET(request: NextRequest) {
  const store = await cookies()
  const saved = store.get('nl-oauth')?.value
  store.delete({ name: 'nl-oauth', path: '/auth/google' })
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!saved || !code || !clientId || !clientSecret) return fail('google')

  let state: { state?: string; nonce?: string; next?: string }
  try {
    state = JSON.parse(saved)
  } catch {
    return fail('google')
  }
  if (!state.state || state.state !== params.get('state')) return fail('google')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${siteUrl()}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  }).catch(() => null)
  if (!res?.ok) return fail('google')

  // The token came straight from Google over TLS, so its claims can be read directly.
  const { id_token: idToken } = (await res.json()) as { id_token?: string }
  let claims: IdToken
  try {
    claims = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return fail('google')
  }
  const fromGoogle = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com'
  const current = (claims.exp ?? 0) * 1000 > Date.now()
  if (!fromGoogle || claims.aud !== clientId || !current || claims.nonce !== state.nonce) return fail('google')
  if (!claims.sub || !claims.email || !claims.email_verified) return fail('google')

  const payload = await payloadClient()
  const result = await accountForGoogle(payload, { sub: claims.sub, email: claims.email, name: claims.name })
  if ('error' in result) return fail('staff')
  await signInUser(payload, result.user)
  return NextResponse.redirect(`${siteUrl()}${safeNext(state.next)}`)
}
