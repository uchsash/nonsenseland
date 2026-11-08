'use client'

import { useEffect } from 'react'

import { useT } from '@/i18n/client'
import { bnNumber } from '@/utilities/bn'

import { useAccount } from './AccountProvider'
import { BookmarkIcon, HeartIcon } from './icons'

export function LikeButton({ id, initial = 0 }: { id: number; initial?: number | null }) {
  const t = useT()
  const { likes, counts, loadCounts, toggleLike } = useAccount()
  useEffect(loadCounts, [loadCounts])
  const liked = likes.has(id)
  const count = counts[id] ?? initial ?? 0
  return (
    <button
      type="button"
      className={`like-btn${liked ? ' is-on' : ''}`}
      aria-pressed={liked}
      aria-label={t.alap.like}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => toggleLike(id)}
    >
      <HeartIcon size={18} filled={liked} />
      {count ? <span>{bnNumber(count)}</span> : null}
    </button>
  )
}

export function BookmarkButton({
  kind,
  target,
  withLabel = false,
}: {
  kind: 'article' | 'book' | 'chapter'
  target: number
  withLabel?: boolean
}) {
  const t = useT()
  const { bookmarks, toggleBookmark } = useAccount()
  const saved = bookmarks.has(`${kind}:${target}`)
  const label = saved ? t.account.bookmarked : t.account.bookmark
  return (
    <button
      type="button"
      className={withLabel ? 'btn ghost bookmark-btn' : 'icon-btn'}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={() => toggleBookmark(kind, target)}
    >
      <BookmarkIcon filled={saved} />
      {withLabel ? <span>{label}</span> : null}
    </button>
  )
}
