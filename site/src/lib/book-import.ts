import { createHash } from 'crypto'
import path from 'path'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from './dom'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import type { PayloadRequest } from 'payload'

import { bnNumber } from '../utilities/bn'
import { readStoredFile } from './files'

type RawChapter = { title: string; html: string }
type BookImage = { data: Buffer; name: string; mime: string }
/** Chapters plus the images they reference (by key, through a data-nl-img attribute). */
type Parsed = { chapters: RawChapter[]; images: Map<string, BookImage>; notes: string[] }
type BookDoc = {
  id: number | string
  title: string
  online?: { importFrom?: 'epub' | 'word'; wordFile?: unknown } | null
  ebook?: { epub?: unknown } | null
}

const BANGLA = /[ঀ-৿]/g
const LATIN = /[A-Za-z]/g
const SCENE_BREAK = /^\s*(?:(?:\*\s*){3,}|⁂|(?:•\s*){3})\s*$/
const TITLE_END = /[।?!.,;:’'"”…)]$/

const readUpload = async (req: PayloadRequest, ref: unknown): Promise<Buffer> => {
  const id = typeof ref === 'object' && ref ? (ref as { id: number }).id : ref
  const file = await req.payload.findByID({ collection: 'book-files', id: id as number, req, overrideAccess: true })
  return readStoredFile('book-files', file.filename ?? '')
}

const parseXml = (xml: string) => new JSDOM(xml, { contentType: 'application/xml' }).window.document
const parseHtml = (html: string) => new JSDOM(html).window.document
const textOf = (el: { textContent: string | null } | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

/** Google Docs wraps links as google.com/url?q=<real link>. */
const unwrapRedirect = (href: string) => {
  try {
    const url = new URL(href)
    if (/(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname === '/url') {
      return url.searchParams.get('q') ?? href
    }
  } catch {
    // relative or invalid link: leave as is
  }
  return href
}

/**
 * Keeps only content markup Lexical understands: unwraps <div>s, drops empty spacer
 * paragraphs, strips styling, unwraps Google redirect links, and keeps image markers.
 */
const cleanHtml = (html: string) => {
  const doc = parseHtml(`<body>${html}</body>`)
  doc.querySelectorAll('script, style, link, meta, title, svg, nav').forEach((el) => el.remove())
  doc.querySelectorAll('div, section, article').forEach((el) => {
    const hasBlocks = el.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, div, table, hr')
    if (hasBlocks) {
      el.replaceWith(...Array.from(el.childNodes))
    } else {
      const p = doc.createElement('p')
      p.innerHTML = el.innerHTML
      el.replaceWith(p)
    }
  })
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const keep = (el.tagName === 'A' && attr.name === 'href') || (el.tagName === 'IMG' && attr.name === 'data-nl-img')
      if (!keep) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'A' && el.getAttribute('href')) el.setAttribute('href', unwrapRedirect(el.getAttribute('href')!))
  })
  // Images that could not be read have no marker; they cannot be shown, so drop them.
  doc.querySelectorAll('img:not([data-nl-img])').forEach((el) => el.remove())
  doc.querySelectorAll('p').forEach((p) => {
    if (!textOf(p) && !p.querySelector('img')) p.remove()
  })
  return doc.body.innerHTML
}

/** Footnote references become links to this address, then footnote nodes after conversion. */
export const FOOTNOTE_MARK = 'https://nl-fn.invalid/'

const NOTE_ID = /^(ftnt|fn|footnote|endnote|note)/i
const BLOCKS = 'li, aside, p, div, section, dd'

/** The last non-empty text node before `node`, inside the same paragraph. */
function textBefore(node: Node): Text | null {
  let current: Node | null = node
  while (current) {
    if (current.previousSibling) {
      current = current.previousSibling
      while (current.lastChild) current = current.lastChild
      if (current.nodeType === 3 && current.textContent?.trim()) return current as Text
      continue
    }
    current = current.parentNode
    if (!current || (current as Element).matches?.('p, li, h1, h2, h3, h4, blockquote, body')) return null
  }
  return null
}

/**
 * Finds footnotes (Google Docs, Word and EPUB 3 styles): each reference becomes a marked
 * link on the word before it, and the note bodies are removed from the text.
 * Works across files (`file` is the document's path inside the EPUB).
 */
