import Script from 'next/script'

import { getT } from '@/i18n/server'
import { getAdSettings, pickAd } from '@/lib/data'
import type { Book } from '@/payload-types'

import { BookPromo } from './BookPromo'
import { Img } from './Img'

/**
 * One ad position. Shows nothing when ads are switched off or no ad is active,
 * so the page simply closes up.
 */
export async function AdSlot({ slot, adId }: { slot: string; adId?: number }) {
  const t = await getT()
  const ad = await pickAd(slot, adId)
  if (!ad) return null

  // Inside a text (e.g. after a book's last chapter) the reader has stopped, so the full ad
  // fits; between sections or after an article a compact one keeps the page moving.
  if (ad.mode === 'book') return <BookPromo ad={ad} label={t.ad.label} compact={slot !== 'article-inline'} />

  if (ad.mode === 'house' && typeof ad.image === 'object' && ad.image) {
    const book = ad.book as Book | null
    const href = book?.slug ? `/books/${book.slug}` : (ad.link ?? undefined)
    // Original image: banners keep their own shape (no 16:9 crop).
    const image = <Img media={ad.image} use={[]} />
    return (
      <aside className="ad" aria-label={t.ad.label}>
        {href ? (
          <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener sponsored' } : {})}>
            {image}
          </a>
        ) : (
          image
        )}
      </aside>
    )
  }

  if (ad.mode === 'adsense' && ad.adsenseSlot) {
    const { adsenseClient } = await getAdSettings()
    if (!adsenseClient) return null
    return (
      <aside className="ad" aria-label={t.ad.label}>
        <div className="ad-label">{t.ad.label}</div>
        <Script
          id="adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClient}
          data-ad-slot={ad.adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id={`adsense-push-${ad.id}`} strategy="lazyOnload">
          {'(adsbygoogle = window.adsbygoogle || []).push({});'}
        </Script>
      </aside>
    )
  }

  if (ad.mode === 'custom' && ad.code) {
    // Admin-only content, entered in the protected admin panel.
    return <aside className="ad" aria-label={t.ad.label} dangerouslySetInnerHTML={{ __html: ad.code }} />
  }
  return null
}
