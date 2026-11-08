import { NextResponse } from 'next/server'

import { payloadClient } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** Like totals for খুচরো আলাপ, so cached pages still show current numbers. */
export async function GET() {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'alap',
    where: { and: [{ published: { equals: true } }, { likeCount: { greater_than: 0 } }] },
    sort: '-publishedAt',
    limit: 200,
    depth: 0,
    pagination: false,
    select: { likeCount: true },
  })
  return NextResponse.json(Object.fromEntries(docs.map((d) => [d.id, d.likeCount ?? 0])), {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
  })
}
