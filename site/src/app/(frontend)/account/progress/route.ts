import { NextResponse, type NextRequest } from 'next/server'

import { badRequest, notSignedIn, readerFrom } from '@/lib/account-route'
import { payloadClient } from '@/lib/data'

/** Saves where a reader is in a book; an older report never replaces a newer one. */
export async function POST(request: NextRequest) {
  const user = await readerFrom(request)
  if (!user) return notSignedIn()

  const body = (await request.json().catch(() => null)) as
    | { book?: unknown; chapter?: unknown; ratio?: unknown; at?: unknown }
    | null
  const { book: slug, chapter, ratio, at } = body ?? {}
  if (typeof slug !== 'string' || !Number.isInteger(chapter) || typeof ratio !== 'number' || typeof at !== 'number') {
    return badRequest()
  }
  if (ratio < 0 || ratio > 1 || (chapter as number) < 1 || at > Date.now() + 60_000) return badRequest()

  const payload = await payloadClient()
  const books = await payload.find({ collection: 'books', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const book = books.docs[0]
  if (!book) return badRequest()

  const data = { chapterNumber: chapter as number, position: ratio, savedAt: at }
  const existing = await payload.find({
    collection: 'reading-progress',
    where: { and: [{ user: { equals: user.id } }, { book: { equals: book.id } }] },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    if ((existing.docs[0].savedAt ?? 0) < at) {
      await payload.update({ collection: 'reading-progress', id: existing.docs[0].id, data })
    }
  } else {
    // Two tabs can race here; the unique index keeps a single row.
    await payload
      .create({ collection: 'reading-progress', data: { ...data, user: user.id, book: book.id } })
      .catch(() => null)
  }
  return NextResponse.json({ ok: true })
}
