import fs from 'fs/promises'
import path from 'path'

import type { PayloadRequest } from 'payload'

import { onWorkers } from './cloudflare'
import { renderTitleCard } from './title-card'
import { idOf } from './video-thumbnail'

export type HeaderSource = 'own' | 'template'

type ArticleData = {
  title?: string
  category?: unknown
  cover?: unknown
  coverSource?: HeaderSource | null
  header?: {
    photo?: unknown
    highlight?: string | null
    line2?: string | null
    subline?: string | null
    zoom?: number | null
    focusX?: number | null
    focusY?: number | null
  } | null
}

/** The original file of an uploaded image (local folder in development, its URL otherwise). */
async function mediaFile(id: number, req: PayloadRequest): Promise<Buffer | null> {
  const doc = await req.payload.findByID({ collection: 'media', id, depth: 0, req }).catch(() => null)
  if (!doc?.filename) return null
  const local = await fs.readFile(path.resolve(process.cwd(), 'media', doc.filename)).catch(() => null)
  if (local) return local
  if (!doc.url) return null
  const url = doc.url.startsWith('/') ? `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${doc.url}` : doc.url
  const res = await fetch(url).catch(() => null)
  return res?.ok ? Buffer.from(await res.arrayBuffer()) : null
}

/**
 * Makes an article's header image from the template: the photo in a frame (or the
 * caricature when there is no photo), the category and the title. A finished header
 * uploaded by hand always wins. The template image is remade when its photo, wording,
 * title or category changes. (The replaced image is removed by the Articles afterChange hook.)
 */
export async function fillArticleHeader(
  data: ArticleData,
  original: ArticleData | undefined,
  req: PayloadRequest,
): Promise<void> {
  const current = idOf(data.cover)
  const previous = idOf(original?.cover)
  const previousSource = original?.coverSource ?? (previous ? 'own' : null)

  // A header chosen in the admin (new or changed) is the owner's own.
  if (current && current !== previous) {
    data.coverSource = 'own'
    return
  }
  // A newly added photo means “make the header from the template”, even over an old upload.
  const photoAdded = Boolean(idOf(data.header?.photo)) && idOf(data.header?.photo) !== idOf(original?.header?.photo)
  if (current && previousSource === 'own' && !photoAdded) return

  const key = (d?: ArticleData) =>
    JSON.stringify([
      d?.title,
      idOf(d?.category),
      idOf(d?.header?.photo),
      d?.header?.highlight,
      d?.header?.line2,
      d?.header?.subline,
      d?.header?.zoom ?? null,
      d?.header?.focusX ?? null,
      d?.header?.focusY ?? null,
    ])
  const needsNew = !current || photoAdded || (previousSource === 'template' && key(data) !== key(original))
  if (!needsNew || !data.title) return
  // TODO(cloudflare): see video-thumbnail.ts; header images from the template need sharp.
  if (onWorkers) return

  const categoryId = idOf(data.category)
  const category = categoryId
    ? await req.payload.findByID({ collection: 'categories', id: categoryId, depth: 0, req }).catch(() => null)
    : null
  const photoId = idOf(data.header?.photo)
  const file = await renderTitleCard({
    title: data.title,
    category: category?.name,
    highlight: data.header?.highlight,
    line2: data.header?.line2,
    subline: data.header?.subline,
    photo: photoId ? await mediaFile(photoId, req) : null,
    framing: data.header ?? undefined,
  })

  const media = await req.payload.create({
    collection: 'media',
    data: { alt: data.title },
    file: { data: file, mimetype: 'image/webp', name: `article-header-${Date.now()}.webp`, size: file.length },
    req,
  })
  data.cover = media.id
  data.coverSource = 'template'
}