function extractFootnotes(docs: { file: string; body: HTMLElement }[], notes: string[]) {
  const byId = new Map<string, Element>()
  for (const { file, body } of docs) body.querySelectorAll('[id]').forEach((el) => byId.set(`${file}#${el.id}`, el))

  // 1. Pair references with note bodies.
  const pairs: { ref: Element; text: string }[] = []
  const noteBlocks = new Set<Element>()
  for (const { file, body } of docs) {
    for (const a of Array.from(body.querySelectorAll('a[href*="#"]'))) {
      const [target, id] = (a.getAttribute('href') ?? '').split('#')
      if (!id) continue
      const el = byId.get(`${target ? resolveZipPath(file, target) : file}#${decodeURIComponent(id)}`)
      if (!el) continue
      const block = el.closest(BLOCKS) ?? el
      if (block.contains(a)) continue // the back-link inside a note
      // A note is the target element itself or starts with it ([1] …); a back-link points
      // into the middle of a paragraph instead, so that pairing is skipped.
      if (el !== block && !textOf(block).startsWith(textOf(el))) continue
      const linksBack = Boolean(a.id && block.querySelector(`a[href$="#${a.id}"]`))
      const typed =
        /noteref/.test(a.getAttribute('epub:type') ?? '') ||
        /footnote|endnote|note/.test(block.getAttribute('epub:type') ?? '')
      if (!linksBack && !typed && !NOTE_ID.test(id)) continue
      const copy = block.cloneNode(true) as Element
      copy.querySelectorAll('a[href*="#"]').forEach((back) => {
        if (/^\[?\s*[\d০-৯]+\s*\]?$|^[↑↩^]$/.test(back.textContent?.trim() ?? '')) back.remove()
      })
      const text = (copy.textContent ?? '')
        .replace(/\s+/g, ' ')
        .replace(/^\s*\[?[\d০-৯]+\]?[.)]?\s*/, '')
        .trim()
      if (!text) continue
      pairs.push({ ref: a, text })
      noteBlocks.add(block)
    }
  }

  // 2. Turn each reference into a link on the preceding word.
  for (const { ref, text } of pairs) {
    if ([...noteBlocks].some((block) => block.contains(ref))) continue // references inside notes
    const doc = ref.ownerDocument
    const parent = ref.parentElement
    const marker = parent?.tagName === 'SUP' && parent.childNodes.length === 1 ? parent : ref
    const link = doc.createElement('a')
    link.setAttribute('href', `${FOOTNOTE_MARK}${notes.length}`)
    notes.push(text)
    const before = textBefore(marker)
    const match = before?.data.match(/(\S+)\s*$/)
    if (before && match) {
      before.data = before.data.slice(0, match.index)
      link.textContent = match[1]
      before.parentNode!.insertBefore(link, before.nextSibling)
      marker.remove()
    } else {
      link.textContent = '*'
      marker.replaceWith(link)
    }
  }

  // 3. Remove the note bodies, containers left empty, and a trailing divider before them.
  for (const block of noteBlocks) {
    let parent = block.parentElement
    block.remove()
    while (parent && parent.tagName !== 'BODY' && !parent.textContent?.trim() && !parent.querySelector('img')) {
      const next = parent.parentElement
      parent.remove()
      parent = next
    }
  }
  for (const { body } of docs) {
    while (body.lastElementChild?.tagName === 'HR') body.lastElementChild.remove()
  }
}

/**
 * Splits one document into chapters: at headings (h1/h2) if it has them, otherwise at
 * page breaks (<hr>, as in EPUBs made from Google Docs). Without either it stays whole.
 */
