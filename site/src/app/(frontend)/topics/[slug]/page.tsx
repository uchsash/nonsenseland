import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleCard, VideoCard } from '@/components/Cards'
import { t } from '@/i18n/bn'
import { getTopic, listArticles, listVideos } from '@/lib/data'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopic((await params).slug)
  return { title: topic?.name }
}

export default async function TopicPage({ params }: Props) {
  const topic = await getTopic((await params).slug)
  if (!topic) notFound()
  const [articles, videos] = await Promise.all([
    listArticles({ topic: topic.id, limit: 48 }),
    listVideos({ topic: topic.id, limit: 48 }),
  ])

  return (
    <div className="wrap">
      <header className="page-head">
        <p style={{ margin: 0 }}>{t.common.topics}</p>
        <h1>{topic.name}</h1>
      </header>
      {articles.docs.length ? (
        <section className="result-group">
          <h2>{t.nav.articles}</h2>
          <div className="grid">
            {articles.docs.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
      {videos.docs.length ? (
        <section className="result-group">
          <h2>{t.nav.videos}</h2>
          <div className="grid">
            {videos.docs.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      ) : null}
      {!articles.docs.length && !videos.docs.length ? <p className="empty">{t.common.empty}</p> : null}
    </div>
  )
}
