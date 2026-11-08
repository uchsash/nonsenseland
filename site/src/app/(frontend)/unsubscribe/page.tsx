import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { UnsubscribeForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'
import { validUnsubscribe } from '@/lib/newsletter'

export const metadata: Metadata = { title: 'নিউজলেটার', robots: { index: false, follow: false } }

/** A button, not an instant action: mail scanners open links, and must not unsubscribe anyone. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e, t: token } = await searchParams
  if (!e || !token || !validUnsubscribe(e, token)) notFound()
  const t = await getT()
  return (
    <div className="wrap auth-box">
      <header className="page-head">
        <h1>{t.account.unsubscribeTitle}</h1>
      </header>
      <UnsubscribeForm email={e} token={token} />
    </div>
  )
}
