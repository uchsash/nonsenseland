'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { t } from '@/i18n/bn'

/** “Continue where you stopped” — shown only if this browser has a saved place in the book. */
export function ContinueReading({ book, titles }: { book: string; titles: Record<number, string> }) {
  const [chapter, setChapter] = useState<number | null>(null)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`nl-pos-${book}`) ?? 'null')
      if (saved?.chapter && titles[saved.chapter]) setChapter(saved.chapter)
    } catch {}
  }, [book, titles])
  if (!chapter) return null
  return (
    <Link href={`/books/${book}/read/${chapter}`} className="btn">
      {t.book.continueReading}: {titles[chapter]}
    </Link>
  )
}
