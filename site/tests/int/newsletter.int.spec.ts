// @vitest-environment node
import { deliverNewsletter } from '@/lib/newsletter'
import config from '@/payload.config'
import { plainToRichText } from '@/utilities/rich-text-plain'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let payload: Payload
const stamp = Date.now()
const subscribers: number[] = []
const newsletters: number[] = []
const realFetch = globalThis.fetch

const create = async (data: { sendNow?: boolean } = {}) => {
  const doc = await payload.create({
    collection: 'newsletters',
    data: { subject: `পরীক্ষা ${stamp}`, body: plainToRichText('লেখা') as never, ...data },
  })
  newsletters.push(doc.id)
  return doc
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  for (const [name, off] of [['on', false], ['off', true]] as const) {
    const s = await payload.create({
      collection: 'subscribers',
      data: { email: `${name}-${stamp}@test.invalid`, unsubscribedAt: off ? new Date().toISOString() : null },
    })
    subscribers.push(s.id)
  }
})

afterAll(async () => {
  globalThis.fetch = realFetch
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
  for (const id of subscribers) await payload.delete({ collection: 'subscribers', id }).catch(() => null)
  for (const id of newsletters) await payload.delete({ collection: 'newsletters', id }).catch(() => null)
})

describe('sending a newsletter', () => {
  it('reports clearly when email is not set up', async () => {
    delete process.env.RESEND_API_KEY
    const doc = await create()
    await payload.update({ collection: 'newsletters', id: doc.id, data: { status: 'queued' } })
    await deliverNewsletter(doc.id, payload)
    const after = await payload.findByID({ collection: 'newsletters', id: doc.id })
    expect(after.status).toBe('failed')
    expect(after.report).toContain('not set up')
  })

  it('skips unsubscribed readers, and does not resend on a retry', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.EMAIL_FROM = 'test@test.invalid'
    const sent: string[] = []
    const mock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      for (const mail of JSON.parse(String(init?.body)) as { to: string }[]) sent.push(mail.to)
      return new Response('{}', { status: 200 })
    })
    globalThis.fetch = mock as typeof fetch

    const doc = await create()
    await payload.update({ collection: 'newsletters', id: doc.id, data: { status: 'queued' } })
    await deliverNewsletter(doc.id, payload)
    const after = await payload.findByID({ collection: 'newsletters', id: doc.id })
    expect(after.status).toBe('sent')
    expect(sent).toContain(`on-${stamp}@test.invalid`)
    expect(sent).not.toContain(`off-${stamp}@test.invalid`)

    const before = sent.length
    await deliverNewsletter(doc.id, payload)
    expect(sent.length).toBe(before)
    globalThis.fetch = realFetch
  })

  it('queues a job when told to send', async () => {
    const doc = await create({ sendNow: true })
    expect(doc.status).toBe('queued')
    expect(doc.sendNow).toBe(false)
    const jobs = await payload.find({
      collection: 'payload-jobs',
      where: { taskSlug: { equals: 'sendNewsletter' } },
      sort: '-createdAt',
      limit: 1,
    })
    expect((jobs.docs[0].input as { newsletter: number }).newsletter).toBe(doc.id)
    await payload.delete({ collection: 'payload-jobs', id: jobs.docs[0].id })
    await payload.update({ collection: 'newsletters', id: doc.id, data: { status: 'draft' } })
  })
})
