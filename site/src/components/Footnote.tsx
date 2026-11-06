'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { useT } from '@/i18n/client'
import { bnNumber } from '@/utilities/bn'

/**
 * A word with a footnote. Hover (mouse) previews the note; click or tap keeps it open
 * with a ✕ in the corner; Esc or a click outside closes it.
 */
export function Footnote({ n, note, children }: { n: number; note: string; children: React.ReactNode }) {
  const t = useT()
  const [state, setState] = useState<'closed' | 'preview' | 'open'>('closed')
  const wrap = useRef<HTMLSpanElement>(null)
  const pop = useRef<HTMLSpanElement>(null)
  const id = useId()
  const visible = state !== 'closed'

  // Esc and clicks outside close an opened note.
  useEffect(() => {
    if (state !== 'open') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setState('closed')
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setState('closed')
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [state])

  // Keep the pop-up inside the screen on wide layouts (phones use a bottom sheet).
  useLayoutEffect(() => {
    const el = pop.current
    if (!el || !visible) return
    el.style.removeProperty('--shift')
    const rect = el.getBoundingClientRect()
    const overflow = rect.right - (window.innerWidth - 12)
    if (overflow > 0 && window.innerWidth > 600) el.style.setProperty('--shift', `${-overflow}px`)
  }, [visible])

  const hover = () => matchMedia('(hover: hover)').matches

  return (
    <span
      className="fn"
      ref={wrap}
      onMouseEnter={() => hover() && state === 'closed' && setState('preview')}
      onMouseLeave={() => state === 'preview' && setState('closed')}
    >
      <button
        type="button"
        className="fn-ref"
        id={`fnref-${n}`}
        aria-expanded={visible}
        aria-controls={id}
        onClick={() => setState(state === 'open' ? 'closed' : 'open')}
      >
        {children}
        <sup>{bnNumber(n)}</sup>
        <span className="sr-only">
          , {t.book.notes} {bnNumber(n)}
        </span>
      </button>
      {visible ? (
        <span className={`fn-pop${state === 'open' ? ' is-open' : ''}`} id={id} role="note" ref={pop}>
          <span className="fn-num">{bnNumber(n)}</span>
          <span className="fn-text">{note}</span>
          {state === 'open' ? (
            <button type="button" className="fn-close" onClick={() => setState('closed')} aria-label={t.nav.close}>
              ✕
            </button>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
