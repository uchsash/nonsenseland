type Node = { text?: string; children?: Node[] }

/** Plain text of a Lexical rich-text value (used for reading time and search). */
export const lexicalToText = (value: unknown): string => {
  const root = (value as { root?: Node } | null)?.root
  if (!root) return ''
  const parts: string[] = []
  const walk = (node: Node) => {
    if (node.text) parts.push(node.text)
    node.children?.forEach(walk)
    if (node.children) parts.push(' ')
  }
  walk(root)
  return parts.join('').replace(/\s+/g, ' ').trim()
}

/** Minutes to read, assuming ~180 Bangla words per minute. */
export const readingMinutes = (value: unknown) => {
  const words = lexicalToText(value).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 180))
}

type Block = { type?: string; fields?: { blockType?: string } }

/** Whether a rich-text value contains an ad block placed in the editor. */
export const hasAdBlock = (value: unknown) =>
  ((value as { root?: { children?: Block[] } } | null)?.root?.children ?? []).some(
    (n) => n.type === 'block' && n.fields?.blockType === 'ad',
  )

/** Splits out ad blocks: [the text without them, the ad blocks]. Chapters show ads only at the end. */
export function takeAdBlocks<T>(value: T): [T, Block[]] {
  const root = (value as { root?: { children?: Block[] } } | null)?.root
  if (!root?.children) return [value, []]
  const ads = root.children.filter((n) => n.type === 'block' && n.fields?.blockType === 'ad')
  if (!ads.length) return [value, []]
  const rest = root.children.filter((n) => !ads.includes(n))
  return [{ ...value, root: { ...root, children: rest } } as T, ads]
}
