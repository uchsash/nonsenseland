import type { Metadata } from 'next'
import { Hind_Siliguri, Noto_Serif_Bengali } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import React, { Suspense } from 'react'

import { HeaderNav } from '@/components/HeaderNav'
import { NavigationLoader } from '@/components/NavigationLoader'
import { UiTextProvider } from '@/i18n/client'
import { getT } from '@/i18n/server'
import { getSettings } from '@/lib/data'
import type { Media } from '@/payload-types'

import './styles.css'

const ui = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
})
const serif = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const share = s.shareImage as Media | null
  const icon = s.icon as Media | null
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.siteName, template: `%s · ${s.siteName}` },
    description: s.introText ?? s.tagline ?? undefined,
    openGraph: {
      siteName: s.siteName,
      locale: 'bn_BD',
      type: 'website',
      images: share?.sizes?.og?.url ? [share.sizes.og.url] : undefined,
    },
    icons: icon?.url ? { icon: icon.url } : undefined,
  }
}

/** Applies the saved light/dark choice before paint to avoid a flash. */
const themeScript = `try{var t=localStorage.getItem('nl-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [s, t] = await Promise.all([getSettings(), getT()])
  const logo = s.logo as Media | null
  const defaultMenu = [
    { label: t.nav.videos, href: '/videos' },
    { label: t.nav.articles, href: '/articles' },
    { label: t.nav.books, href: '/books' },
    { label: t.nav.about, href: '/about' },
  ]
  const menu = s.menu?.length ? s.menu.map(({ label, href }) => ({ label, href })) : defaultMenu
  const social = s.social ?? []

  return (
    <html lang="bn" className={`${ui.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      {/* Browser extensions (e.g. ColorZilla, Grammarly) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        <UiTextProvider value={t}>
        {s.announcementOn && s.announcementText ? (
          <div className="announce">
            {s.announcementLink ? (
              <Link href={s.announcementLink}>{s.announcementText}</Link>
            ) : (
              s.announcementText
            )}
          </div>
        ) : null}
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="logo" aria-label={`${s.siteName} — ${t.nav.home}`}>
              <img src={logo?.url ?? '/brand/logo.svg'} alt={s.siteName} width={82} height={36} />
            </Link>
            <HeaderNav items={menu} />
          </div>
        </header>
        <main>{children}</main>
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <footer className="site-footer">
          <div className="wrap">
            <span>
              © {new Intl.NumberFormat('bn-BD', { useGrouping: false }).format(new Date().getFullYear())}{' '}
              {s.footerText || s.siteName}
            </span>
            {s.footerLinks?.length ? (
              <nav className="footer-links">
                {s.footerLinks.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            {social.length ? (
              <div className="social">
                {social.map((item) => (
                  <a
                    key={item.url}
                    href={item.network === 'email' ? `mailto:${item.url.replace(/^mailto:/, '')}` : item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', email: 'Email' }[item.network]}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </footer>
        </UiTextProvider>
      </body>
    </html>
  )
}
