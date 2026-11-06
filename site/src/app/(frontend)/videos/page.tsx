import type { Metadata } from 'next'

import { VideoCard } from '@/components/Cards'
import { CategoryChips, Pager, pageHref } from '@/components/ListPage'
import { t } from '@/i18n/bn'
import { getCategories, listVideos } from '@/lib/data'

export const metadata: Metadata = { title: t.nav.videos }

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category, page } = await searchParams
  const categories = await getCategories('video')
  const active = categories.find((c) => c.slug === category)
  const current = Math.max(1, Number(page) || 1)
  const videos = await listVideos({ category: active?.id, page: current, limit: 18 })

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>{active?.name ?? t.nav.videos}</h1>
      </header>
      <CategoryChips base="/videos" categories={categories} active={active?.slug ?? undefined} />
      {videos.docs.length ? (
        <div className="grid">
          {videos.docs.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <p className="empty">{t.common.empty}</p>
      )}
      <Pager page={current} totalPages={videos.totalPages} href={pageHref('/videos', active?.slug ?? undefined)} />
    </div>
  )
}
