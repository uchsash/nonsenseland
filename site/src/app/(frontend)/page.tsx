import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { ArticleCard, BookCard } from '@/components/Cards'
import { NewsletterForm } from '@/components/Forms'
import { Img } from '@/components/Img'
import { Slider } from '@/components/Slider'
import { VideoSlider } from '@/components/VideoSlider'
import { t } from '@/i18n/bn'
import { getCategories, getHomepage, getSettings, listArticles, listBooks, listVideos } from '@/lib/data'
import type { Homepage } from '@/payload-types'

type Section = NonNullable<Homepage['sections']>[number]

/** Used until sections are arranged in the admin panel. */
const defaultSections: Section[] = [
  { blockType: 'intro', enabled: true },
  { blockType: 'videos', enabled: true, title: 'ভিডিও', showFilters: true },
  { blockType: 'articles', enabled: true, title: 'লেখা' },
  { blockType: 'ad', enabled: true },
  { blockType: 'library', enabled: true, title: t.book.free },
  { blockType: 'published', enabled: true, title: t.book.published },
]

export default async function HomePage() {
  const home = await getHomepage()
  const sections = (home.sections?.length ? home.sections : defaultSections).filter((s) => s.enabled !== false)

  return (
    <div className="wrap">
      {sections.map((section, i) => (
        <HomeSection key={section.id ?? i} section={section} />
      ))}
    </div>
  )
}

async function HomeSection({ section }: { section: Section }) {
  switch (section.blockType) {
    case 'intro':
      return <Intro />
    case 'videos': {
      const [videos, categories] = await Promise.all([listVideos({ limit: 24 }), getCategories('video')])
      if (!videos.docs.length) return null
      return (
        <VideoSlider
          title={section.title}
          videos={videos.docs}
          categories={categories}
          showFilters={section.showFilters !== false}
        />
      )
    }
    case 'articles': {
      const category = typeof section.category === 'object' ? section.category?.id : section.category
      const articles = await listArticles({ category: category ?? undefined, limit: 12 })
      if (!articles.docs.length) return null
      return (
        <Slider title={section.title} link="/articles">
          {articles.docs.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </Slider>
      )
    }
    case 'library':
    case 'published': {
      const books = await listBooks(section.blockType)
      if (!books.length) return null
      return (
        <Slider title={section.title} link="/books" variant="books">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Slider>
      )
    }
    case 'ad':
      return <AdSlot slot="home" />
    case 'newsletter':
      return (
        <section className="section newsletter">
          <h2>{section.title}</h2>
          {section.text ? <p>{section.text}</p> : null}
          <NewsletterForm />
        </section>
      )
    default:
      return null
  }
}

async function Intro() {
  const s = await getSettings()
  const buttons = s.introButtons?.length
    ? s.introButtons
    : [
        { label: t.nav.videos, href: '/videos' },
        { label: t.book.free, href: '/books' },
      ]
  return (
    <section className="intro">
      <div>
        <h1>{s.introTitle}</h1>
        {s.introText ? <p>{s.introText}</p> : null}
        <div className="actions">
          {buttons.map((b, i) => (
            <Link key={b.href} href={b.href} className={i === 0 ? 'btn' : 'btn ghost'}>
              {b.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="intro-art">
        {s.introImage && typeof s.introImage === 'object' ? (
          <Img media={s.introImage} use={[]} priority />
        ) : (
          <img src="/brand/icon.svg" alt="" width={280} height={280} />
        )}
      </div>
    </section>
  )
}
