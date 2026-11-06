'use client'

import { useState } from 'react'

import { useT } from '@/i18n/client'
import type { Book } from '@/payload-types'

import { BookCard } from './Cards'
import { Slider } from './Slider'

type Origin = 'writer' | 'translator'
type Genre = 'fiction' | 'nonfiction'

/**
 * A row (slider) or grid of books with two independent filters:
 * মৌলিক / অনুবাদ (from the book's role) and ফিকশন / নন-ফিকশন (from its genre).
 * A pair of chips only shows when the books include both kinds.
 */
export function BookShelf({
  title,
  books,
  layout,
  link,
}: {
  title: string
  books: Book[]
  layout: 'slider' | 'grid'
  link?: string
}) {
  const t = useT()
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [genre, setGenre] = useState<Genre | null>(null)

  const has = (test: (b: Book) => boolean) => books.some(test)
  const showOrigin = has((b) => b.role === 'writer') && has((b) => b.role === 'translator')
  const showGenre = has((b) => b.genre === 'fiction') && has((b) => b.genre === 'nonfiction')

  const shown = books.filter((b) => (!origin || b.role === origin) && (!genre || b.genre === genre))

  const chip = <V,>(label: string, value: V, current: V | null, set: (v: V | null) => void) => (
    <button
      key={label}
      type="button"
      className="chip"
      aria-pressed={current === value}
      onClick={() => set(current === value ? null : value)}
    >
      {label}
    </button>
  )

  const filters =
    showOrigin || showGenre ? (
      <div className="chips" role="group" aria-label={title}>
        <button
          type="button"
          className="chip"
          aria-pressed={!origin && !genre}
          onClick={() => {
            setOrigin(null)
            setGenre(null)
          }}
        >
          {t.common.all}
        </button>
        {showOrigin ? (
          <>
            {chip(t.book.filterOriginal, 'writer' as Origin, origin, setOrigin)}
            {chip(t.book.filterTranslation, 'translator' as Origin, origin, setOrigin)}
          </>
        ) : null}
        {showOrigin && showGenre ? <span className="chip-divider" aria-hidden="true" /> : null}
        {showGenre ? (
          <>
            {chip(t.book.filterFiction, 'fiction' as Genre, genre, setGenre)}
            {chip(t.book.filterNonfiction, 'nonfiction' as Genre, genre, setGenre)}
          </>
        ) : null}
      </div>
    ) : null

  const cards = shown.map((b) => <BookCard key={b.id} book={b} />)
  const empty = <p className="empty">{t.book.filterEmpty}</p>

  if (layout === 'slider') {
    return (
      <Slider title={title} link={link} variant="books" toolbar={filters}>
        {cards.length ? cards : empty}
      </Slider>
    )
  }
  return (
    <section className="section" style={{ marginTop: 32 }}>
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      {filters}
      {cards.length ? <div className="grid books">{cards}</div> : empty}
    </section>
  )
}
