'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useT } from '@/i18n/client'
import { bnNumber } from '@/utilities/bn'

import { CloseIcon, ListIcon } from './icons'
import { BookmarkButton } from './AccountButtons'
import { queueProgress, whenProgressReady } from './progressSync'
import { parseStored, setStored, useStored } from './useStored'

type Theme = 'auto' | 'light' | 'sepia' | 'dark'
type Settings = {
  theme: Theme
  font: 'serif' | 'sans'
  size: number
  spacing: 'tight' | 'normal' | 'loose'
  width: 'narrow' | 'normal' | 'wide'
  paragraph: 'gap' | 'indent'
  align: 'justify' | 'left'
}

const DEFAULTS: Settings = {
  theme: 'auto',
  font: 'serif',
  size: 19,
  spacing: 'normal',
  width: 'normal',
  paragraph: 'gap',
  align: 'justify',
}
const LINE = { tight: 1.6, normal: 1.85, loose: 2.1 }
const WIDTH = { narrow: '580px', normal: '680px', wide: '820px' }
const STORE = 'nl-reader'

type Option<V> = { value: V; label: string; className?: string }

/** A row of mutually exclusive buttons (e.g. white / sepia / dark). */
function Seg<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V
  options: Option<V>[]
  onChange: (value: V) => void
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.className}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export type TocItem = { title: string; href: string; current?: boolean }

/**
 * Wraps an article or chapter: reading settings behind one “Aa” button, a progress
 * bar, chapter list, arrow-key navigation and (for books) remembering the place.
 */
