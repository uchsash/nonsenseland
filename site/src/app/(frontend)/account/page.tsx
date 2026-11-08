import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LogoutButton, PasswordForm, ProfileForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'
import { currentUser } from '@/lib/account'
import { payloadClient } from '@/lib/data'
import type { Book } from '@/payload-types'
import { bnNumber } from '@/utilities/bn'

export const metadata: Metadata = { title: 'আমার অ্যাকাউন্ট', robots: { index: false, follow: false } }

type Saved = { key: string; title: string; href: string }

/** Turns bookmarks into titles and links; anything since deleted or unpublished is dropped. */
async function savedItems(userId: number): Promise<Saved[]> {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'bookmarks',
    where: { user: { equals: userId } },
    sort: '-createdAt',
    limit: 200,
    depth: 0,
    pagination: false,
  })
  const ids = (kind: string) => docs.filter((b) => b.kind === kind).map((b) => b.target)
  const [articles, books, chapters] = await Promise.all([
    payload.find({
      collection: 'articles',
      where: { and: [{ id: { in: ids('article') } }, { _status: { equals: 'published' } }] },
      limit: 200,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'books',
      where: { and: [{ id: { in: ids('book') } }, { _status: { equals: 'published' } }] },
      limit: 200,
      depth: 0,
      pagination: false,
    }),
    payload.find({ collection: 'chapters', where: { id: { in: ids('chapter') } }, limit: 200, depth: 1, pagination: false }),
  ])
  const found = new Map<string, Saved>()
  for (const a of articles.docs) found.set(`article:${a.id}`, { key: `article:${a.id}`, title: a.title, href: `/articles/${a.slug}` })
  for (const b of books.docs) found.set(`book:${b.id}`, { key: `book:${b.id}`, title: b.title, href: `/books/${b.slug}` })
  for (const c of chapters.docs) {
    const book = c.book as Book
    if (book?._status !== 'published') continue
    found.set(`chapter:${c.id}`, {
      key: `chapter:${c.id}`,
      title: `${book.title}: ${c.title}`,
      href: `/books/${book.slug}/read/${c.order}`,
    })
  }
  return docs.flatMap((b) => found.get(`${b.kind}:${b.target}`) ?? [])
}

export default async function AccountPage() {
  const user = await currentUser()
  if (!user) redirect('/login?next=%2Faccount')
  const t = await getT()
  const payload = await payloadClient()
  const [saved, progress, subscriber] = await Promise.all([
    savedItems(user.id),
    payload.find({
      collection: 'reading-progress',
      where: { user: { equals: user.id } },
      sort: '-savedAt',
      limit: 20,
      depth: 1,
      pagination: false,
    }),
    payload.find({ collection: 'subscribers', where: { email: { equals: user.email } }, limit: 1, depth: 0 }),
  ])
  const reading = progress.docs.filter((p) => (p.book as Book | null)?._status === 'published')
  const newsletter = Boolean(subscriber.docs[0] && !subscriber.docs[0].unsubscribedAt)

  return (
    <div className="wrap account">
      <header className="page-head">
        <h1>{t.account.title}</h1>
        <p className="muted">{user.email}</p>
      </header>

      <section className="account-section">
        <h2>{t.account.reading}</h2>
        {reading.length ? (
          <ul className="account-list">
            {reading.map((p) => {
              const book = p.book as Book
              return (
                <li key={p.id}>
                  <Link href={`/books/${book.slug}/read/${p.chapterNumber}`}>{book.title}</Link>
                  <span className="muted">
                    {t.book.chapter} {bnNumber(p.chapterNumber ?? 1)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted">{t.account.noReading}</p>
        )}
      </section>

      <section className="account-section">
        <h2>{t.account.saved_items}</h2>
        {saved.length ? (
          <ul className="account-list">
            {saved.map((s) => (
              <li key={s.key}>
                <Link href={s.href}>{s.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t.account.noSaved}</p>
        )}
      </section>

      <section className="account-section">
        <h2>{t.account.settings}</h2>
        <ProfileForm name={user.name ?? ''} kindle={user.kindleEmail ?? ''} newsletter={newsletter} />
      </section>

      <section className="account-section">
        <h2>{t.account.changePassword}</h2>
        <PasswordForm />
      </section>

      <LogoutButton />
    </div>
  )
}
