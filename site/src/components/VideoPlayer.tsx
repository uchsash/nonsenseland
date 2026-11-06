'use client'

import { useState } from 'react'

import { t } from '@/i18n/bn'

import { PlayIcon } from './icons'

/** Shows the thumbnail first; the Facebook/YouTube player loads only after a click. */
export function VideoPlayer({ embed, title, poster }: { embed?: string; title: string; poster: React.ReactNode }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="player">
      {playing && embed ? (
        <iframe
          src={embed}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`${t.video.play}: ${title}`}>
          {poster}
          <span className="play-dot">
            <PlayIcon size={28} />
          </span>
        </button>
      )}
    </div>
  )
}
