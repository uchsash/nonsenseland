// @vitest-environment node
import { accountForGoogle, signInUser } from '@/lib/account'
import { renderNewsletter, unsubscribeToken, validUnsubscribe } from '@/lib/newsletter'
import config from '@/payload.config'
import { plainToRichText } from '@/utilities/rich-text-plain'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const jar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({ set: (name: string, value: string) => jar.set(name, value) }),
  headers: async () => new Headers(),
}))

let payload: Payload
const stamp = Date.now()
const made: number[] = []
const asVisitor = { overrideAccess: false } as const

const reader = async (email: string, extra: Record<string, unknown> = {}) => {
  const user = await payload.create({
    collection: 'users',
    data: { email, password: 'correct-horse', role: 'reader', ...extra },
    context: { readerSignup: true },
  })
  made.push(user.id)
  return user
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  for (const id of made) await payload.delete({ collection: 'users', id }).catch(() => null)
})

describe('reader data stays private', () => {
  it('visitors cannot read or write bookmarks, likes or reading progress', async () => {
    for (const collection of ['bookmarks', 'likes', 'reading-progress'] as const) {
      await expect(payload.find({ collection, ...asVisitor })).rejects.toThrow()
    }
    await expect(
      payload.create({ collection: 'bookmarks', data: { user: 1, kind: 'book', target: 1 }, ...asVisitor }),
    ).rejects.toThrow()
  })

  it('a reader cannot read another reader, or make themselves staff', async () => {
    const a = await reader(`a-${stamp}@test.invalid`)
    const b = await reader(`b-${stamp}@test.invalid`)
    const as = { overrideAccess: false, user: { ...a, collection: 'users' as const } }
    const seen = await payload.find({ collection: 'users', ...as })
    expect(seen.docs.map((u) => u.id)).toEqual([a.id])
    await expect(payload.findByID({ collection: 'users', id: b.id, ...as })).rejects.toThrow()

    const updated = await payload.update({ collection: 'users', id: a.id, data: { role: 'admin', emailVerified: true }, ...as })
    expect(updated.role).toBe('reader')
    expect(updated.emailVerified).toBeFalsy()
  })

  it('readers cannot read or create newsletters', async () => {
    const a = await reader(`c-${stamp}@test.invalid`)
    const as = { overrideAccess: false, user: { ...a, collection: 'users' as const } }
    await expect(payload.find({ collection: 'newsletters', ...as })).rejects.toThrow()
  })

  it('changing an email address un-proves it', async () => {
    const a = await reader(`d-${stamp}@test.invalid`, { emailVerified: true })
    const updated = await payload.update({ collection: 'users', id: a.id, data: { email: `d2-${stamp}@test.invalid` } })
    expect(updated.emailVerified).toBe(false)
  })
})

describe('Google sign-in', () => {
  it('creates a verified reader', async () => {
    const result = await accountForGoogle(payload, { sub: `g-new-${stamp}`, email: `new-${stamp}@test.invalid`, name: 'নতুন' })
    if ('error' in result) throw new Error('unexpected')
    made.push(result.user.id)
    expect(result.user.role).toBe('reader')
    expect(result.user.emailVerified).toBe(true)
  })

  it('removes the password of someone who pre-registered that address', async () => {
    const email = `taken-${stamp}@test.invalid`
    await reader(email)
    const result = await accountForGoogle(payload, { sub: `g-taken-${stamp}`, email })
    expect('user' in result).toBe(true)
    await expect(payload.login({ collection: 'users', data: { email, password: 'correct-horse' } })).rejects.toThrow()
  })

  it('keeps the password when the address was already proven', async () => {
    const email = `proven-${stamp}@test.invalid`
    await reader(email, { emailVerified: true })
    await accountForGoogle(payload, { sub: `g-proven-${stamp}`, email })
    const login = await payload.login({ collection: 'users', data: { email, password: 'correct-horse' } })
    expect(login.token).toBeTruthy()
  })

  it('issues a session the site accepts', async () => {
    const user = await reader(`session-${stamp}@test.invalid`)
    await signInUser(payload, user)
    const token = jar.get('payload-token')
    expect(jar.get('nl-in')).toBe('1')
    const auth = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    expect(auth.user?.id).toBe(user.id)
  })

  it('never signs in to a staff account', async () => {
    const email = `staff-${stamp}@test.invalid`
    await reader(email, { role: 'editor' })
    expect(await accountForGoogle(payload, { sub: `g-staff-${stamp}`, email })).toEqual({ error: 'staff' })
  })
})

describe('deleting things readers have touched', () => {
  it('removes a liked card, and a reader who has likes', async () => {
    const media = (await payload.find({ collection: 'media', limit: 1, depth: 0 })).docs[0]
    const a = await reader(`del-a-${stamp}@test.invalid`)
    const b = await reader(`del-b-${stamp}@test.invalid`)
    const make = () =>
      payload.create({
        collection: 'alap',
        data: { kind: 'post', text: 'x', image: media.id, published: false, publishedAt: new Date().toISOString() },
      })
    const [one, two] = [await make(), await make()]
    await payload.create({ collection: 'likes', data: { user: a.id, alap: one.id } })
    await payload.create({ collection: 'likes', data: { user: a.id, alap: two.id } })
    await payload.create({ collection: 'likes', data: { user: b.id, alap: two.id } })
    await payload.create({ collection: 'bookmarks', data: { user: a.id, kind: 'book', target: 1 } })

    await payload.delete({ collection: 'alap', id: one.id })
    expect((await payload.count({ collection: 'likes', where: { alap: { equals: one.id } } })).totalDocs).toBe(0)

    await payload.delete({ collection: 'users', id: a.id })
    expect((await payload.count({ collection: 'bookmarks', where: { user: { equals: a.id } } })).totalDocs).toBe(0)
    expect((await payload.findByID({ collection: 'alap', id: two.id })).likeCount).toBe(1)
    await payload.delete({ collection: 'alap', id: two.id })
  })
})

describe('newsletter', () => {
  it('signs unsubscribe links', () => {
    const token = unsubscribeToken('a@b.c')
    expect(validUnsubscribe('A@B.C', token)).toBe(true)
    expect(validUnsubscribe('other@b.c', token)).toBe(false)
    expect(validUnsubscribe('a@b.c', 'x')).toBe(false)
  })

  it('puts the body and an unsubscribe link in the email', () => {
    const mail = renderNewsletter('a@b.c', 'বিষয়', plainToRichText('নতুন বই এসেছে'))
    expect(mail.html).toContain('নতুন বই এসেছে')
    expect(mail.html).toContain('/unsubscribe?e=a%40b.c')
    expect(mail.text).toContain('নতুন বই এসেছে')
    expect(mail.headers['List-Unsubscribe']).toContain('/unsubscribe/one-click?')
  })
})
