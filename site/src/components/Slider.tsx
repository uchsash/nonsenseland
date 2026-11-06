'use client'

import { useRef } from 'react'

import { t } from '@/i18n/bn'

import { ArrowLeft, ArrowRight } from './icons'

/** Horizontal row with native swipe/scroll and prev/next buttons on desktop. */
export function Slider({
  title,
  link,
  linkLabel = t.common.seeAll,
  variant,
  toolbar,
  children,
}: {
  title: string
  link?: string
  linkLabel?: string
  variant?: 'books'
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className={`section slider${variant ? ` ${variant}` : ''}`}>
      <div className="section-head">
        <h2>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {link ? <a href={link}>{linkLabel}</a> : null}
          <div className="slider-nav">
            <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label={t.common.previous}>
              <ArrowLeft />
            </button>
            <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label={t.common.next}>
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
      {toolbar}
      <div className="slider-track" ref={track}>
        {children}
      </div>
    </section>
  )
}
