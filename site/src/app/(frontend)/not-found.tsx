import Link from 'next/link'

import { t } from '@/i18n/bn'

export default function NotFound() {
  return (
    <div className="wrap not-found">
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <Link href="/" className="btn">
        {t.notFound.home}
      </Link>
    </div>
  )
}
