import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Book, Category } from '@/payload-types'

export const payloadClient = cache(() => getPayload({ config }))

/** Drafts are visible only while the admin is previewing. */
const isDraft = async () => (await draftMode()).isEnabled

const published = async (): Promise<Where> => ((await isDraft()) ? {} : { _status: { equals: 'published' } })

export const getSettings = cache(async () =>
  (await payloadClient()).findGlobal({ slug: 'site-settings', depth: 1 }),
)
export const getHomepage = cache(async () => (await payloadClient()).findGlobal({ slug: 'homepage', depth: 1 }))
export const getAdSettings = cache(async () => (await payloadClient()).findGlobal({ slug: 'ad-settings' }))

export const getCategories = cache(async (kind: Category['kind']) => {
  const res = await (await payloadClient()).find({
    collection: 'categories',
    where: { kind: { equals: kind } },
    sort: 'order',
    limit: 100,
    depth: 0,
  })
  return res.docs
})

export async function listVideos({ category, topic, limit = 12, page = 1 } = {} as ListArgs) {
  const where: Where = { and: [await published()] }
  if (category) where.and!.push({ category: { equals: category } })
  if (topic) where.and!.push({ topics: { contains: topic } })
  return (await payloadClient()).find({
    collection: 'videos',
    where,
    sort: ['-featured', '-publishedAt'],
    limit,
    page,
    depth: 1,
    draft: await isDraft(),
  })
}

export async function listArticles({ category, topic, limit = 12, page = 1, exclude } = {} as ListArgs) {
  const where: Where = { and: [await published()] }
  if (category) where.and!.push({ category: { equals: category } })
  if (topic) where.and!.push({ topics: { contains: topic } })
  if (exclude) where.and!.push({ id: { not_equals: exclude } })
  return (await payloadClient()).find({
    collection: 'articles',
    where,
    sort: ['-featured', '-publishedAt'],
    limit,
    page,
    depth: 1,
    draft: await isDraft(),
    select: { content: false },
  })
}

type ListArgs = { category?: number; topic?: number; limit?: number; page?: number; exclude?: number }

const bySlug = async <T extends 'articles' | 'videos' | 'books' | 'pages' | 'topics'>(collection: T, slug: string) => {
  const draft = collection === 'topics' ? false : await isDraft()
  const res = await (await payloadClient()).find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft,
  })
  return res.docs[0]
}

export const getArticle = cache((slug: string) => bySlug('articles', slug))
export const getVideo = cache((slug: string) => bySlug('videos', slug))
export const getBook = cache((slug: string) => bySlug('books', slug) as Promise<Book | undefined>)
export const getPage = cache((slug: string) => bySlug('pages', slug))
export const getTopic = cache((slug: string) => bySlug('topics', slug))

export async function listBooks(shelf: 'library' | 'published') {
  const field = shelf === 'library' ? 'online.enabled' : 'print.enabled'
  const res = await (await payloadClient()).find({
    collection: 'books',
    where: { and: [await published(), { [field]: { equals: true } }] },
    sort: ['order', '-createdAt'],
    limit: 100,
    depth: 1,
    draft: await isDraft(),
  })
  return res.docs
}

/** Chapter titles of a book (no text). Chapters are staff-only in the API, so access is checked here. */
export const getChapterList = cache(async (bookId: number) => {
  const res = await (await payloadClient()).find({
    collection: 'chapters',
    where: { book: { equals: bookId } },
    sort: 'order',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    select: { title: true, order: true, wordCount: true },
  })
  return res.docs
})

/**
 * A chapter's text, or null if the visitor may not read it.
 * Phase 1: free books are fully open; members/paid books open only their sample chapters.
 */
type Reader = { id: number; role?: string | null } | null

/** Why a chapter is closed: “login” for members-only books, “buy” for paid ones. */
export type LockReason = 'login' | 'buy'

/**
 * Whether this reader may open chapters past the free sample: staff always; members-only
 * books for any signed-in reader; paid books once the reader has access (bought or given).
 */
async function mayReadAll(book: Book, reader: Reader): Promise<boolean> {
  if (!reader) return false
  if (reader.role === 'admin' || reader.role === 'editor') return true
  if (book.online?.access === 'members') return true
  const owned = await (await payloadClient()).count({
    collection: 'entitlements',
    where: { and: [{ user: { equals: reader.id } }, { book: { equals: book.id } }] },
  })
  return owned.totalDocs > 0
}

