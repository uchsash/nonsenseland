import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

type Value = SerializedEditorState | null | undefined

export function RichText({ data, className = 'prose' }: { data: Value; className?: string }) {
  if (!data) return null
  return <LexicalRichText data={data} className={className} />
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
