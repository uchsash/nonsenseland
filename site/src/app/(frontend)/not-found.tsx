import Link from 'next/link'

import { getT } from '@/i18n/server'

export default async function NotFound() {
  const t = await getT()
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
