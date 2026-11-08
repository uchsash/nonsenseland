import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { GoogleButton, LoginForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'
import { currentUser, safeNext } from '@/lib/account'

export const metadata: Metadata = { title: 'লগইন', robots: { index: false, follow: false } }

type Props = { searchParams: Promise<{ next?: string; error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next: nextParam, error } = await searchParams
  const next = safeNext(nextParam)
  if (await currentUser()) redirect(next)
  const t = await getT()
  const message = error === 'staff' ? t.account.googleStaff : error ? t.account.googleFailed : null
  return (
    <div className="wrap auth-box">
      <header className="page-head">
        <h1>{t.account.login}</h1>
      </header>
      {process.env.GOOGLE_CLIENT_ID ? <GoogleButton next={next} /> : null}
      {message ? (
        <p className="form-note" role="alert" style={{ color: 'var(--accent)' }}>
          {message}
        </p>
      ) : null}
      <LoginForm next={next} />
    </div>
  )
}
