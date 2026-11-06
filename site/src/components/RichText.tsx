import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConvertersFunction,
  RichText as LexicalRichText,
  TextJSXConverter,
} from '@payloadcms/richtext-lexical/react'

import { type FootnoteIndex, indexFootnotes, isFootnote } from '@/utilities/footnotes'
import { colorClass } from '@/utilities/palette'

import { AdSlot } from './AdSlot'
import { Footnote } from './Footnote'

type Value = SerializedEditorState | null | undefined
type LinesFields = { text?: string; align?: 'left' | 'center' | 'right' }
type Paragraph = {
  children?: { type?: string; text?: string }[]
  format?: string | number
  indent?: number
  /** Paragraph settings from the editor's ¶ menu. */
  $?: { space?: 'none' | 'more'; noIndent?: boolean }
}

type InternalDoc = { relationTo?: string; value?: number | { slug?: string | null } | null } | null | undefined

/** Where an internal link goes: each collection's page on the site. */
const ROUTES: Record<string, string> = {
  articles: '/articles/',
  books: '/books/',
  videos: '/videos/',
  topics: '/topics/',
  pages: '/',
}
const internalHref = (doc: InternalDoc) => {
  const slug = typeof doc?.value === 'object' ? doc.value?.slug : null
  const base = doc?.relationTo ? ROUTES[doc.relationTo] : undefined
  return slug && base ? `${base}${slug}` : '#'
}

/** Payload's own text renderer (bold, italic…), wrapped below to add colours. */
const renderText = TextJSXConverter.text as (args: unknown) => React.ReactNode

const ALIGNED = ['center', 'right', 'justify'] as const

const isEmptyParagraph = (node: Paragraph) =>
  !node.children?.length || node.children.every((c) => c.type === 'text' && !c.text?.trim())

/** Default rendering plus colours, paragraph settings, footnotes and “Lines without gaps”. */
const makeConverters =
  (footnotes: FootnoteIndex): JSXConvertersFunction =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    text: (args) => {
      const rendered = renderText(args)
      // Text colour chosen in the editor is stored as node state: { $: { color: 'orange' } }.
      const color = colorClass((args.node as { $?: { color?: string } }).$?.color)
      return color ? <span className={color}>{rendered}</span> : rendered
    },
    paragraph: ({ node, nodesToJSX }) => {
      const p = node as unknown as Paragraph
      // Empty lines (Enter pressed twice or more) become one fixed space.
      if (isEmptyParagraph(p)) return <div className="gap" aria-hidden="true" />
      const align = typeof p.format === 'string' ? (ALIGNED as readonly string[]).find((a) => a === p.format) : undefined
      const classes = [
        align && `al-${align}`,
        p.$?.space && `sp-${p.$.space}`,
        (p.$?.noIndent || (align && align !== 'justify')) && 'no-indent',
      ].filter(Boolean)
      return (
        <p
          className={classes.length ? classes.join(' ') : undefined}
          style={p.indent ? { paddingInlineStart: `${p.indent * 2}em` } : undefined}
        >
          {nodesToJSX({ nodes: node.children })}
        </p>
      )
    },
    link: (args) => {
      const { node, nodesToJSX } = args
      if (isFootnote(node as never)) {
        const fields = node.fields as { note?: string }
        return (
          <Footnote n={footnotes.numbers.get(node) ?? 0} note={fields.note ?? ''}>
            {nodesToJSX({ nodes: node.children })}
          </Footnote>
        )
      }
      if (node.fields.linkType === 'internal') {
        // A link to a page on this site, chosen in the editor's “Internal link” list.
        const href = internalHref(node.fields.doc as InternalDoc)
        return (
          <a href={href} target={node.fields.newTab ? '_blank' : undefined} rel={node.fields.newTab ? 'noopener noreferrer' : undefined}>
            {nodesToJSX({ nodes: node.children })}
          </a>
        )
      }
      const link = defaultConverters.link as (a: typeof args) => React.ReactNode
      return link(args)
    },
    blocks: {
      // An ad placed in the editor (async server component: renders nothing when off or expired).
      ad: ({ node }: { node: unknown }) => {
        const ad = (node as { fields: { ad?: number | { id: number } | null } }).fields.ad
        const adId = typeof ad === 'object' && ad ? ad.id : (ad ?? undefined)
        return <AdSlot slot="article-inline" adId={adId} />
      },
      lines: ({ node }: { node: unknown }) => {
        const { text = '', align = 'left' } = (node as { fields: LinesFields }).fields
        const lines = text.split(/\r?\n/)
        return (
          <p className="lines" style={align === 'left' ? undefined : { textAlign: align }}>
            {lines.map((line, i) => (
              <span key={i}>
                {line}
                {i < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        )
      },
    },
  })

/**
 * Renders rich text. Pass `footnotes` when one text is rendered in parts (e.g. around an
 * inline ad) so numbering continues; otherwise it is worked out from `data`.
 */
export function RichText({
  data,
  className = 'prose',
  footnotes,
}: {
  data: Value
  className?: string
  footnotes?: FootnoteIndex
}) {
  if (!data) return null
  return (
    <LexicalRichText data={data} className={className} converters={makeConverters(footnotes ?? indexFootnotes(data))} />
  )
}

/**
 * Splits rich text after the Nth top-level block, so something (an inline ad)
 * can be placed in between. Short texts are not split.
 */
export function splitRichText(data: Value, after = 4, minBlocks = 9): [Value, Value] {
  const children = data?.root?.children as SerializedLexicalNode[] | undefined
  if (!data || !children || children.length < minBlocks) return [data, null]
  const part = (nodes: SerializedLexicalNode[]) => ({ ...data, root: { ...data.root, children: nodes } })
  return [part(children.slice(0, after)), part(children.slice(after))]
}
