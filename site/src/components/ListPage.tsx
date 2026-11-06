import Link from 'next/link'

import { t } from '@/i18n/bn'
import type { Category } from '@/payload-types'
import { bnNumber } from '@/utilities/bn'

export function CategoryChips({
  base,
  categories,
  active,
}: {
  base: string
  categories: Category[]
  active?: string
}) {
  if (categories.length < 2) return null
  return (
    <nav className="chips" aria-label={t.common.topics} style={{ marginBottom: 32 }}>
      <Link href={base} className="chip" aria-current={!active ? 'page' : undefined}>
        {t.common.all}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`${base}?category=${c.slug}`}
          className="chip"
          aria-current={active === c.slug ? 'page' : undefined}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  )
}

export function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages < 2) return null
  return (
    <nav className="pager">
      {page > 1 ? (
        <Link className="btn ghost" href={href(page - 1)}>
          {t.common.previous}
        </Link>
      ) : null}
      <span className="muted" style={{ alignSelf: 'center' }}>
        {bnNumber(page)} / {bnNumber(totalPages)}
      </span>
      {page < totalPages ? (
        <Link className="btn ghost" href={href(page + 1)}>
          {t.common.next}
        </Link>
      ) : null}
    </nav>
  )
}

export const pageHref = (base: string, category?: string) => (p: number) => {
  const q = new URLSearchParams()
  if (category) q.set('category', category)
  if (p > 1) q.set('page', String(p))
  const s = q.toString()
  return s ? `${base}?${s}` : base
}
