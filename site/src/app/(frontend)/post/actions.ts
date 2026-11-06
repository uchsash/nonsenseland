'use server'

import { headers } from 'next/headers'

import { getT } from '@/i18n/server'
import { ALAP_MAX_CHARS } from '@/collections/Alap'
import { payloadClient } from '@/lib/data'

export type PostState = { ok?: boolean; message?: string }

const MAX_IMAGE = 10 * 1024 * 1024

/** Creates a খুচরো আলাপ post. Only for logged-in admins/editors. */
export async function createAlap(_: PostState, form: FormData): Promise<PostState> {
  const t = await getT()
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const role = (user as { role?: string } | null)?.role
  if (role !== 'admin' && role !== 'editor') return { ok: false, message: t.post.failed }

  const text = String(form.get('text') ?? '').trim()
  if (!text) return { ok: false, message: t.post.failed }
  if (text.length > ALAP_MAX_CHARS) return { ok: false, message: t.post.tooLong }

  // Every post needs an image, so all cards in the deck have the same shape.
  const file = form.get('image')
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: t.post.needImage }
  if (!file.type.startsWith('image/')) return { ok: false, message: t.post.failed }
  if (file.size > MAX_IMAGE) return { ok: false, message: t.post.tooBig }
  const data = Buffer.from(await file.arrayBuffer())
  const media = await payload.create({
    collection: 'media',
    data: { alt: text.replace(/\s+/g, ' ').slice(0, 80) },
    file: { data, mimetype: file.type, name: file.name || 'alap.jpg', size: data.length },
    user,
  })
  const image = media.id

  try {
    await payload.create({
      collection: 'alap',
      data: { text, image, published: true, publishedAt: new Date().toISOString() },
      user,
      overrideAccess: false,
    })
    return { ok: true, message: t.post.done }
  } catch (err) {
    payload.logger.error({ err }, 'Quick post failed')
    return { ok: false, message: t.post.failed }
  }
}
