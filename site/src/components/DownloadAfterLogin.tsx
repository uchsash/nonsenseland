'use client'

import { useEffect } from 'react'

/**
 * After logging in to download, the reader comes back to the book page with ?download=1;
 * this starts the download and tidies the address. (The book page is cached for everyone,
 * so this happens in the browser.)
 */
export function DownloadAfterLogin({ slug }: { slug: string }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('download') !== '1') return
    url.searchParams.delete('download')
    window.history.replaceState(null, '', url)
    window.location.assign(`/download/${slug}`)
  }, [slug])
  return null
}
