import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/AdSlot'
import { ArticleCard, BookCard } from '@/components/Cards'
import { Img } from '@/components/Img'
import { FootnoteList } from '@/components/FootnoteList'
import { Reader } from '@/components/Reader'
import { RichText, splitRichText } from '@/components/RichText'
import { Share } from '@/components/Share'
import { Slider } from '@/components/Slider'
import { TopicLinks } from '@/components/TopicLinks'
import { fill } from '@/i18n/bn'
import { getT } from '@/i18n/server'
import { getArticle, listArticles } from '@/lib/data'
import { docMetadata } from '@/lib/seo'
import type { Author, Book, Category } from '@/payload-types'
import { bnDate, bnNumber } from '@/utilities/bn'
import { indexFootnotes } from '@/utilities/footnotes'
import { hasAdBlock } from '@/utilities/lexical'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  const meta = docMetadata(article, { path: `/articles/${slug}`, description: article?.excerpt, image: article?.cover })
  return article ? { ...meta, openGraph: { ...meta.openGraph, type: 'article' } } : meta
}

export default async function ArticlePage({ params }: Props) {
  const t = await getT()
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()
  const category = article.category as Category | null
  const author = article.author as Author | null
  const book = article.relatedBook as Book | null
  // Ads placed by hand in the editor replace both automatic positions (middle and end).
  const manualAds = hasAdBlock(article.content)
  const [first, rest] = manualAds ? [article.content, null] : splitRichText(article.content)
  const footnotes = indexFootnotes(article.content)
  const more = await listArticles({ category: category?.id, limit: 6, exclude: article.id })

  return (
    <Reader>
      <article>
        <header className="reading-column reading-head">
          <div className="card-meta">
            {category ? <Link href={`/articles?category=${category.slug}`}>{category.name}</Link> : null}
          </div>
          <h1>{article.title}</h1>
          <div className="meta">
            {author ? `${author.name} · ` : ''}
            {article.publishedAt ? bnDate(article.publishedAt) : ''}
            {article.readingTime ? ` · ${fill(t.common.minRead, { n: bnNumber(article.readingTime) })}` : ''}
          </div>
        </header>
        <div className="reading-cover wrap">
          <Img media={article.cover} use={['card', 'og']} sizes="(max-width: 960px) 100vw, 960px" priority />
        </div>
        <div className="reading-column">
          <RichText data={first} footnotes={footnotes} />
          {rest ? (
            <>
              <AdSlot slot="article-inline" />
              <RichText data={rest} footnotes={footnotes} />
            </>
          ) : null}
          <FootnoteList index={footnotes} />
          <TopicLinks topics={article.topics} />
          <Share path={`/articles/${article.slug}`} title={article.title} />
          {book?.slug ? (
            <div className="reading-end" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 96, flex: 'none' }}>
                <BookCard book={book} />
              </div>
              <div>
                <p className="muted" style={{ margin: 0 }}>
                  {t.article.bookPromo}
                </p>
                <Link href={`/books/${book.slug}`} className="btn" style={{ marginTop: 12 }}>
                  {book.title}
                </Link>
              </div>
            </div>
          ) : null}
          {manualAds ? null : <AdSlot slot="article-end" />}
        </div>
      </article>
      {more.docs.length ? (
        <div className="wrap">
          <Slider title={t.article.related} link="/articles">
            {more.docs.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </Slider>
        </div>
      ) : null}
    </Reader>
  )
}
