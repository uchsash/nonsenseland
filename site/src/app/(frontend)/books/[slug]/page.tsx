import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { ContinueReading } from '@/components/ContinueReading'
import { KindleForm } from '@/components/Forms'
import { Img } from '@/components/Img'
import { Share } from '@/components/Share'
import { TopicLinks } from '@/components/TopicLinks'
import { getT } from '@/i18n/server'
import { getBook, getChapterList, getSettings } from '@/lib/data'
import { emailConfigured } from '@/lib/email'
import { docMetadata } from '@/lib/seo'
import type { BookFile } from '@/payload-types'
import { bnNumber } from '@/utilities/bn'
import { colorClass } from '@/utilities/palette'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const book = await getBook(slug)
  return docMetadata(book, { path: `/books/${slug}`, description: book?.description, image: book?.cover })
}

export default async function BookPage({ params }: Props) {
  const t = await getT()
  const { slug } = await params
  const [book, settings] = await Promise.all([getBook(slug), getSettings()])
  if (!book) notFound()

  const online = book.online?.enabled
  const chapters = online ? await getChapterList(book.id) : []
  const isFree = !online || book.online?.access === 'free'
  const epub = book.ebook?.epub as BookFile | null
  const canDownload = isFree && epub && book.ebook?.allowDownload
  const canKindle = isFree && epub && book.ebook?.allowKindle && emailConfigured()
  const print = book.print?.enabled ? book.print : null
  const titles = Object.fromEntries(chapters.map((c) => [c.order, c.title]))

  return (
    <div className="wrap">
      <div className="book-hero">
        <div className="cover">
          <Img media={book.cover} use={['cover']} sizes="260px" priority />
        </div>
        <div>
          <h1 className={colorClass(book.titleColor)}>{book.title}</h1>
          <div className="sub">
            {[
              book.subtitle,
              book.originalAuthor ? `${t.book.originalAuthor}: ${book.originalAuthor}` : null,
              `${book.role === 'translator' ? t.book.translator : t.book.writer}: ${settings.ownerName}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <p className="desc">{book.description}</p>

          <div className="book-actions">
            <ContinueReading book={book.slug!} titles={titles} />
            {chapters.length ? (
              <Link href={`/books/${book.slug}/read/1`} className="btn">
                {t.book.startReading}
              </Link>
            ) : null}
            {canDownload ? (
              <a href={`/download/${book.slug}`} className="btn ghost" download>
                {t.book.download}
              </a>
            ) : null}
          </div>

          {canKindle ? (
            <KindleForm
              bookId={book.id}
              sender={process.env.KINDLE_FROM?.match(/<(.+)>/)?.[1] ?? process.env.KINDLE_FROM ?? ''}
            />
          ) : null}

          {print?.buyLinks?.length ? (
            <div style={{ marginTop: 28 }}>
              <strong>{t.book.buyFrom}</strong>
              {print.badge ? <span className="badge"> · {print.badge}</span> : null}
              <div className="buy-links">
                {print.buyLinks.map((l) => (
                  <a key={l.url} href={l.url} className="btn ghost" target="_blank" rel="noopener noreferrer">
                    {l.store}
                    {l.price ? ` · ৳${bnNumber(l.price)}` : ''}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="facts">
            {print?.publisher ? (
              <span>
                {t.book.publisher}: {print.publisher}
              </span>
            ) : null}
            {print?.pages ? (
              <span>
                {t.book.pages}: {bnNumber(print.pages)}
              </span>
            ) : null}
            {print?.isbn ? <span>ISBN: {print.isbn}</span> : null}
          </div>
          <TopicLinks topics={book.topics} />
          <Share path={`/books/${book.slug}`} title={book.title} />
        </div>
      </div>

      {chapters.length ? (
        <section className="section" style={{ maxWidth: 680 }}>
          <div className="section-head">
            <h2>{t.book.chapters}</h2>
          </div>
          <ol className="toc">
            {chapters.map((c) => (
              <li key={c.id}>
                <Link href={`/books/${book.slug}/read/${c.order}`}>
                  <span className="num">{bnNumber(c.order)}</span>
                  {c.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <AdSlot slot="book" />
    </div>
  )
}
