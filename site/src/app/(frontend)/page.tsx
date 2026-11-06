import Link from 'next/link'

import { AdSlot } from '@/components/AdSlot'
import { BookShelf } from '@/components/BookShelf'
import { ArticleCard } from '@/components/Cards'
import { NewsletterForm } from '@/components/Forms'
import { Img } from '@/components/Img'
import { Slider } from '@/components/Slider'
import { VideoSlider } from '@/components/VideoSlider'
import { getT } from '@/i18n/server'
import { getCategories, getHomepage, getSettings, listArticles, listBooks, listVideos } from '@/lib/data'
import type { Homepage } from '@/payload-types'
import { colorClass } from '@/utilities/palette'

type Section = NonNullable<Homepage['sections']>[number]

export default async function HomePage() {
  const [home, t] = await Promise.all([getHomepage(), getT()])
  // Used until sections are arranged in the admin panel.
  const defaultSections: Section[] = [
    { blockType: 'intro', enabled: true },
    { blockType: 'videos', enabled: true, title: t.nav.videos, showFilters: true },
    { blockType: 'articles', enabled: true, title: t.nav.articles },
    { blockType: 'ad', enabled: true },
    { blockType: 'library', enabled: true, title: t.book.free },
    { blockType: 'published', enabled: true, title: t.book.published },
  ]
  const sections = (home.sections?.length ? home.sections : defaultSections).filter((s) => s.enabled !== false)

  return (
    <div className="wrap">
      {sections.map((section, i) =>
        section.blockType === 'intro' ? (
          <Intro key={section.id ?? i} sections={sections} />
        ) : (
          // Anchor for the intro buttons (#s-<id>).
          <div key={section.id ?? i} id={section.id ? `s-${section.id}` : undefined} className="anchor">
            <HomeSection section={section} />
          </div>
        ),
      )}
    </div>
  )
}

async function HomeSection({ section }: { section: Section }) {
  switch (section.blockType) {
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
      return <BookShelf title={section.title} books={books} layout="slider" link="/books" />
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

/** Text with Enter = new line and an empty line = new paragraph. */
const Paragraphs = ({ text }: { text: string }) =>
  text
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, i) => <p key={i}>{para}</p>)

async function Intro({ sections }: { sections: Section[] }) {
  const s = await getSettings()
  // A button shows only if its section is on the homepage (and switched on), or it has a link.
  const buttons = (s.introButtons ?? [])
    .map((b) => {
      if (b.section) {
        return sections.some((sec) => sec.id === b.section) ? { label: b.label, href: `#s-${b.section}` } : null
      }
      return b.href ? { label: b.label, href: b.href } : null
    })
    .filter((b): b is { label: string; href: string } => Boolean(b))

  return (
    <section className={`intro spacing-${s.introSpacing ?? 'normal'}`}>
      <div>
        <h1 className={colorClass(s.introTitleColor)}>{s.introTitle}</h1>
        {s.introText ? (
          <div className="intro-text">
            <Paragraphs text={s.introText} />
          </div>
        ) : null}
        {buttons.length ? (
          <div className="actions">
            {buttons.map((b, i) => (
              <Link key={`${b.href}-${i}`} href={b.href} className={i === 0 ? 'btn' : 'btn ghost'}>
                {b.label}
              </Link>
            ))}
          </div>
        ) : null}
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
