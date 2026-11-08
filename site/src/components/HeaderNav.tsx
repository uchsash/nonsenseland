'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'

import { useT } from '@/i18n/client'

import { CloseIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from './icons'
import { setStored } from './useStored'

type Item = { label: string; href: string }

const DARK = '(prefers-color-scheme: dark)'

const subscribeTheme = (onChange: () => void) => {
  const media = matchMedia(DARK)
  media.addEventListener('change', onChange)
  window.addEventListener('nl-storage', onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener('nl-storage', onChange)
  }
}

/** Dark if chosen explicitly, otherwise following the device. Unknown (null) on the server. */
const isDark = () => {
  const chosen = document.documentElement.dataset.theme
  return chosen ? chosen === 'dark' : matchMedia(DARK).matches
}

export function HeaderNav({ items }: { items: Item[] }) {
  const t = useT()
  const pathname = usePathname()
  // The menu is open only for the page it was opened on, so it closes after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => null)

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    setStored('nl-theme', next)
  }

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      <nav className={`main-nav${open ? ' open' : ''}`} aria-label={t.nav.menu}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-tools">
        <Link href="/search" className="icon-btn" aria-label={t.nav.search}>
          <SearchIcon />
        </Link>
        <Link href="/account" className="icon-btn" aria-label={t.account.title} prefetch={false}>
          <UserIcon />
        </Link>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={dark ? t.nav.themeLight : t.nav.themeDark}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          className="icon-btn menu-toggle"
          onClick={() => setOpenOn(open ? null : pathname)}
          aria-expanded={open}
          aria-label={open ? t.nav.close : t.nav.menu}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </>
  )
}
