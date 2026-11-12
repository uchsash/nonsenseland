import { getT } from '@/i18n/server'
import { payloadClient } from '@/lib/data'
import type { Ad, Book } from '@/payload-types'
import { bnNumber } from '@/utilities/bn'

import { Img } from './Img'

/**
 * A designed book ad made from the book itself: its cover as a 3D book, a headline and a
 * line of copy written for the place it appears, and a buy button with the shop's price.
 * Real text and HTML, so it fits any screen: side by side on wide screens, stacked on phones.
 */
export async function BookPromo({ ad, label, compact = false }: { ad: Ad; label: string; compact?: boolean }) {
  const bookId = typeof ad.book === 'object' ? ad.book?.id : ad.book
  if (!bookId) return null
  // The ad list loads books shallowly; the cover image needs one level more.
  const book = (await (await payloadClient())
    .findByID({ collection: 'books', id: bookId, depth: 1 })
    .catch(() => null)) as Book | null
  if (!book || book._status !== 'published') return null
  const shop = book.print?.enabled ? book.print.buyLinks?.[0] : undefined
  const theme = ad.theme ?? 'night'
  const t = await getT()
  const byline = book.originalAuthor ?? ''
  // অনুবাদ or মৌলিক, small in a corner; the kicker line is kept for selling the book.
  const kind = book.role === 'translator' ? t.book.filterTranslation : t.book.filterOriginal

  return (
    <aside className={`ad book-promo promo-${theme}${compact ? ' promo-compact' : ''}`} aria-label={label}>
      <span className="promo-label">{label}</span>
      <span className="promo-kind">{kind}</span>
      <a href={`/books/${book.slug}`} className="promo-art" tabIndex={-1} aria-hidden="true">
        <span className="promo-glow" />
        <span className="book-3d">
          <span className="book-front">
            <Img media={book.cover} use={['cover']} sizes="220px" />
          </span>
          <span className="book-pages" />
        </span>
      </a>
      <div className="promo-body">
        {ad.kicker ? <p className="promo-kicker">{ad.kicker}</p> : null}
        <h3 className="promo-headline">{ad.headline || book.title}</h3>
        {ad.text ? <p className="promo-text">{ad.text}</p> : null}
        <p className="promo-book">
          <a href={`/books/${book.slug}`}>{book.title}</a>
          {byline ? <span> · {byline}</span> : null}
        </p>
        <div className="promo-actions">
          {shop ? (
            <a href={shop.url} className="promo-cta" target="_blank" rel="noopener sponsored">
              {shop.store} থেকে কিনুন{shop.price ? ` · ৳${bnNumber(shop.price)}` : ''}
            </a>
          ) : (
            <a href={`/books/${book.slug}`} className="promo-cta">
              বইটি দেখুন
            </a>
          )}
          {book.print?.badge ? <span className="promo-badge">{book.print.badge}</span> : null}
        </div>
      </div>
    </aside>
  )
}
