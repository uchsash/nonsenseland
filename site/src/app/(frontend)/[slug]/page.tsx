import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ContactForm } from '@/components/Forms'
import { FootnoteList } from '@/components/FootnoteList'
import { Img } from '@/components/Img'
import { Reader } from '@/components/Reader'
import { RichText } from '@/components/RichText'
import { getPage } from '@/lib/data'
import { docMetadata } from '@/lib/seo'
import { indexFootnotes } from '@/utilities/footnotes'
import { colorClass } from '@/utilities/palette'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  return docMetadata(page, { path: `/${slug}`, image: page?.image })
}

/** Editable pages: About, Privacy Policy, Terms, Refund Policy… */
export default async function Page({ params }: Props) {
  const page = await getPage((await params).slug)
  if (!page) notFound()
  const footnotes = indexFootnotes(page.content)
  // The same reading settings (font, size, indent…) as articles and books.
  return (
    <Reader>
    <article className="reading-column">
      <header className="reading-head">
        <h1 className={colorClass(page.titleColor)}>{page.title}</h1>
      </header>
      {page.image && typeof page.image === 'object' ? (
        <div style={{ maxWidth: 280, marginBottom: 32 }}>
          <Img media={page.image} use={[]} />
        </div>
      ) : null}
      <RichText data={page.content} footnotes={footnotes} />
      <FootnoteList index={footnotes} />
      {page.showContactForm ? (
        <div style={{ marginTop: 48 }}>
          <ContactForm />
        </div>
      ) : null}
    </article>
    </Reader>
  )
}
