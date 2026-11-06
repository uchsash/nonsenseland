import Script from 'next/script'

import { t } from '@/i18n/bn'
import { getAdSettings, getAdsFor } from '@/lib/data'
import type { Book } from '@/payload-types'

import { Img } from './Img'

/**
 * One ad position. Shows nothing when ads are switched off or no ad is active,
 * so the page simply closes up. When several ads share a slot, one is picked per request.
 */
export async function AdSlot({ slot }: { slot: string }) {
  const ads = await getAdsFor(slot)
  if (!ads.length) return null
  const ad = ads[Math.floor(Math.random() * ads.length)]

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
