'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { t } from '@/i18n/bn'

import { CloseIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from './icons'

type Item = { label: string; href: string }

export function HeaderNav({ items }: { items: Item[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const explicit = document.documentElement.dataset.theme
    setDark(explicit ? explicit === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    try {
      localStorage.setItem('nl-theme', next ? 'dark' : 'light')
    } catch {}
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
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? t.nav.close : t.nav.menu}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </>
  )
}
