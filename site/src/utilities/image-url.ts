import type { Media } from '@/payload-types'

/** The image sizes (same as the Media collection's imageSizes). */
export const IMAGE_SIZES = {
  thumb: { width: 480, height: 270 },
  card: { width: 960, height: 540 },
  // Book covers: resized only, never cropped.
  cover: { width: 600, height: undefined },
  og: { width: 1200, height: 630 },
  square: { width: 900, height: 900 },
} as const
export type ImageSize = keyof typeof IMAGE_SIZES

/**
 * One size of an uploaded image. In development Payload made the sizes at upload (sharp);
 * on Cloudflare they are made on first request by /img and kept in R2.
 */
export function imageSize(media: Media, name: ImageSize): { url: string; width: number; height?: number } | null {
  const made = media.sizes?.[name]
  if (made?.url && made.width) return { url: made.url, width: made.width, height: made.height ?? undefined }
  if (!media.filename) return null
  const spec = IMAGE_SIZES[name]
  const focus =
    spec.height && (media.focalX != null || media.focalY != null)
      ? `?x=${Math.round(media.focalX ?? 50)}&y=${Math.round(media.focalY ?? 50)}`
      : ''
  const height =
    spec.height ?? (media.width && media.height ? Math.round((spec.width * media.height) / media.width) : undefined)
  return { url: `/img/${name}/${encodeURIComponent(media.filename)}${focus}`, width: spec.width, height }
}
