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
