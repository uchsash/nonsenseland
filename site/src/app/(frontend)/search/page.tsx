import type { Metadata } from 'next'

import { ArticleCard, BookCard, VideoCard } from '@/components/Cards'
import { fill } from '@/i18n/bn'
import { getT } from '@/i18n/server'
import { searchAll } from '@/lib/data'
import { bnNumber } from '@/utilities/bn'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.search.title, robots: { index: false } }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getT()
  const q = ((await searchParams).q ?? '').trim().slice(0, 100)
  const results = q ? await searchAll(q) : null
  const count = results ? results.articles.length + results.videos.length + results.books.length : 0

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>{t.search.title}</h1>
      </header>
      <form action="/search" className="inline-form" role="search" style={{ maxWidth: 640 }}>
        <label className="sr-only" htmlFor="q">
          {t.search.placeholder}
        </label>
        <input id="q" className="input" name="q" defaultValue={q} placeholder={t.search.placeholder} autoFocus />
        <button className="btn">{t.search.title}</button>
      </form>

      {results ? (
        <>
          <p className="muted">{count ? fill(t.search.results, { n: bnNumber(count) }) : t.search.none}</p>
          {results.articles.length ? (
            <section className="result-group">
              <h2>{t.nav.articles}</h2>
              <div className="grid">
                {results.articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          ) : null}
          {results.videos.length ? (
            <section className="result-group">
              <h2>{t.nav.videos}</h2>
              <div className="grid">
                {results.videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </section>
          ) : null}
          {results.books.length ? (
            <section className="result-group">
              <h2>{t.nav.books}</h2>
              <div className="grid books">
                {results.books.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
