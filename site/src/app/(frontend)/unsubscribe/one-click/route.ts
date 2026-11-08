import { NextResponse, type NextRequest } from 'next/server'

import { payloadClient } from '@/lib/data'
import { validUnsubscribe } from '@/lib/newsletter'

/** The one-click unsubscribe that mail apps call (the List-Unsubscribe header). */
export async function POST(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get('e') ?? '').toLowerCase()
  if (!validUnsubscribe(email, request.nextUrl.searchParams.get('t') ?? '')) {
    return NextResponse.json({ error: 'bad link' }, { status: 400 })
  }
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, depth: 0 })
  if (docs[0]) {
    await payload.update({ collection: 'subscribers', id: docs[0].id, data: { unsubscribedAt: new Date().toISOString() } })
  }
  return NextResponse.json({ ok: true })
}
