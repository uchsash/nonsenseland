import { NextResponse, type NextRequest } from 'next/server'
import type { Where } from 'payload'

import { badRequest, notSignedIn, readerFrom } from '@/lib/account-route'
import { payloadClient } from '@/lib/data'

/** Likes or unlikes a খুচরো আলাপ card and returns the new total. */
export async function POST(request: NextRequest) {
  const user = await readerFrom(request)
  if (!user) return notSignedIn()
  const body = (await request.json().catch(() => null)) as { alap?: unknown } | null
  const alap = body?.alap
  if (!Number.isInteger(alap)) return badRequest()
  const id = alap as number

  const payload = await payloadClient()
  const card = await payload.findByID({ collection: 'alap', id, depth: 0 }).catch(() => null)
  if (!card?.published) return badRequest()

  const where: Where = { and: [{ user: { equals: user.id } }, { alap: { equals: id } }] }
  const existing = await payload.find({ collection: 'likes', where, limit: 1, depth: 0 })
  if (existing.docs[0]) await payload.delete({ collection: 'likes', id: existing.docs[0].id })
  else await payload.create({ collection: 'likes', data: { user: user.id, alap: id } }).catch(() => null)

  const { totalDocs: count } = await payload.count({ collection: 'likes', where: { alap: { equals: id } } })
  // Straight to the database: a like must not rebuild the whole site's cached pages.
  await payload.db.updateOne({ collection: 'alap', id, data: { likeCount: count }, returning: false })
  return NextResponse.json({ liked: !existing.docs[0], count })
}