function splitDocument(html: string, fallbackTitle: (indexInDocument: number) => string): RawChapter[] {
  const body = parseHtml(`<body>${html}</body>`).body
  const blocks = Array.from(body.children)
  const headings = blocks.filter((b) => b.tagName === 'H1' || b.tagName === 'H2')
  const byHeading = headings.length > 0
  const sections: Element[][] = [[]]
  for (const block of blocks) {
    const isBreak = byHeading ? headings.includes(block) : block.tagName === 'HR'
    if (isBreak) {
      sections.push(byHeading ? [block] : [])
    } else {
      sections.at(-1)!.push(block)
    }
  }

  const chapters: RawChapter[] = []
  for (const section of sections) {
    const text = section.map(textOf).join(' ').trim()
    if (text.length < 2) continue // cover or image-only page
    let title: string | undefined
    const first = section[0]
    if (byHeading && (first?.tagName === 'H1' || first?.tagName === 'H2')) {
      title = textOf(first)
      section.shift()
    } else if (!byHeading && first) {
      // A short first line that isn't a sentence (e.g. “উৎসর্গ”) is the section title.
      const line = textOf(first)
      if (line && line.length <= 40 && !TITLE_END.test(line) && section.length > 1) {
        title = line
        section.shift()
      }
    }
    // Scene breaks like *** become a divider.
    const sectionHtml = section
      .map((b) => (b.tagName === 'P' && SCENE_BREAK.test(textOf(b)) ? '<hr>' : b.outerHTML))
      .join('')
    chapters.push({ title: title || fallbackTitle(chapters.length), html: sectionHtml })
  }
  return chapters
}

const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

const resolveZipPath = (base: string, href: string) =>
  path.posix.normalize(path.posix.join(path.posix.dirname(base), decodeURIComponent(href.split('#')[0])))

export async function parseEpub(buffer: Buffer, warnings: string[]): Promise<Parsed> {
  const zip = await JSZip.loadAsync(buffer)
  const container = await zip.file('META-INF/container.xml')?.async('string')
  if (!container) throw new Error('Not a valid EPUB (container.xml missing).')
  const opfPath = parseXml(container).querySelector('rootfile')?.getAttribute('full-path')
  if (!opfPath) throw new Error('Not a valid EPUB (package file missing).')
  const opf = parseXml((await zip.file(opfPath)?.async('string')) ?? '')

  const manifest = new Map<string, { href: string; props: string; type: string }>()
  opf.querySelectorAll('manifest > item').forEach((item) => {
    manifest.set(item.getAttribute('id') ?? '', {
      href: resolveZipPath(opfPath, item.getAttribute('href') ?? ''),
      props: item.getAttribute('properties') ?? '',
      type: item.getAttribute('media-type') ?? '',
    })
  })

  // Titles from the table of contents (EPUB 3 nav, or EPUB 2 NCX), per file.
  const tocTitles = new Map<string, string>()
  const nav = [...manifest.values()].find((m) => m.props.includes('nav'))
  if (nav) {
    const doc = parseHtml((await zip.file(nav.href)?.async('string')) ?? '')
    doc.querySelectorAll('nav a[href]').forEach((a) => {
      const file = resolveZipPath(nav.href, a.getAttribute('href') ?? '')
      if (!tocTitles.has(file)) tocTitles.set(file, textOf(a))
    })
  } else {
    const ncx = [...manifest.values()].find((m) => m.type === 'application/x-dtbncx+xml')
    if (ncx) {
      const doc = parseXml((await zip.file(ncx.href)?.async('string')) ?? '')
      doc.querySelectorAll('navPoint').forEach((point) => {
        const src = point.querySelector('content')?.getAttribute('src')
        const label = textOf(point.querySelector('navLabel text'))
        if (src && label) {
          const file = resolveZipPath(ncx.href, src)
          if (!tocTitles.has(file)) tocTitles.set(file, label)
        }
      })
    }
  }

  const chapters: RawChapter[] = []
  const images = new Map<string, BookImage>()
  const fallback = (indexInDocument: number) => `অধ্যায় ${bnNumber(chapters.length + indexInDocument + 1)}`

  // Read every document first, so footnotes can be matched across files.
  const notes: string[] = []
  const docs: { file: string; body: HTMLElement }[] = []
  for (const ref of Array.from(opf.querySelectorAll('spine > itemref'))) {
    const item = manifest.get(ref.getAttribute('idref') ?? '')
    if (!item || item.props.includes('nav')) continue
    const source = await zip.file(item.href)?.async('string')
    if (source) docs.push({ file: item.href, body: parseHtml(source).body })
  }
  extractFootnotes(docs, notes)

  for (const { file, body } of docs) {
    const item = { href: file }

    // Read images from the EPUB and mark them so they can be uploaded later.
    for (const img of Array.from(body.querySelectorAll('img'))) {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('http')) continue
      const file = resolveZipPath(item.href, src)
      const ext = path.extname(file).toLowerCase()
      const data = await zip.file(file)?.async('nodebuffer')
      if (data && IMAGE_TYPES[ext]) {
        images.set(file, { data, name: path.basename(file), mime: IMAGE_TYPES[ext] })
        img.setAttribute('data-nl-img', file)
      }
    }

    const parts = splitDocument(cleanHtml(body.innerHTML), fallback)
    // A whole-file chapter takes its title from the table of contents when it has none.
    if (parts.length === 1 && /^অধ্যায় /.test(parts[0].title) && tocTitles.get(item.href)) {
      parts[0].title = tocTitles.get(item.href)!
    }
    for (const part of parts) chapters.push(part)
  }
  if (chapters.length === 1) {
    warnings.push(
      'Only one chapter was found. To split the book, use Heading 1 for chapter titles (or page breaks) before making the EPUB.',
    )
  }
  return { chapters, images, notes }
}

