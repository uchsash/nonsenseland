'use client'

import Link from 'next/link'

import { useT } from '@/i18n/client'
import type { Alap, Book } from '@/payload-types'

import { Img } from './Img'

/** Where “বইটি পড়ুন” goes: straight into the reader for books readable on the site. */
export const bookCardHref = (book: Book) =>
  book.online?.enabled ? `/books/${book.slug}/read/1` : `/books/${book.slug}`

/**
 * The face of a “book card” in খুচরো আলাপ: the cover as a tilted mockup in the square
 * area, the headline (নতুন বই চলে এসেছে!), the book's name and a “বইটি পড়ুন” link.
 * Uses the same boxes as a normal post, so the deck keeps its fixed height.
 */
export function AlapBookCard({ item }: { item: Alap }) {
  const t = useT()
  const book = typeof item.book === 'object' ? item.book : null
  if (!book) return null
  const byline = book.originalAuthor ?? ''
  return (
    <>
      <div className="deck-image book-mock">
        <div className="book-mock-cover">
          <Img media={book.cover} use={['cover']} sizes="240px" />
        </div>
      </div>
      <div className="deck-text book-card-text">
        <strong className="book-card-headline">{item.text}</strong>
        <span className="book-card-title">{book.title}</span>
        {byline ? <span className="book-card-by muted">{byline}</span> : null}
      </div>
      <Link
        href={bookCardHref(book)}
        className="deck-more book-card-link"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {t.alap.readBook} →
      </Link>
    </>
  )
}
