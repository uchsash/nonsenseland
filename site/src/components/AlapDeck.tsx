'use client'

import { useRef, useState } from 'react'

import { useT } from '@/i18n/client'
import type { Alap } from '@/payload-types'
import { bnDate, bnNumber } from '@/utilities/bn'

import { Img } from './Img'
import { ArrowLeft, ArrowRight } from './icons'

const SWIPE = 70 // px needed to move to the next card
const FLY_MS = 220

/**
 * খুচরো আলাপ as a stack of cards. Two cards always peek out from behind.
 * Swipe sideways (or use the arrows / ← → keys); it loops endlessly.
 * Vertical movement is left to the page, so scrolling keeps working on phones.
 */
export function AlapDeck({ items }: { items: Alap[] }) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [dx, setDx] = useState(0)
  const [flying, setFlying] = useState<0 | 1 | -1>(0)
  const start = useRef<{ x: number; y: number; id: number; horizontal: boolean | null } | null>(null)

  if (!items.length) return <p className="empty">{t.alap.empty}</p>
  const n = items.length
  const item = items[((index % n) + n) % n]

  const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  /** dir 1 = next (card leaves to the left), -1 = previous. */
  const go = (dir: 1 | -1) => {
    if (flying) return
    if (reduced()) {
      setIndex((i) => i + dir)
      setDx(0)
      return
    }
    setFlying(dir)
    setTimeout(() => {
      setIndex((i) => i + dir)
      setFlying(0)
      setDx(0)
    }, FLY_MS)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (flying || (e.pointerType === 'mouse' && e.button !== 0)) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current
    if (!s || s.id !== e.pointerId) return
    const mx = e.clientX - s.x
    const my = e.clientY - s.y
    if (s.horizontal === null && Math.abs(mx) + Math.abs(my) > 8) {
      s.horizontal = Math.abs(mx) > Math.abs(my)
      if (s.horizontal) {
        try {
          // Keep following the finger even if it slides off the card.
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {
          // Not available for this pointer; the swipe still works without it.
        }
      }
    }
    if (s.horizontal) setDx(mx)
  }
  const onPointerEnd = () => {
    const s = start.current
    start.current = null
    if (!s?.horizontal) return
    if (dx <= -SWIPE) go(1)
    else if (dx >= SWIPE) go(-1)
    else setDx(0)
  }

  const offset = flying ? flying * -130 : 0
  const style: React.CSSProperties = flying
    ? { transform: `translateX(${offset}%) rotate(${flying * -8}deg)`, opacity: 0, transition: `transform ${FLY_MS}ms ease-in, opacity ${FLY_MS}ms ease-in` }
    : dx
      ? { transform: `translateX(${dx}px) rotate(${dx / 25}deg)`, transition: 'none' }
      : {}

  return (
    <div className="deck-wrap">
      <div
        className="deck"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={t.alap.title}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
      >
        {/* Two cards always visible behind, so it reads as a stack. */}
        <div className="deck-back deck-back-2" aria-hidden="true" />
        <div className="deck-back deck-back-1" aria-hidden="true" />
        <article
          key={index}
          className="deck-card"
          style={style}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          aria-live="polite"
        >
          {item.image && typeof item.image === 'object' ? (
            <div className="deck-image">
              <Img media={item.image} use={['square']} sizes="(max-width: 600px) 90vw, 480px" />
            </div>
          ) : null}
          <p className="deck-text">{item.text}</p>
          <time className="deck-date" dateTime={item.publishedAt}>
            {bnDate(item.publishedAt)}
          </time>
        </article>
      </div>
      <div className="deck-nav">
        <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={t.alap.previous}>
          <ArrowLeft />
        </button>
        <span className="muted" aria-hidden="true">
          {bnNumber((((index % n) + n) % n) + 1)} / {bnNumber(n)}
        </span>
        <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={t.alap.next}>
          <ArrowRight />
        </button>
      </div>
      <p className="deck-hint muted">{t.alap.hint}</p>
    </div>
  )
}