export async function parseWord(buffer: Buffer, warnings: string[]): Promise<Parsed> {
  const images = new Map<string, BookImage>()
  const { value } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const data = Buffer.from(await image.readAsBase64String(), 'base64')
        const key = createHash('sha1').update(data).digest('hex')
        const ext = Object.entries(IMAGE_TYPES).find(([, mime]) => mime === image.contentType)?.[0] ?? '.png'
        images.set(key, { data, name: `${key.slice(0, 12)}${ext}`, mime: image.contentType })
        return { src: '', 'data-nl-img': key } as { src: string }
      }),
    },
  )
  const chapters: RawChapter[] = []
  const notes: string[] = []
  const raw = parseHtml(`<body>${value}</body>`).body
  extractFootnotes([{ file: '', body: raw }], notes)
  const html = cleanHtml(raw.innerHTML)
  if (!/<h1[\s>]/i.test(html)) {
    warnings.push('No “Heading 1” found, so the whole file became one chapter. Mark chapter titles as Heading 1 in Word.')
  }
  // In Word files only Heading 1 starts a chapter (Heading 2 stays a sub-heading).
  const body = parseHtml(`<body>${html}</body>`).body
  let current: RawChapter = { title: 'ভূমিকা', html: '' }
  for (const node of Array.from(body.children)) {
    if (node.tagName === 'H1') {
      if (textOf(parseHtml(`<body>${current.html}</body>`).body)) chapters.push(current)
      current = { title: textOf(node) || `অধ্যায় ${bnNumber(chapters.length + 1)}`, html: '' }
    } else {
      current.html += node.tagName === 'P' && SCENE_BREAK.test(textOf(node)) ? '<hr>' : node.outerHTML
    }
  }
  if (textOf(parseHtml(`<body>${current.html}</body>`).body)) chapters.push(current)
  return { chapters, images, notes }
}

/** Uploads the book's images to the media library and points the markers at them. */
async function attachImages(parsed: Parsed, book: BookDoc, req: PayloadRequest) {
  const ids = new Map<string, number>()
  for (const [key, image] of parsed.images) {
    if (!parsed.chapters.some((c) => c.html.includes(`data-nl-img="${key}"`))) continue
    const media = await req.payload.create({
      collection: 'media',
      data: { alt: `${book.title} — ছবি` },
      file: { data: image.data, mimetype: image.mime, name: image.name, size: image.data.length },
      req,
    })
    ids.set(key, media.id)
  }
  for (const chapter of parsed.chapters) {
    chapter.html = chapter.html.replace(/data-nl-img="([^"]+)"/g, (_, key: string) =>
      ids.has(key) ? `data-lexical-upload-id="${ids.get(key)}" data-lexical-upload-relation-to="media"` : '',
    )
  }
  return ids.size
}

type LexicalNode = {
  type?: string
  value?: unknown
  fields?: Record<string, unknown>
  children?: LexicalNode[]
}

