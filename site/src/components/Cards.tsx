'use client'

import Link from 'next/link'

import { fill } from '@/i18n/bn'
import { useT } from '@/i18n/client'
import type { Article, Book, Category, Video } from '@/payload-types'
import { ebookPrice } from '@/utilities/price'
import { bnDate, bnNumber } from '@/utilities/bn'

import { Img } from './Img'
import { PlayIcon } from './icons'

const categoryName = (c: number | Category | null | undefined) =>
  typeof c === 'object' && c ? c.name : ''

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/videos/${video.slug}`} className="card">
      <div className="card-media">
        <Img media={video.thumbnail} />
        <span className="play-dot">
          <PlayIcon />
        </span>
        {video.duration ? <span className="card-badge">{bnNumber(video.duration)}</span> : null}
      </div>
      <div className="card-meta">{categoryName(video.category)}</div>
      <h3 className="card-title">{video.title}</h3>
    </Link>
  )
}

/** Lists fetch articles without their body, so cards don't need `content`. */
export function ArticleCard({ article }: { article: Omit<Article, 'content'> }) {
  const t = useT()
  return (
    <Link href={`/articles/${article.slug}`} className="card">
      <div className="card-media">
        <Img media={article.cover} />
      </div>
      <div className="card-meta">
        {categoryName(article.category)}
        {article.readingTime
          ? ` · ${fill(t.common.minRead, { n: bnNumber(article.readingTime) })}`
          : ''}
      </div>
      <h3 className="card-title">{article.title}</h3>
      {article.excerpt ? <p className="card-text">{article.excerpt}</p> : null}
      {article.publishedAt ? <div className="card-meta">{bnDate(article.publishedAt)}</div> : null}
    </Link>
  )
}

/** ফ্রি, or the e-book price (with the old price struck through during a sale), on the cover. */
function PriceTag({ book }: { book: Book }) {
  const t = useT()
  const price = ebookPrice(book)
  if (!price) return null
  if (price.free) return <span className="price-tag is-free">{t.book.priceFree}</span>
  return (
    <span className="price-tag">
      {price.was ? <s>৳{bnNumber(price.was)}</s> : null}৳{bnNumber(price.price)}
    </span>
  )
}

export function BookCard({ book, showPrice = false }: { book: Book; showPrice?: boolean }) {
  const by = book.role === 'translator' && book.originalAuthor ? book.originalAuthor : null
  return (
    <Link href={`/books/${book.slug}`} className="card book-card">
      <div className="card-media">
        <Img media={book.cover} use={['cover']} sizes="(max-width: 560px) 45vw, 200px" />
        {showPrice ? <PriceTag book={book} /> : null}
      </div>
      <h3 className="card-title">{book.title}</h3>
      {by ? <div className="card-meta">{by}</div> : null}
      {book.print?.enabled && book.print.badge ? (
        <span className="badge">{book.print.badge}</span>
      ) : null}
    </Link>
  )
}
