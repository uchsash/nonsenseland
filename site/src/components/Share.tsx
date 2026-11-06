'use client'

import { useState } from 'react'

import { useT } from '@/i18n/client'

export function Share({ path, title }: { path: string; title: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${path}`
  const u = encodeURIComponent(url)

  const copy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="share">
      <span>{t.share.title}</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <button type="button" onClick={copy}>
        {copied ? t.share.copied : t.share.copy}
      </button>
    </div>
  )
}