export function Reader({
  children,
  toc,
  prevHref,
  nextHref,
  position,
  bookmark,
}: {
  children: React.ReactNode
  toc?: TocItem[]
  prevHref?: string
  nextHref?: string
  /** For books: where to remember the reading place. */
  position?: { book: string; chapter: number }
  bookmark?: { kind: 'article' | 'chapter'; target: number }
}) {
  const t = useT()
  const router = useRouter()
  const raw = useStored(STORE)
  const settings = useMemo<Settings>(() => ({ ...DEFAULTS, ...parseStored<Partial<Settings>>(raw, {}) }), [raw])
  const [panel, setPanel] = useState<'settings' | 'toc' | null>(null)
  const [progress, setProgress] = useState(0)
  const body = useRef<HTMLDivElement>(null)

  const update = (patch: Partial<Settings>) => setStored(STORE, JSON.stringify({ ...settings, ...patch }))

  // The reader theme temporarily overrides the site theme.
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') delete root.dataset.reader
    else root.dataset.reader = settings.theme
    return () => {
      delete root.dataset.reader
    }
  }, [settings.theme])

  // Progress bar and remembering the place.
  const posKey = position ? `nl-pos-${position.book}` : null
  const lastSave = useRef(0)
  // Nothing is saved until the old place has been restored, or opening a chapter would erase it.
  const restored = useRef(false)
  const onScroll = useCallback(() => {
    const el = body.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const total = rect.height - window.innerHeight
    const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
    setProgress(ratio)
    // Save the place at most twice a second.
    if (posKey && position && restored.current && Date.now() - lastSave.current > 500) {
      lastSave.current = Date.now()
      const place = { chapter: position.chapter, ratio, at: Date.now() }
      try {
        localStorage.setItem(posKey, JSON.stringify(place))
      } catch {}
      queueProgress(position.book, place)
    }
  }, [posKey, position])

  useEffect(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // Return to the saved place when reopening the same chapter.
  useEffect(() => {
    restored.current = false
    if (!posKey || !position || location.hash) {
      restored.current = true
      return
    }
    let cancelled = false
    // Wait briefly for the place saved on another device.
    void Promise.race([whenProgressReady(), new Promise((r) => setTimeout(r, 2500))]).then(() => {
      if (cancelled) return
      try {
        const saved = JSON.parse(localStorage.getItem(posKey) ?? 'null')
        if (window.scrollY < 80 && saved?.chapter === position.chapter && saved.ratio > 0.02 && saved.ratio < 0.98) {
          const el = body.current
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY
            window.scrollTo({ top: top + saved.ratio * (el.offsetHeight - window.innerHeight) })
          }
        }
      } catch {}
      restored.current = true
    })
    return () => {
      cancelled = true
    }
    // Only on first open of this chapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey, position?.chapter])

  // ← → keys move between chapters.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]') || e.altKey || e.metaKey || e.ctrlKey) return
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref)
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref)
      if (e.key === 'Escape') setPanel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextHref, prevHref, router])

  const style = {
    '--r-font': settings.font === 'serif' ? 'var(--serif)' : 'var(--ui)',
    '--r-size': `${settings.size}px`,
    '--r-line': LINE[settings.spacing],
    '--r-width': WIDTH[settings.width],
  } as React.CSSProperties

  return (
    <div className="reading" style={style} data-paragraph={settings.paragraph} data-align={settings.align}>
      <div className="progress" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      <div ref={body}>{children}</div>

      <div className="reader-tools">
        {bookmark ? <BookmarkButton kind={bookmark.kind} target={bookmark.target} /> : null}
        {toc?.length ? (
          <button
            type="button"
            onClick={() => setPanel(panel === 'toc' ? null : 'toc')}
            aria-label={t.book.contents}
            aria-expanded={panel === 'toc'}
          >
            <ListIcon />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPanel(panel === 'settings' ? null : 'settings')}
          aria-label={t.reader.settings}
          aria-expanded={panel === 'settings'}
        >
          Aa
        </button>
      </div>

      {panel ? (
        <div className="panel" role="dialog" aria-label={panel === 'toc' ? t.book.contents : t.reader.settings}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{panel === 'toc' ? t.book.contents : t.reader.settings}</h3>
            <button type="button" className="icon-btn" onClick={() => setPanel(null)} aria-label={t.nav.close}>
              <CloseIcon size={18} />
            </button>
          </div>

          {panel === 'toc' ? (
            <ol className="toc">
              {toc!.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={() => setPanel(null)}
                  >
                    <span className="num">{bnNumber(i + 1)}</span>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <div className="panel-row">
                <span>{t.reader.theme}</span>
                <Seg
                  value={settings.theme}
                  onChange={(theme) => update({ theme })}
                  options={[
                    { value: 'light', label: t.reader.themes.light, className: 'swatch-light' },
                    { value: 'sepia', label: t.reader.themes.sepia, className: 'swatch-sepia' },
                    { value: 'dark', label: t.reader.themes.dark, className: 'swatch-dark' },
                  ]}
                />
              </div>
              <div className="panel-row">
                <span>{t.reader.font}</span>
                <Seg
                  value={settings.font}
                  onChange={(font) => update({ font })}
                  options={[
                    { value: 'serif', label: t.reader.fonts.serif },
                    { value: 'sans', label: t.reader.fonts.sans },
                  ]}
                />
              </div>
              <div className="panel-row">
                <span>
                  {t.reader.size} · {bnNumber(settings.size)}
                </span>
                <div className="seg">
                  <button
                    type="button"
                    onClick={() => update({ size: Math.max(15, settings.size - 1) })}
                    aria-label={t.reader.smaller}
                  >
                    অ−
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ size: Math.min(28, settings.size + 1) })}
                    aria-label={t.reader.larger}
                  >
                    অ+
                  </button>
                </div>
              </div>
              <div className="panel-row">
                <span>{t.reader.spacing}</span>
                <Seg
                  value={settings.spacing}
                  onChange={(spacing) => update({ spacing })}
                  options={[
                    { value: 'tight', label: t.reader.spacings.tight },
                    { value: 'normal', label: t.reader.spacings.normal },
                    { value: 'loose', label: t.reader.spacings.loose },
                  ]}
                />
              </div>
              <div className="panel-row">
                <span>{t.reader.width}</span>
                <Seg
                  value={settings.width}
                  onChange={(width) => update({ width })}
                  options={[
                    { value: 'narrow', label: t.reader.widths.narrow },
                    { value: 'normal', label: t.reader.widths.normal },
                    { value: 'wide', label: t.reader.widths.wide },
                  ]}
                />
              </div>
              <div className="panel-row">
                <span>{t.reader.paragraph}</span>
                <Seg
                  value={settings.paragraph}
                  onChange={(paragraph) => update({ paragraph })}
                  options={[
                    { value: 'gap', label: t.reader.paragraphs.gap },
                    { value: 'indent', label: t.reader.paragraphs.indent },
                  ]}
                />
              </div>
              <div className="panel-row">
                <span>{t.reader.align}</span>
                <Seg
                  value={settings.align}
                  onChange={(align) => update({ align })}
                  options={[
                    { value: 'justify', label: t.reader.aligns.justify },
                    { value: 'left', label: t.reader.aligns.left },
                  ]}
                />
              </div>
              <button
                type="button"
                className="btn ghost"
                style={{ width: '100%' }}
                onClick={() => setStored(STORE, null)}
              >
                {t.reader.reset}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
