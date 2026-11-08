import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ResetForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'

export const metadata: Metadata = {
  title: 'পাসওয়ার্ড',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) notFound()
  const t = await getT()
  return (
    <div className="wrap auth-box">
      <header className="page-head">
        <h1>{t.account.setPassword}</h1>
      </header>
      <ResetForm token={token} />
    </div>
  )
}
