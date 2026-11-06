import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { VideoCard } from '@/components/Cards'
import { Img } from '@/components/Img'
import { Share } from '@/components/Share'
import { Slider } from '@/components/Slider'
import { TopicLinks } from '@/components/TopicLinks'
import { VideoPlayer } from '@/components/VideoPlayer'
import { getT } from '@/i18n/server'
import { getVideo, listVideos } from '@/lib/data'
import { docMetadata } from '@/lib/seo'
import type { Category } from '@/payload-types'
import { bnDate } from '@/utilities/bn'
import { embedUrl } from '@/utilities/video'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const video = await getVideo(slug)
  return docMetadata(video, { path: `/videos/${slug}`, description: video?.description, image: video?.thumbnail })
}

export default async function VideoPage({ params }: Props) {
  const t = await getT()
  const { slug } = await params
  const video = await getVideo(slug)
  if (!video) notFound()
  const category = video.category as Category | null
  const related = (await listVideos({ category: category?.id, limit: 9 })).docs.filter((v) => v.id !== video.id)

  return (
    <div className="wrap" style={{ maxWidth: 960 }}>
      <div style={{ marginTop: 32 }}>
        <VideoPlayer
          embed={embedUrl(video.url)}
          title={video.title}
          poster={<Img media={video.thumbnail} use={['card', 'og']} sizes="960px" priority />}
        />
      </div>
      <header className="video-head">
        <div className="card-meta">
          {category ? <Link href={`/videos?category=${category.slug}`}>{category.name}</Link> : null}
          {video.publishedAt ? ` · ${bnDate(video.publishedAt)}` : ''}
        </div>
        <h1>{video.title}</h1>
      </header>
      {video.description ? <p style={{ whiteSpace: 'pre-line' }}>{video.description}</p> : null}
      <TopicLinks topics={video.topics} />
      <p>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="muted" style={{ textDecoration: 'underline' }}>
          {video.platform === 'youtube' ? t.video.watchOnYoutube : t.video.watchOnFacebook}
        </a>
      </p>
      <Share path={`/videos/${video.slug}`} title={video.title} />
      <AdSlot slot="video" />
      {related.length ? (
        <Slider title={t.video.related} link="/videos">
          {related.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </Slider>
      ) : null}
    </div>
  )
}
