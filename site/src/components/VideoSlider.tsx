'use client'

import { useState } from 'react'

import { useT } from '@/i18n/client'
import type { Category, Video } from '@/payload-types'

import { VideoCard } from './Cards'
import { Slider } from './Slider'

/** Video row with category filter chips; filtering happens instantly in the browser. */
export function VideoSlider({
  title,
  videos,
  categories,
  showFilters,
}: {
  title: string
  videos: Video[]
  categories: Category[]
  showFilters: boolean
}) {
  const t = useT()
  const [active, setActive] = useState<number | null>(null)
  const used = categories.filter((c) =>
    videos.some((v) => (typeof v.category === 'object' ? v.category?.id : v.category) === c.id),
  )
  const shown = active
    ? videos.filter((v) => (typeof v.category === 'object' ? v.category?.id : v.category) === active)
    : videos

  const chips =
    showFilters && used.length > 1 ? (
      <div className="chips" role="group">
        <button type="button" className="chip" aria-pressed={active === null} onClick={() => setActive(null)}>
          {t.common.all}
        </button>
        {used.map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            aria-pressed={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
    ) : null

  return (
    <Slider title={title} link="/videos" toolbar={chips}>
      {shown.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </Slider>
  )
}
