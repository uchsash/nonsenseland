import { NextResponse, type NextRequest } from 'next/server'

import type { User } from '../payload-types'
import { payloadClient } from './data'

/** The signed-in reader for an /account route. Writes from other sites are refused. */
export async function readerFrom(request: NextRequest): Promise<User | null> {
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin')
    if (origin && new URL(origin).host !== request.headers.get('host')) return null
  }
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  return (user as User | null) ?? null
}

export const notSignedIn = () => NextResponse.json({ error: 'not signed in' }, { status: 401 })
export const badRequest = () => NextResponse.json({ error: 'bad request' }, { status: 400 })
export const noStore = { 'Cache-Control': 'private, no-store' }
