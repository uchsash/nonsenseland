'use client'

import { Link, useConfig, useEditDepth, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

/** “← Back to <book>” at the top of a chapter, opening the book's Chapters tab. Hidden inside drawers. */
export function BackToBook() {
  const book = useFormFields(([fields]) => fields.book?.value) as number | { id: number } | undefined
  const { config } = useConfig()
  const depth = useEditDepth() // 1 on a normal page, more inside a drawer
  const id = typeof book === 'object' ? book?.id : book
  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`${config.serverURL}${config.routes.api}/books/${id}?depth=0&draft=true&select[title]=true`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => !cancelled && doc?.title && setTitle(doc.title))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id, config.serverURL, config.routes.api])

  // In a drawer (opened from the book), closing the drawer already goes back.
  if (!id || depth > 1) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <Link href={`${config.routes.admin}/collections/books/${id}#chapters`} style={{ fontWeight: 500 }}>
        ← Back to {title || 'the book'}
      </Link>
    </div>
  )
}
