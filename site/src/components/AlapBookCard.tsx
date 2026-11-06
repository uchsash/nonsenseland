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
      {/* A ready-made poster in the brand style (as on the Facebook cover): the book standing
          on the orange waves, small outlined circles, “নতুন বই” with a dash, and the icon. */}
      <div className={`deck-image book-mock book-theme-${item.theme ?? 'sunset'}`}>
        <svg className="book-poster-waves" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="poster-wave-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--wave-1)" />
              <stop offset="1" stopColor="var(--wave-2)" />
            </linearGradient>
            <linearGradient id="poster-wave-b" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="var(--wave-1)" />
              <stop offset="1" stopColor="var(--wave-2)" />
            </linearGradient>
          </defs>
          <path d="M170 400 C 215 330 300 262 400 250 L 400 400 Z" fill="url(#poster-wave-a)" opacity="0.9" />
          <path d="M0 336 C 80 296 170 306 238 334 S 352 362 400 326 L 400 400 L 0 400 Z" fill="url(#poster-wave-b)" />
        </svg>
        <span className="book-poster-circle is-a" aria-hidden="true" />
        <span className="book-poster-circle is-b" aria-hidden="true" />
        <span className="book-poster-circle is-c" aria-hidden="true" />
        <span className="book-poster-badge">{t.alap.newBook}</span>
        <div className="book-3d">
          <div className="book-front">
            <Img media={book.cover} use={['cover']} sizes="240px" />
          </div>
          <div className="book-pages" aria-hidden="true" />
        </div>
        <img className="book-poster-icon" src="/brand/icon.svg" alt="" aria-hidden="true" />
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
