import { createHmac, timingSafeEqual } from 'crypto'

import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { Payload } from 'payload'

import { richTextToPlain } from '../utilities/rich-text-plain'

const BATCH = 100
const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** A signature for the unsubscribe link, so nobody can unsubscribe someone else. */
export const unsubscribeToken = (email: string) =>
  createHmac('sha256', process.env.PAYLOAD_SECRET ?? '')
    .update(email.toLowerCase())
    .digest('hex')
    .slice(0, 32)

export function validUnsubscribe(email: string, token: string) {
  const a = Buffer.from(unsubscribeToken(email))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const unsubscribeUrl = (email: string) =>
  `${siteUrl()}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The email for one subscriber, ready for Resend. */
export function renderNewsletter(to: string, subject: string, body: unknown) {
  const link = unsubscribeUrl(to)
  const content = convertLexicalToHTML({ data: body as never, disableContainer: true })
  return {
    from: process.env.EMAIL_FROM ?? '',
    to,
    subject,
    text: `${richTextToPlain(body)}\n\n---\nআর ইমেইল না চাইলে: ${link}`,
    html: `<div style="font-family:'Hind Siliguri','Noto Sans Bengali',sans-serif;font-size:17px;line-height:1.7;color:#1c1b1a;max-width:560px;margin:0 auto">${content}<hr style="border:0;border-top:1px solid #e6e0d8;margin:32px 0 12px"><p style="font-size:13px;color:#7a706a"><a href="${escapeHtml(link)}" style="color:#7a706a">আর ইমেইল না চাইলে এখানে ক্লিক করুন</a></p></div>`,
    headers: {
      'List-Unsubscribe': `<${link.replace('/unsubscribe?', '/unsubscribe/one-click?')}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

async function sendBatch(emails: ReturnType<typeof renderNewsletter>[]) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email not configured] newsletter to ${emails.length} address(es)`)
    return
  }
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(emails),
  })
  if (!res.ok) throw new Error(`Newsletter batch failed: ${res.status} ${await res.text()}`)
}

export async function sendNewsletterTest(to: string, subject: string, body: unknown, payload: Payload) {
  await sendBatch([renderNewsletter(to, `[পরীক্ষা] ${subject}`, body)])
  payload.logger.info(`Newsletter test sent to ${to}`)
}

/** Sends a queued newsletter in batches, remembering the position so a retry resumes. */
export async function deliverNewsletter(id: number, payload: Payload) {
  const doc = await payload.findByID({ collection: 'newsletters', id, depth: 0 }).catch(() => null)
  if (!doc || (doc.status !== 'queued' && doc.status !== 'sending')) return
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    await payload.update({
      collection: 'newsletters',
      id,
      data: { status: 'failed', report: 'Email is not set up yet (Resend key missing).' },
    })
    return
  }

  let cursor = doc.cursor ?? 0
  let sent = doc.sentCount ?? 0
  await payload.update({ collection: 'newsletters', id, data: { status: 'sending' } })
  for (;;) {
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { and: [{ id: { greater_than: cursor } }, { unsubscribedAt: { exists: false } }] },
      sort: 'id',
      limit: BATCH,
      depth: 0,
      pagination: false,
    })
    if (!docs.length) break
    await sendBatch(docs.map((s) => renderNewsletter(s.email, doc.subject, doc.body)))
    cursor = docs[docs.length - 1].id
    sent += docs.length
    await payload.update({ collection: 'newsletters', id, data: { cursor, sentCount: sent } })
    if (docs.length < BATCH) break
    await new Promise((r) => setTimeout(r, 600)) // Resend allows about two requests a second
  }
  await payload.update({
    collection: 'newsletters',
    id,
    data: { status: 'sent', sentAt: new Date().toISOString(), report: `Sent to ${sent} subscriber(s).` },
  })
}
