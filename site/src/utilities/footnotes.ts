/** Footnotes are links with linkType “footnote” and the note text in fields.note. */
type Node = { type?: string; fields?: { linkType?: string; note?: string }; children?: Node[] }

export type FootnoteIndex = {
  /** Footnote node → its number in the text (1, 2, 3…), by object identity. */
  numbers: Map<object, number>
  /** All notes in reading order, for the list at the end. */
  notes: { n: number; note: string }[]
}

export const isFootnote = (node: Node) => node.type === 'link' && node.fields?.linkType === 'footnote'

/** Numbers the footnotes of a rich-text value in reading order. */
export function indexFootnotes(value: unknown): FootnoteIndex {
  const numbers = new Map<object, number>()
  const notes: FootnoteIndex['notes'] = []
  const walk = (node: Node) => {
    if (isFootnote(node)) {
      const n = notes.length + 1
      numbers.set(node, n)
      notes.push({ n, note: node.fields?.note ?? '' })
    }
    node.children?.forEach(walk)
  }
  const root = (value as { root?: Node } | null)?.root
  if (root) walk(root)
  return { numbers, notes }
}
