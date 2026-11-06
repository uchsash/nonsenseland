import type { Metadata } from 'next'

import { AlapDeck } from '@/components/AlapDeck'
import { getT } from '@/i18n/server'
import { listAlap } from '@/lib/data'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t.alap.title }
}

export default async function AlapPage() {
  const [t, items] = await Promise.all([getT(), listAlap(50)])
  return (
    <div className="wrap">
      <header className="page-head" style={{ textAlign: 'center' }}>
        <h1>{t.alap.title}</h1>
      </header>
      <AlapDeck items={items} />
    </div>
  )
}
