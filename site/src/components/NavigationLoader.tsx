'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useT } from '@/i18n/client'

import { LogoLoader } from './LogoLoader'

const DELAY = 350 // ms; fast page changes never show the loader

/** Links that load another page of the site (not files, admin, new tabs or same-page anchors). */
const isPageLink = (a: HTMLAnchorElement, e: MouseEvent) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  if (a.target && a.target !== '_self') return false
  if (a.hasAttribute('download')) return false
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin) return false
  if (/^\/(admin|api|download)(\/|$)/.test(url.pathname)) return false
  return url.pathname !== location.pathname || url.search !== location.search
}

/**
 * Shows the animated logo while moving between pages inside the site.
 * (Done on the client so pages keep their real status codes, e.g. 404.)
 */
export function NavigationLoader() {
  const t = useT()
  const pathname = usePathname()
  const search = useSearchParams()
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || !isPageLink(a, e)) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(true), DELAY)
    }
    // Capture phase: runs before the site's links take over the click (they cancel the
    // browser's own page load to load the next page themselves).
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // The new page has arrived.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setVisible(false)
  }, [pathname, search])

  if (!visible) return null
  return (
    <div className="nav-loader">
      <LogoLoader label={t.common.loading} />
    </div>
  )
}
