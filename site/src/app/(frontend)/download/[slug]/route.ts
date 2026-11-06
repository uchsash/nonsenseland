import { payloadClient } from '@/lib/data'
import { readStoredFile } from '@/lib/files'
import type { BookFile } from '@/payload-types'

/** EPUB download. Only for published, free books with downloads allowed. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'books',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const book = docs[0]
  const file = book?.ebook?.epub as BookFile | null | undefined
  const free = !book?.online?.enabled || book.online.access === 'free'
  if (!book || !free || !book.ebook?.allowDownload || !file?.filename) {
    return new Response('Not found', { status: 404 })
  }

  const content = await readStoredFile('book-files', file.filename)
  return new Response(new Uint8Array(content), {
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `attachment; filename="${book.slug}.epub"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
