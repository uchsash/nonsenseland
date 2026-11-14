import { workerEnv } from '@/lib/cloudflare'
import { IMAGE_SIZES, type ImageSize } from '@/utilities/image-url'

/**
 * A resized image on Cloudflare: made once with Cloudflare Images from the original in R2,
 * kept in R2 under sizes/, and cached by browsers and Cloudflare for a year. Each image and
 * size is transformed only once, which keeps well inside the free monthly allowance.
 */
export async function GET(request: Request, { params }: { params: Promise<{ size: string; file: string }> }) {
  const { size, file } = await params
  const spec = IMAGE_SIZES[size as ImageSize]
  const filename = decodeURIComponent(file)
  if (!spec || filename.includes('/') || filename.includes('..')) return new Response('Not found', { status: 404 })

  const url = new URL(request.url)
  const x = Number(url.searchParams.get('x') ?? 50)
  const y = Number(url.searchParams.get('y') ?? 50)
  const cf = await workerEnv()
  // Development: Payload already made the sizes; send the original.
  if (!cf) return Response.redirect(new URL(`/api/media/file/${encodeURIComponent(filename)}`, request.url), 302)

  const headers = { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' }
  const key = `sizes/${size}/${spec.height ? `${x}-${y}/` : ''}${filename}.webp`
  const kept = await cf.R2.get(key)
  if (kept) return new Response(kept.body, { headers })

  const original = await cf.R2.get(filename)
  if (!original) return new Response('Not found', { status: 404 })
  const transformed = await cf.IMAGES.input(original.body)
    .transform(
      spec.height
        ? {
            width: spec.width,
            height: spec.height,
            fit: 'cover',
            gravity: { x: Math.min(Math.max(x, 0), 100) / 100, y: Math.min(Math.max(y, 0), 100) / 100 },
          }
        : { width: spec.width, fit: 'scale-down' },
    )
    .output({ format: 'image/webp', quality: 82 })
  const bytes = await transformed.response().arrayBuffer()
  await cf.R2.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } })
  return new Response(bytes, { headers })
}