/** Links pointing at FOOTNOTE_MARK + n become footnotes with the note text. */
const toFootnotes = (node: LexicalNode, notes: string[]) => {
  const url = node.type === 'link' ? String(node.fields?.url ?? '') : ''
  if (url.startsWith(FOOTNOTE_MARK)) {
    const note = notes[Number(url.slice(FOOTNOTE_MARK.length))] ?? ''
    node.fields = { ...node.fields, linkType: 'footnote', note, url: '', newTab: false }
  }
  node.children?.forEach((child) => toFootnotes(child, notes))
}

/** Upload ids come out of HTML as strings; the database uses numbers. */
const fixUploadIds = (node: LexicalNode) => {
  if (node.type === 'upload' && typeof node.value === 'string' && /^\d+$/.test(node.value)) {
    node.value = Number(node.value)
  }
  node.children?.forEach(fixUploadIds)
}

export class ImportError extends Error {}

/**
 * Imports chapters for a book and returns a report for the admin panel.
 * Throws ImportError when nothing could be imported, so the admin sees an error on save.
 */
export async function importBookChapters({ book, req }: { book: BookDoc; req: PayloadRequest }) {
  const warnings: string[] = []
  const fromWord = book.online?.importFrom === 'word'
  const fileRef = fromWord ? book.online?.wordFile : book.ebook?.epub
  if (!fileRef) {
    throw new ImportError(
      fromWord ? 'Upload a Word file first.' : 'Add the EPUB file in the “EPUB & Kindle” tab first.',
    )
  }

  let parsed: Parsed
  try {
    const buffer = await readUpload(req, fileRef)
    parsed = fromWord ? await parseWord(buffer, warnings) : await parseEpub(buffer, warnings)
  } catch (error) {
    throw new ImportError(`The file could not be read: ${(error as Error).message}`)
  }
  if (!parsed.chapters.length) throw new ImportError('No chapters with text were found in the file.')

  const allText = parsed.chapters.map((c) => textOf(parseHtml(`<body>${c.html}</body>`).body)).join(' ')
  const bangla = allText.match(BANGLA)?.length ?? 0
  const latin = allText.match(LATIN)?.length ?? 0
  if (bangla < latin * 0.2) {
    warnings.push(
      'The text has very few Unicode Bangla letters. If it looks like gibberish, the file uses Bijoy/SutonnyMJ — convert it to Unicode and import again.',
    )
  }

  const imageCount = await attachImages(parsed, book, req)
  const editorConfig = await editorConfigFactory.default({ config: req.payload.config })
  const existing = await req.payload.find({
    collection: 'chapters',
    where: { book: { equals: book.id } },
    limit: 1000,
    depth: 0,
    req,
  })
  const byTitle = new Map(existing.docs.map((d) => [d.title.trim(), d]))
  let created = 0
  let updated = 0

  for (const [index, chapter] of parsed.chapters.entries()) {
    const content = convertHTMLToLexical({ editorConfig, html: chapter.html, JSDOM })
    fixUploadIds(content.root as LexicalNode)
    toFootnotes(content.root as LexicalNode, parsed.notes)
    const match = byTitle.get(chapter.title.trim())
    const data = { book: book.id as number, title: chapter.title, order: index + 1, content }
    try {
      if (match) {
        byTitle.delete(chapter.title.trim())
        await req.payload.update({ collection: 'chapters', id: match.id, data, req })
        updated++
      } else {
        await req.payload.create({ collection: 'chapters', data, req })
        created++
      }
    } catch (error) {
      throw new ImportError(`Chapter ${index + 1} (“${chapter.title}”) could not be saved: ${(error as Error).message}`)
    }
  }
  for (const leftover of byTitle.values()) {
    await req.payload.delete({ collection: 'chapters', id: leftover.id, req })
  }

  return [
    `✓ ${new Date().toLocaleString('en-GB')}: ${parsed.chapters.length} chapters (${created} new, ${updated} updated, ${byTitle.size} removed), ${imageCount} image(s), ${parsed.notes.length} footnote(s).`,
    ...parsed.chapters.map((c, i) => `  ${i + 1}. ${c.title}`),
    ...warnings.map((w) => `⚠ ${w}`),
    'Check the chapters under Library → Chapters: you can rename, reorder or delete them.',
  ].join('\n')
}
