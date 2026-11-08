import type { Metadata } from 'next'

import { LikeButton } from '@/components/AccountButtons'
import { AlapBookCard } from '@/components/AlapBookCard'
import { Img } from '@/components/Img'
import { Pager } from '@/components/ListPage'
import { getT } from '@/i18n/server'
import { alapFeed, getPinnedAlap } from '@/lib/data'
import type { Alap } from '@/payload-types'
import { bnDate } from '@/utilities/bn'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.alap.title }
}

/** One post in the feed: the whole photo and the whole text (no cropping, no “আরও পড়ুন”). */
function FeedPost({ item }: { item: Alap }) {
  return (
    <article className="feed-post">
      {item.kind === 'book' ? (
        <div className="feed-book">
          <AlapBookCard item={item} />
        </div>
      ) : (
        <>
          {item.image && typeof item.image === 'object' ? (
            <div className="feed-image">
              <Img media={item.image} use={[]} />
            </div>
          ) : null}
          <p className="feed-text">{item.text}</p>
        </>
      )}
      <div className="deck-foot">
        <time className="deck-date" dateTime={item.publishedAt}>
          {bnDate(item.publishedAt)}
        </time>
        <LikeButton id={item.id} initial={item.likeCount} />
      </div>
    </article>
  )
}

/** খুচরো আলাপ as a feed, newest first; the pinned card stays on top of the first page. */
export default async function AlapPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1)
  const [t, pinned, feed] = await Promise.all([getT(), getPinnedAlap(), alapFeed(page)])
  const items = page === 1 && pinned ? [pinned, ...feed.docs] : feed.docs

  return (
    <div className="wrap feed">
      <header className="page-head">
        <h1>{t.alap.title}</h1>
      </header>
      {items.length ? items.map((item) => <FeedPost key={item.id} item={item} />) : <p className="empty">{t.alap.empty}</p>}
      <Pager page={page} totalPages={feed.totalPages} href={(p) => (p > 1 ? `/alap?page=${p}` : '/alap')} />
    </div>
  )
}
