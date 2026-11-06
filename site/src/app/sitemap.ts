import type { MetadataRoute } from 'next'

import { payloadClient } from '@/lib/data'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await payloadClient()
  const published = { _status: { equals: 'published' } }
  const find = (collection: 'articles' | 'videos' | 'books' | 'pages') =>
    payload.find({
      collection,
      where: published,
      limit: 5000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    })
  const [articles, videos, books, pages] = await Promise.all([
    find('articles'),
    find('videos'),
    find('books'),
    find('pages'),
  ])
  const entries = (docs: { slug?: string | null; updatedAt: string }[], prefix: string) =>
    docs.map((d) => ({ url: `${base}${prefix}/${d.slug}`, lastModified: d.updatedAt }))

  return [
    { url: base },
    { url: `${base}/videos` },
    { url: `${base}/articles` },
    { url: `${base}/books` },
    ...entries(articles.docs, '/articles'),
    ...entries(videos.docs, '/videos'),
    ...entries(books.docs, '/books'),
    ...entries(pages.docs, ''),
  ]
}
