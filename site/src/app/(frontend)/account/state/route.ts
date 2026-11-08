import { NextResponse, type NextRequest } from 'next/server'

import { noStore, readerFrom } from '@/lib/account-route'
import { payloadClient } from '@/lib/data'
import type { Book } from '@/payload-types'

/** Everything the browser needs about the signed-in reader, loaded once per page. */
export async function GET(request: NextRequest) {
  const user = await readerFrom(request)
  if (!user) return NextResponse.json({ user: null }, { headers: noStore })

  const payload = await payloadClient()
  const mine = { user: { equals: user.id } }
  const [likes, bookmarks, progress] = await Promise.all([
    payload.find({ collection: 'likes', where: mine, limit: 2000, depth: 0, pagination: false }),
    payload.find({ collection: 'bookmarks', where: mine, limit: 2000, depth: 0, pagination: false }),
    payload.find({ collection: 'reading-progress', where: mine, limit: 500, depth: 1, pagination: false }),
  ])

  return NextResponse.json(
    {
      user: { id: user.id, name: user.name, email: user.email, kindleEmail: user.kindleEmail },
      likes: likes.docs.map((l) => (typeof l.alap === 'object' ? l.alap.id : l.alap)),
      bookmarks: bookmarks.docs.map((b) => `${b.kind}:${b.target}`),
      progress: Object.fromEntries(
        progress.docs.flatMap((p) => {
          const slug = (p.book as Book | null)?.slug
          return slug ? [[slug, { chapter: p.chapterNumber, ratio: p.position, at: p.savedAt }]] : []
        }),
      ),
    },
    { headers: noStore },
  )
}
