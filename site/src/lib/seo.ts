import type { Metadata } from 'next'

import type { Media } from '@/payload-types'
import { imageSize } from '@/utilities/image-url'

type WithMeta = {
  title?: string | null
  meta?: { title?: string | null; description?: string | null; image?: number | Media | null } | null
}

/** Page metadata from a document's SEO fields, falling back to its own title/description/image. */
export function docMetadata(
  doc: WithMeta | undefined,
  { path, description, image }: { path: string; description?: string | null; image?: number | Media | null },
): Metadata {
  if (!doc) return {}
  const img = (typeof doc.meta?.image === 'object' && doc.meta.image) || (typeof image === 'object' && image) || null
  const ogUrl = img ? (imageSize(img, 'og')?.url ?? img.url) : undefined
  const desc = doc.meta?.description || description || undefined
  return {
    title: doc.meta?.title ? { absolute: doc.meta.title } : (doc.title ?? undefined),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: doc.meta?.title || doc.title || undefined,
      description: desc,
      url: path,
      images: ogUrl ? [{ url: ogUrl, width: 1200, height: 630 }] : undefined,
    },
  }
}
