import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { Reader } from '@/components/Reader'
import { FootnoteList } from '@/components/FootnoteList'
import { RichText } from '@/components/RichText'
import { getT } from '@/i18n/server'
import { fill } from '@/i18n/bn'
import { currentUser } from '@/lib/account'
import { getBook, getChapterList, getReadableChapter, type LockReason } from '@/lib/data'
import type { Book } from '@/payload-types'
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

  const [list, content] = await Promise.all([
    getChapterList(book.id),
    getReadableChapter(book, order, currentUser),
  ])
  if (!content) notFound()

  const index = list.findIndex((c) => c.order === order)
  const prev = list[index - 1]
  const next = list[index + 1]
  const href = (o: number) => `/books/${book.slug}/read/${o}`
  const toc = list.map((c) => ({ title: c.title, href: href(c.order), current: c.order === order }))
  const title = list[index]?.title ?? ''
  const locked = 'locked' in content ? content.locked : null

  return (
    <Reader
      toc={toc}
      prevHref={prev ? href(prev.order) : undefined}
      nextHref={next ? href(next.order) : undefined}
      position={{ book: book.slug!, chapter: order }}
      bookmark={list[index] ? { kind: 'chapter', target: list[index].id } : undefined}
    >
      <article className="reading-column">
        <header className="reading-head">
          <div className="card-meta">
            <Link href={`/books/${book.slug}`}>{book.title}</Link> · {t.book.chapter}{' '}
            {bnNumber(index + 1)}/{bnNumber(list.length)}
          </div>
          <h1 className={'locked' in content ? undefined : colorClass(content.titleColor)}>
            {title}
          </h1>
        </header>

        {'locked' in content ? (
          <Locked book={book} reason={locked!} here={href(order)} />
        ) : (
          <ChapterText
            content={content.content}
            showAds={(book.online?.access ?? 'free') === 'free'}
          />
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

const WORDS = [
  '',
  'একটি',
  'দুটি',
  'তিনটি',
  'চারটি',
  'পাঁচটি',
  'ছয়টি',
  'সাতটি',
  'আটটি',
  'নয়টি',
  'দশটি',
]

/** “তিনটি” rather than “৩টি” for small counts. */
const countWord = (n: number) => WORDS[n] ?? `${bnNumber(n)}টি`

/** What a closed chapter shows: log in for members-only books; the buy links for paid ones. */
async function Locked({ book, reason, here }: { book: Book; reason: LockReason; here: string }) {
  const t = await getT()
  const next = encodeURIComponent(here)
  const signedIn = Boolean(await currentUser())
  if (reason === 'login') {
    return (
      <div className="locked-box">
        <p>{t.book.lockedLogin}</p>
        <div className="book-actions">
          <Link href={`/login?next=${next}`} className="btn">
            {t.account.login}
          </Link>
          <Link href={`/signup?next=${next}`} className="btn ghost">
            {t.account.createAccount}
          </Link>
        </div>
      </div>
    )
  }
  const links = book.print?.enabled ? (book.print.buyLinks ?? []) : []
  return (
    <div className="locked-box">
      <p>{fill(t.book.lockedBuy, { n: countWord(book.online?.sampleChapters ?? 0) })}</p>
      {links.length ? (
        <>
          <p>{t.book.lockedBuyLinks}</p>
          <div className="buy-links">
            {links.map((l) => (
              <a key={l.url} href={l.url} className="btn" target="_blank" rel="noopener noreferrer">
                {l.store}
                {l.price ? ` · ৳${bnNumber(l.price)}` : ''}
              </a>
            ))}
          </div>
        </>
      ) : (
        <p className="muted">{t.book.lockedSoon}</p>
      )}
      {signedIn ? null : (
        <p className="muted">
          <Link href={`/login?next=${next}`}>{t.book.lockedOwned}</Link>
        </p>
      )}
    </div>
  )
}

/** Chapter text; ads placed in the editor are shown only at the end, and never in paid books. */
function ChapterText({
  content,
  showAds,
}: {
  content: Parameters<typeof RichText>[0]['data']
  showAds: boolean
}) {
  const [text, ads] = takeAdBlocks(content)
  return (
    <>
      <RichText data={text} />
      <FootnoteList index={indexFootnotes(text)} />
      {showAds
        ? ads.map((block, i) => {
            const ad = (block.fields as { ad?: number | { id: number } | null }).ad
            return (
              <AdSlot
                key={i}
                slot="article-inline"
                adId={typeof ad === 'object' && ad ? ad.id : (ad ?? undefined)}
              />
            )
          })
        : null}
    </>
  )
}
