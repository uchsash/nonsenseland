import { NextResponse, type NextRequest } from 'next/server'
import type { Where } from 'payload'

import { badRequest, notSignedIn, readerFrom } from '@/lib/account-route'
import { payloadClient } from '@/lib/data'

const KINDS = ['article', 'book', 'chapter'] as const
type Kind = (typeof KINDS)[number]

/** Saves or removes a bookmark on an article, book or chapter. */
export async function POST(request: NextRequest) {
  const user = await readerFrom(request)
  if (!user) return notSignedIn()
  const body = (await request.json().catch(() => null)) as { kind?: Kind; target?: unknown } | null
  if (!body?.kind || !KINDS.includes(body.kind) || !Number.isInteger(body.target)) return badRequest()
  const { kind } = body
  const target = body.target as number

  const payload = await payloadClient()
  const collection = kind === 'article' ? 'articles' : kind === 'book' ? 'books' : 'chapters'
  const exists = await payload.findByID({ collection, id: target, depth: 0 }).catch(() => null)
  if (!exists) return badRequest()

  const where: Where = { and: [{ user: { equals: user.id } }, { kind: { equals: kind } }, { target: { equals: target } }] }
  const existing = await payload.find({ collection: 'bookmarks', where, limit: 1, depth: 0 })
  if (existing.docs[0]) await payload.delete({ collection: 'bookmarks', id: existing.docs[0].id })
  else await payload.create({ collection: 'bookmarks', data: { user: user.id, kind, target } }).catch(() => null)
  return NextResponse.json({ saved: !existing.docs[0] })
}
