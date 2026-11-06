import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { Reader } from '@/components/Reader'
import { FootnoteList } from '@/components/FootnoteList'
import { RichText } from '@/components/RichText'
import { getT } from '@/i18n/server'
import { getBook, getChapterList, getReadableChapter } from '@/lib/data'
import { bnNumber } from '@/utilities/bn'
import { indexFootnotes } from '@/utilities/footnotes'
import { takeAdBlocks } from '@/utilities/lexical'
import { colorClass } from '@/utilities/palette'

type Props = { params: Promise<{ slug: string; chapter: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter } = await params
  const book = await getBook(slug)
  if (!book) return {}
  const list = await getChapterList(book.id)
  const current = list.find((c) => c.order === Number(chapter))
  return {
    title: current ? `${current.title} — ${book.title}` : book.title,
    alternates: { canonical: `/books/${slug}/read/${chapter}` },
  }
}

export default async function ChapterPage({ params }: Props) {
  const t = await getT()
  const { slug, chapter } = await params
  const order = Number(chapter)
  const book = await getBook(slug)
  if (!book || !Number.isInteger(order)) notFound()

  const [list, content] = await Promise.all([getChapterList(book.id), getReadableChapter(book, order)])
  if (!content) notFound()

  const index = list.findIndex((c) => c.order === order)
  const prev = list[index - 1]
  const next = list[index + 1]
  const href = (o: number) => `/books/${book.slug}/read/${o}`
  const toc = list.map((c) => ({ title: c.title, href: href(c.order), current: c.order === order }))
  const title = list[index]?.title ?? ''

  return (
    <Reader
      toc={toc}
      prevHref={prev ? href(prev.order) : undefined}
      nextHref={next ? href(next.order) : undefined}
      position={{ book: book.slug!, chapter: order }}
    >
      <article className="reading-column">
        <header className="reading-head">
          <div className="card-meta">
            <Link href={`/books/${book.slug}`}>{book.title}</Link> · {t.book.chapter} {bnNumber(index + 1)}/
            {bnNumber(list.length)}
          </div>
          <h1 className={content === 'locked' ? undefined : colorClass(content.titleColor)}>{title}</h1>
        </header>

        {content === 'locked' ? (
          <p className="empty">{t.book.locked}</p>
        ) : (
          <ChapterText content={content.content} showAds={(book.online?.access ?? 'free') === 'free'} />
        )}

        <nav className="chapter-nav">
          {prev ? (
            <Link href={href(prev.order)} className="btn ghost">
              ← {t.common.previous}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={href(next.order)} className="btn">
              {t.common.next} →
            </Link>
          ) : (
            <Link href={`/books/${book.slug}`} className="btn ghost">
              {t.book.backToBook}
            </Link>
          )}
        </nav>
        {!next ? (
          <p className="muted" style={{ textAlign: 'center', marginTop: 32 }}>
            {t.book.finished}
          </p>
        ) : null}
      </article>
    </Reader>
  )
}

/** Chapter text; ads placed in the editor are shown only at the end, and never in paid books. */
function ChapterText({ content, showAds }: { content: Parameters<typeof RichText>[0]['data']; showAds: boolean }) {
  const [text, ads] = takeAdBlocks(content)
  return (
    <>
      <RichText data={text} />
      <FootnoteList index={indexFootnotes(text)} />
      {showAds
        ? ads.map((block, i) => {
            const ad = (block.fields as { ad?: number | { id: number } | null }).ad
            return <AdSlot key={i} slot="article-inline" adId={typeof ad === 'object' && ad ? ad.id : (ad ?? undefined)} />
          })
        : null}
    </>
  )
}
