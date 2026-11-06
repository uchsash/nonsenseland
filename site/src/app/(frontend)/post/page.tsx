import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getT } from '@/i18n/server'
import { payloadClient } from '@/lib/data'
import { bnDate } from '@/utilities/bn'

import { PostForm } from './PostForm'

export const metadata: Metadata = { title: 'Post', robots: { index: false, follow: false } }

/** Quick-post page for খুচরো আলাপ (made for the phone). Admins and editors only. */
export default async function PostPage() {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const role = (user as { role?: string } | null)?.role
  if (role !== 'admin' && role !== 'editor') redirect('/admin/login?redirect=%2Fpost')

  const t = await getT()
  const recent = await payload.find({
    collection: 'alap',
    sort: '-publishedAt',
    limit: 5,
    depth: 0,
    select: { title: true, publishedAt: true, published: true },
  })

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <header className="page-head">
        <h1>{t.post.title}</h1>
      </header>
      <PostForm />
      {recent.docs.length ? (
        <ul className="post-recent">
          {recent.docs.map((p) => (
            <li key={p.id}>
              <a href={`/admin/collections/alap/${p.id}`}>
                {p.title}
                <small>
                  {bnDate(p.publishedAt)}
                  {p.published ? '' : ' · hidden'}
                </small>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
