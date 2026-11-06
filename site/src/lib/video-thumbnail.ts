import type { PayloadRequest } from 'payload'

import { detectPlatform, youtubeId } from '../utilities/video'
import { renderTitleCard } from './title-card'

export type ThumbnailSource = 'own' | 'youtube' | 'card'

export const idOf = (value: unknown): number | null =>
  typeof value === 'number' ? value : value && typeof value === 'object' ? ((value as { id?: number }).id ?? null) : null

/** YouTube's own thumbnail (the large one if it exists, otherwise the standard one). */
async function youtubeThumbnail(url: string): Promise<Buffer | null> {
  const id = youtubeId(url)
  if (!id) return null
  for (const size of ['maxresdefault', 'hqdefault']) {
    const res = await fetch(`https://img.youtube.com/vi/${id}/${size}.jpg`).catch(() => null)
    if (res?.ok) return Buffer.from(await res.arrayBuffer())
  }
  return null
}

type VideoData = {
  title?: string
  url?: string
  category?: unknown
  thumbnail?: unknown
  thumbnailSource?: ThumbnailSource | null
}

/**
 * Fills in a video's thumbnail when none is given: YouTube's thumbnail for YouTube links,
 * otherwise a title card (logo, category, title, caricature). An uploaded thumbnail always
 * wins. An automatic title card is remade when the title or category changes.
 * (The replaced automatic image is removed by the Videos afterChange hook.)
 */
export async function fillVideoThumbnail(
  data: VideoData,
  original: VideoData | undefined,
  req: PayloadRequest,
): Promise<void> {
  const current = idOf(data.thumbnail)
  const previous = idOf(original?.thumbnail)
  const previousSource = original?.thumbnailSource ?? (previous ? 'own' : null)

  // A thumbnail chosen in the admin (new or changed) is the owner's own.
  if (current && current !== previous) {
    data.thumbnailSource = 'own'
    return
  }
  if (current && previousSource === 'own') return

  const titleOrCategoryChanged =
    data.title !== original?.title || idOf(data.category) !== idOf(original?.category)
  const needsNew = !current || (previousSource === 'card' && titleOrCategoryChanged)
  if (!needsNew || !data.title) return

  let file: Buffer | null = null
  let source: ThumbnailSource = 'card'
  if (data.url && detectPlatform(data.url) === 'youtube') {
    file = await youtubeThumbnail(data.url)
    if (file) source = 'youtube'
  }
  if (!file) {
    const categoryId = idOf(data.category)
    const category = categoryId
      ? await req.payload.findByID({ collection: 'categories', id: categoryId, depth: 0, req }).catch(() => null)
      : null
    file = await renderTitleCard({
      title: data.title,
      category: category?.name,
      colorIndex: category?.order ?? categoryId ?? 0,
    })
  }

  const media = await req.payload.create({
    collection: 'media',
    data: { alt: `${data.title} — থাম্বনেইল` },
    file: {
      data: file,
      mimetype: source === 'youtube' ? 'image/jpeg' : 'image/webp',
      name: `video-${source}-${Date.now()}.${source === 'youtube' ? 'jpg' : 'webp'}`,
      size: file.length,
    },
    req,
  })
  data.thumbnail = media.id
  data.thumbnailSource = source
}
