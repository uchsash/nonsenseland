import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConvertersFunction,
  RichText as LexicalRichText,
  TextJSXConverter,
} from '@payloadcms/richtext-lexical/react'

import { colorClass } from '@/utilities/palette'

type Value = SerializedEditorState | null | undefined
type LinesFields = { text?: string; align?: 'left' | 'center' | 'right' }
/** Payload's own text renderer (bold, italic…), wrapped below to add colours. */
const renderText = TextJSXConverter.text as (args: unknown) => React.ReactNode

/** Default rendering plus logo-colour text and the “Lines without gaps” block. */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    const rendered = renderText(args)
    // Text colour chosen in the editor is stored as node state: { $: { color: 'orange' } }.
    const color = colorClass((args.node as { $?: { color?: string } }).$?.color)
    return color ? <span className={color}>{rendered}</span> : rendered
  },
  blocks: {
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

export function RichText({ data, className = 'prose' }: { data: Value; className?: string }) {
  if (!data) return null
  return <LexicalRichText data={data} className={className} converters={converters} />
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
