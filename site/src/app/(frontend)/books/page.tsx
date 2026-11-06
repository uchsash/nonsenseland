import type { Metadata } from 'next'

import { BookCard } from '@/components/Cards'
import { getT } from '@/i18n/server'
import { listBooks } from '@/lib/data'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.nav.books }
}

export default async function BooksPage() {
  const t = await getT()
  const [library, published] = await Promise.all([listBooks('library'), listBooks('published')])

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>{t.nav.books}</h1>
      </header>
      {library.length ? (
        <section className="section" style={{ marginTop: 32 }}>
          <div className="section-head">
            <h2>{t.book.free}</h2>
          </div>
          <div className="grid books">
            {library.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      ) : null}
      {published.length ? (
        <section className="section">
          <div className="section-head">
            <h2>{t.book.published}</h2>
          </div>
          <div className="grid books">
            {published.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      ) : null}
      {!library.length && !published.length ? <p className="empty">{t.common.empty}</p> : null}
    </div>
  )
}
