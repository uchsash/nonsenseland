import type { Media } from '@/payload-types'

type Size = 'thumb' | 'card' | 'cover' | 'og' | 'square'

/**
 * Responsive image from the media library. Payload already stores resized WebP
 * versions, so a plain <img> with srcset is enough (no image server needed).
 * Pass `use={[]}` to show the original, uncropped image.
 */
export function Img({
  media,
  sizes = '(max-width: 640px) 100vw, 480px',
  use = ['thumb', 'card'],
  className,
  priority,
}: {
  media?: Media | number | null
  sizes?: string
  use?: Size[]
  className?: string
  priority?: boolean
}) {
  if (!media || typeof media === 'number') return <div className={`img-empty ${className ?? ''}`} />
  const variants = use
    .map((name) => media.sizes?.[name])
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.url && s.width))
  const srcSet = variants.map((v) => `${v.url} ${v.width}w`).join(', ')
  return (
    <img
      className={className}
      src={variants.at(-1)?.url ?? media.url ?? ''}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={media.alt}
      width={variants.at(-1)?.width ?? media.width ?? undefined}
      height={variants.at(-1)?.height ?? media.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}
