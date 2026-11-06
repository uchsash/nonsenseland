import { getT } from '@/i18n/server'
import type { FootnoteIndex } from '@/utilities/footnotes'

/** All of a text's footnotes, listed at the end (টীকা). */
export async function FootnoteList({ index }: { index: FootnoteIndex }) {
  if (!index.notes.length) return null
  const t = await getT()
  return (
    <section className="footnotes" aria-label={t.book.notes}>
      <h2>{t.book.notes}</h2>
      <ol>
        {index.notes.map(({ n, note }) => (
          <li key={n} id={`fn-${n}`}>
            <span className="fn-text">{note}</span>{' '}
            <a href={`#fnref-${n}`} aria-label={t.book.backToText}>
              ↑
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
