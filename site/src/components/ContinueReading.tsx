'use client'

import Link from 'next/link'

import { useT } from '@/i18n/client'

import { parseStored, useStored } from './useStored'

/** “Continue where you stopped” — shown only if this browser has a saved place in the book. */
export function ContinueReading({ book, titles }: { book: string; titles: Record<number, string> }) {
  const t = useT()
  const saved = parseStored<{ chapter?: number } | null>(useStored(`nl-pos-${book}`), null)
  const chapter = saved?.chapter && titles[saved.chapter] ? saved.chapter : null
  if (!chapter) return null
  return (
    <Link href={`/books/${book}/read/${chapter}`} className="btn">
      {t.book.continueReading}: {titles[chapter]}
    </Link>
  )
}
