import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Access rules that protect readers' data and unpublished/paid content.
 * Every check runs as an anonymous visitor (`overrideAccess: false`, no user).
 */
let payload: Payload
const created: { collection: 'subscribers' | 'messages' | 'pages'; id: number }[] = []
const asVisitor = { overrideAccess: false } as const

const richText = {
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: null,
    children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'draft', version: 1 }] },
    ],
  },
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  const stamp = Date.now()
  created.push({
    collection: 'subscribers',
    id: (await payload.create({ collection: 'subscribers', data: { email: `t${stamp}@example.com` } })).id,
  })
  created.push({
    collection: 'messages',
    id: (
      await payload.create({
        collection: 'messages',
        data: { name: 'Test', email: `t${stamp}@example.com`, message: 'private' },
      })
    ).id,
  })
  created.push({
    collection: 'pages',
    id: (
      await payload.create({
        collection: 'pages',
        draft: true,
        data: { title: 'Draft page', slug: `draft-${stamp}`, content: richText, _status: 'draft' },
      })
    ).id,
  })
})

afterAll(async () => {
  for (const { collection, id } of created) await payload.delete({ collection, id })
})

describe('visitors cannot read private data', () => {
  for (const collection of ['users', 'subscribers', 'messages', 'kindle-sends', 'orders', 'chapters', 'book-files'] as const) {
    it(`cannot list ${collection}`, async () => {
      await expect(payload.find({ collection, ...asVisitor })).rejects.toThrow()
    })
  }
})

describe('visitors cannot write', () => {
  it('cannot create subscribers directly (forms go through the spam-checked server action)', async () => {
    await expect(
      payload.create({ collection: 'subscribers', data: { email: 'x@example.com' }, ...asVisitor }),
    ).rejects.toThrow()
  })
  it('cannot create users', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'intruder@example.com', password: 'x1234567', role: 'admin' },
        ...asVisitor,
      }),
    ).rejects.toThrow()
  })
  it('cannot change site settings', async () => {
    await expect(
      payload.updateGlobal({ slug: 'site-settings', data: { siteName: 'hacked' }, ...asVisitor }),
    ).rejects.toThrow()
  })
})

describe('drafts stay hidden', () => {
  it('a draft page is not visible to visitors', async () => {
    const draftId = created.find((c) => c.collection === 'pages')!.id
    const res = await payload.find({ collection: 'pages', where: { id: { equals: draftId } }, ...asVisitor })
    expect(res.totalDocs).toBe(0)
  })
})
