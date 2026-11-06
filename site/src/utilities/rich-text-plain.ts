type Node = { type?: string; text?: string; children?: Node[] }

/** Plain text from Lexical rich text: one line per paragraph or heading. */
export function richTextToPlain(value: unknown): string {
  const root = (value as { root?: Node } | null)?.root
  if (!root) return ''
  const walk = (node: Node): string =>
    node.type === 'text' ? (node.text ?? '') : node.type === 'linebreak' ? '\n' : (node.children ?? []).map(walk).join('')
  return (root.children ?? [])
    .map(walk)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

/** Lexical rich text from plain text: one paragraph per line. */
export function plainToRichText(text: string) {
  const paragraphs = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      type: 'paragraph',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      textFormat: 0,
      textStyle: '',
      children: [{ type: 'text', version: 1, text: line, format: 0, style: '', mode: 'normal', detail: 0 }],
    }))
  return { root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: paragraphs } }
}

/** A short summary (for sharing and search results), cut at a word boundary. */
export function summarize(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trim()}…`
}
