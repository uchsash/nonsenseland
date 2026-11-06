import type { Metadata } from 'next'

import { BookShelf } from '@/components/BookShelf'
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
      {library.length ? <BookShelf title={t.book.free} books={library} layout="grid" /> : null}
      {published.length ? <BookShelf title={t.book.published} books={published} layout="grid" /> : null}
      {!library.length && !published.length ? <p className="empty">{t.common.empty}</p> : null}
    </div>
  )
}
