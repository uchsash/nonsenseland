import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { GoogleButton, SignupForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'
import { currentUser, safeNext } from '@/lib/account'

export const metadata: Metadata = { title: 'অ্যাকাউন্ট', robots: { index: false, follow: false } }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await currentUser()) redirect(next)
  const t = await getT()
  return (
    <div className="wrap auth-box">
      <header className="page-head">
        <h1>{t.account.createAccount}</h1>
      </header>
      {process.env.GOOGLE_CLIENT_ID ? <GoogleButton next={next} /> : null}
      <SignupForm next={next} />
    </div>
  )
}
