'use server'

import { getT } from '@/i18n/server'
import { payloadClient } from '@/lib/data'
import { emailConfigured, sendEmail } from '@/lib/email'
import { readStoredFile } from '@/lib/files'
import { verifyHuman, visitorHash } from '@/lib/visitor'
import type { BookFile } from '@/payload-types'

export type FormState = { ok?: boolean; message?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KINDLE = /^[^\s@]+@(free\.)?kindle\.(com|cn)$/i
const KINDLE_PER_HOUR = 3

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) return { ok: false, message: t.newsletter.invalid }
  if (!(await verifyHuman(form.get('cf-turnstile-response')))) return { ok: false, message: t.contact.failed }
  const payload = await payloadClient()
  const exists = await payload.count({ collection: 'subscribers', where: { email: { equals: email } } })
  if (exists.totalDocs) return { ok: true, message: t.newsletter.already }
  await payload.create({ collection: 'subscribers', data: { email } })
  return { ok: true, message: t.newsletter.done }
}

export async function sendMessage(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const name = String(form.get('name') ?? '').trim().slice(0, 120)
  const email = String(form.get('email') ?? '').trim()
  const message = String(form.get('message') ?? '').trim().slice(0, 5000)
  if (!name || !EMAIL.test(email) || !message) return { ok: false, message: t.contact.failed }
  if (!(await verifyHuman(form.get('cf-turnstile-response')))) return { ok: false, message: t.contact.failed }
  const payload = await payloadClient()
  await payload.create({ collection: 'messages', data: { name, email, message } })
  if (process.env.CONTACT_TO) {
    await sendEmail({
      to: process.env.CONTACT_TO,
      subject: `Nonsenseland: message from ${name}`,
      text: `${message}\n\n— ${name} <${email}>`,
    }).catch((err) => payload.logger.error({ err }, 'Contact email failed'))
  }
  return { ok: true, message: t.contact.done }
}

export async function sendToKindle(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const to = String(form.get('kindle') ?? '').trim()
  const bookId = Number(form.get('book'))
  if (!KINDLE.test(to)) return { ok: false, message: t.kindle.invalid }
  if (!emailConfigured()) return { ok: false, message: t.kindle.notConfigured }
  if (!(await verifyHuman(form.get('cf-turnstile-response')))) return { ok: false, message: t.kindle.failed }

  const payload = await payloadClient()
  const ipHash = await visitorHash()
  const recent = await payload.count({
    collection: 'kindle-sends',
    where: {
      and: [
        { ipHash: { equals: ipHash } },
        { createdAt: { greater_than: new Date(Date.now() - 3600_000).toISOString() } },
      ],
    },
    overrideAccess: true,
  })
  if (recent.totalDocs >= KINDLE_PER_HOUR) return { ok: false, message: t.kindle.limited }

  const book = await payload.findByID({ collection: 'books', id: bookId, depth: 1 }).catch(() => null)
  const file = book?.ebook?.epub as BookFile | null | undefined
  // Only published, free books with Kindle allowed can be sent.
  const allowed =
    book?._status === 'published' &&
    book.ebook?.allowKindle &&
    (!book.online?.enabled || book.online.access === 'free') &&
    file?.filename
  if (!allowed) return { ok: false, message: t.kindle.failed }

  try {
    const content = await readStoredFile('book-files', file.filename!)
    await sendEmail({
      to,
      from: process.env.KINDLE_FROM ?? process.env.EMAIL_FROM,
      subject: book.title,
      text: `${book.title} — ননসেন্সল্যান্ড`,
      attachments: [{ filename: `${book.slug}.epub`, content }],
    })
    await payload.create({
      collection: 'kindle-sends',
      data: { book: book.id, ipHash, status: 'sent' },
      overrideAccess: true,
    })
    return { ok: true, message: t.kindle.sent }
  } catch (err) {
    payload.logger.error({ err }, 'Kindle send failed')
    await payload.create({
      collection: 'kindle-sends',
      data: { book: book.id, ipHash, status: 'failed' },
      overrideAccess: true,
    })
    return { ok: false, message: t.kindle.failed }
  }
}
