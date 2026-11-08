import type { Metadata } from 'next'

import { ForgotForm } from '@/components/AccountForms'
import { getT } from '@/i18n/server'

export const metadata: Metadata = { title: 'পাসওয়ার্ড', robots: { index: false, follow: false } }

export default async function ForgotPasswordPage() {
  const t = await getT()
  return (
    <div className="wrap auth-box">
      <header className="page-head">
        <h1>{t.account.forgot}</h1>
      </header>
      <ForgotForm />
    </div>
  )
}
