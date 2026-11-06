import Link from 'next/link'

import { t } from '@/i18n/bn'
import type { Article, Book, Category, Video } from '@/payload-types'
import { bnDate, bnNumber } from '@/utilities/bn'

import { Img } from './Img'
import { PlayIcon } from './icons'

const categoryName = (c: number | Category | null | undefined) => (typeof c === 'object' && c ? c.name : '')

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
  return (
    <Link href={`/articles/${article.slug}`} className="card">
      <div className="card-media">
        <Img media={article.cover} />
      </div>
      <div className="card-meta">
        {categoryName(article.category)}
        {article.readingTime ? ` · ${t.common.minRead(bnNumber(article.readingTime))}` : ''}
      </div>
      <h3 className="card-title">{article.title}</h3>
      {article.excerpt ? <p className="card-text">{article.excerpt}</p> : null}
      {article.publishedAt ? <div className="card-meta">{bnDate(article.publishedAt)}</div> : null}
    </Link>
  )
}

export function BookCard({ book }: { book: Book }) {
  const by = book.role === 'translator' && book.originalAuthor ? book.originalAuthor : null
  return (
    <Link href={`/books/${book.slug}`} className="card book-card">
      <div className="card-media">
        <Img media={book.cover} use={['cover']} sizes="(max-width: 560px) 45vw, 200px" />
      </div>
      <h3 className="card-title">{book.title}</h3>
      {by ? <div className="card-meta">{by}</div> : null}
      {book.print?.enabled && book.print.badge ? <span className="badge">{book.print.badge}</span> : null}
    </Link>
  )
}