export async function getReadableChapter(book: Book, order: number, reader: () => Promise<Reader> = async () => null) {
  if (!book.online?.enabled) return null
  const access = book.online.access ?? 'free'
  const sample = book.online.sampleChapters ?? 0
  if (access !== 'free' && order > sample && !(await mayReadAll(book, await reader()))) {
    return { locked: (access === 'members' ? 'login' : 'buy') as LockReason }
  }
  const res = await (await payloadClient()).find({
    collection: 'chapters',
    where: { and: [{ book: { equals: book.id } }, { order: { equals: order } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

/** Ads for a position. Away from the end of a text, end-of-text ads are never offered. */
export async function getAdsFor(slot: string, adId?: number, endOfText = false) {
  const settings = await getAdSettings()
  if (!settings.enabled) return []
  const now = new Date().toISOString()
  const res = await (await payloadClient()).find({
    collection: 'ads',
    where: {
      and: [
        { active: { equals: true } },
        adId ? { id: { equals: adId } } : { slots: { contains: slot } },
        ...(endOfText ? [] : [{ placement: { not_equals: 'end' } }]),
        { or: [{ startAt: { exists: false } }, { startAt: { less_than_equal: now } }] },
        { or: [{ endAt: { exists: false } }, { endAt: { greater_than: now } }] },
      ],
    },
    limit: 10,
    depth: 1,
  })
  return res.docs
}

/**
 * The ad to show: a specific one (if it is active and in date), otherwise one of the
 * active ads for the slot, taking turns at random.
 */
export async function pickAd(slot: string, adId?: number, endOfText = false) {
  const ads = await getAdsFor(slot, adId, endOfText)
  return ads.length ? ads[Math.floor(Math.random() * ads.length)] : null
}

export async function searchAll(q: string) {
  const payload = await payloadClient()
  const where = (fields: string[]): Where => ({
    and: [{ _status: { equals: 'published' } }, { or: fields.map((f) => ({ [f]: { like: q } })) }],
  })
  const [articles, videos, books] = await Promise.all([
    payload.find({ collection: 'articles', where: where(['title', 'excerpt']), limit: 20, depth: 1, select: { content: false } }),
    payload.find({ collection: 'videos', where: where(['title', 'description']), limit: 20, depth: 1 }),
    payload.find({ collection: 'books', where: where(['title', 'description', 'originalAuthor']), limit: 20, depth: 1 }),
  ])
  return { articles: articles.docs, videos: videos.docs, books: books.docs }
}

/** Normal খুচরো আলাপ posts (book cards only ever show while pinned). */
const alapPosts: Where = {
  and: [
    { published: { equals: true } },
    { or: [{ kind: { equals: 'post' } }, { kind: { exists: false } }] },
  ],
}

/** The pinned card (book card or post), if its pin is still running. */
export const getPinnedAlap = cache(async () => {
  const now = new Date().toISOString()
  const res = await (await payloadClient()).find({
    collection: 'alap',
    where: {
      and: [
        { published: { equals: true } },
        { pinned: { equals: true } },
        { or: [{ pinUntil: { exists: false } }, { pinUntil: { greater_than: now } }] },
      ],
    },
    sort: '-publishedAt',
    limit: 1,
    depth: 2, // book → cover
  })
  return res.docs[0] ?? null
})

/** The deck: the pinned card first, then the latest posts. */
export async function listAlap(limit = 6) {
  const pinned = await getPinnedAlap()
  const res = await (await payloadClient()).find({
    collection: 'alap',
    where: pinned ? { and: [alapPosts, { id: { not_equals: pinned.id } }] } : alapPosts,
    sort: '-publishedAt',
    limit,
    depth: 1,
  })
  return pinned ? [pinned, ...res.docs] : res.docs
}

/** The খুচরো আলাপ feed page by page (the pinned card is shown separately on page 1). */
export async function alapFeed(page = 1, limit = 15) {
  const pinned = await getPinnedAlap()
  return (await payloadClient()).find({
    collection: 'alap',
    where: pinned ? { and: [alapPosts, { id: { not_equals: pinned.id } }] } : alapPosts,
    sort: '-publishedAt',
    limit,
    page,
    depth: 1,
  })
}
