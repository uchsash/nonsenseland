import path from 'path'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import type { PayloadRequest } from 'payload'

import { readStoredFile } from './files'

type RawChapter = { title: string; html: string }
type BookDoc = {
  id: number | string
  title: string
  online?: { importFrom?: 'epub' | 'word'; wordFile?: unknown } | null
  ebook?: { epub?: unknown } | null
}

const BANGLA = /[ঀ-৿]/g
const LATIN = /[A-Za-z]/g

const readUpload = async (req: PayloadRequest, ref: unknown): Promise<Buffer> => {
  const id = typeof ref === 'object' && ref ? (ref as { id: number }).id : ref
  const file = await req.payload.findByID({ collection: 'book-files', id: id as number, req, overrideAccess: true })
  return readStoredFile('book-files', file.filename ?? '')
}

const parseXml = (xml: string) => new JSDOM(xml, { contentType: 'application/xml' }).window.document
const parseHtml = (html: string) => new JSDOM(html).window.document

/** Keeps only content markup Lexical understands; turns plain <div>s into paragraphs. */
const cleanHtml = (html: string) => {
  const doc = parseHtml(`<body>${html}</body>`)
  doc.querySelectorAll('script, style, link, meta, title, svg, nav').forEach((el) => el.remove())
  doc.querySelectorAll('div, section, article').forEach((el) => {
    const hasBlocks = el.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, div, table')
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
      if (!(el.tagName === 'A' && attr.name === 'href')) el.removeAttribute(attr.name)
    }
  })
  return doc.body.innerHTML
}

const textOf = (html: string) => parseHtml(`<body>${html}</body>`).body.textContent?.replace(/\s+/g, ' ').trim() ?? ''

/** Removes a leading heading that repeats the chapter title (the reader shows the title itself). */
const dropTitleHeading = (html: string, title: string) => {
  const doc = parseHtml(`<body>${html}</body>`)
  const first = doc.body.querySelector('h1, h2, h3')
  if (first && first.textContent?.trim() === title.trim()) first.remove()
  return doc.body.innerHTML
}

const resolveZipPath = (base: string, href: string) =>
  path.posix.normalize(path.posix.join(path.posix.dirname(base), decodeURIComponent(href.split('#')[0])))

async function chaptersFromEpub(buffer: Buffer, warnings: string[]): Promise<RawChapter[]> {
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

  // Titles from the table of contents (EPUB 3 nav, or EPUB 2 NCX).
  const tocTitles = new Map<string, string>()
  const nav = [...manifest.values()].find((m) => m.props.includes('nav'))
  if (nav) {
    const doc = parseHtml((await zip.file(nav.href)?.async('string')) ?? '')
    doc.querySelectorAll('nav a[href]').forEach((a) => {
      const file = resolveZipPath(nav.href, a.getAttribute('href') ?? '')
      if (!tocTitles.has(file)) tocTitles.set(file, a.textContent?.trim() ?? '')
    })
  } else {
    const ncx = [...manifest.values()].find((m) => m.type === 'application/x-dtbncx+xml')
    if (ncx) {
      const doc = parseXml((await zip.file(ncx.href)?.async('string')) ?? '')
      doc.querySelectorAll('navPoint').forEach((point) => {
        const src = point.querySelector('content')?.getAttribute('src')
        const label = point.querySelector('navLabel text')?.textContent?.trim()
        if (src && label) {
          const file = resolveZipPath(ncx.href, src)
          if (!tocTitles.has(file)) tocTitles.set(file, label)
        }
      })
    }
  }

  const chapters: RawChapter[] = []
  let images = 0
  for (const ref of Array.from(opf.querySelectorAll('spine > itemref'))) {
    const item = manifest.get(ref.getAttribute('idref') ?? '')
    if (!item || item.props.includes('nav')) continue
    const source = await zip.file(item.href)?.async('string')
    if (!source) continue
    const body = parseHtml(source).body
    images += body.querySelectorAll('img, image').length
    const html = cleanHtml(body.innerHTML)
    if (textOf(html).length < 2) continue // cover or image-only page
    const heading = body.querySelector('h1, h2, h3')?.textContent?.trim()
    const title = tocTitles.get(item.href) || heading || `অধ্যায় ${chapters.length + 1}`
    chapters.push({ title, html: dropTitleHeading(html, title) })
  }
  if (images) warnings.push(`${images} image(s) in the EPUB were not imported; add them in the chapter editor if needed.`)
  return chapters
}

async function chaptersFromWord(buffer: Buffer, warnings: string[]): Promise<RawChapter[]> {
  const { value } = await mammoth.convertToHtml({ buffer })
  const body = parseHtml(value).body
  const chapters: RawChapter[] = []
  let current: RawChapter = { title: 'ভূমিকা', html: '' }
  for (const node of Array.from(body.children)) {
    if (node.tagName === 'H1') {
      if (textOf(current.html)) chapters.push(current)
      current = { title: node.textContent?.trim() || `অধ্যায় ${chapters.length + 1}`, html: '' }
    } else {
      current.html += node.outerHTML
    }
  }
  if (textOf(current.html)) chapters.push(current)
  if (!body.querySelector('h1')) {
    warnings.push('No “Heading 1” found, so the whole file became one chapter. Mark chapter titles as Heading 1 in Word.')
  }
  if (body.querySelector('img')) warnings.push('Images in the Word file were not imported.')
  return chapters.map((c) => ({ ...c, html: cleanHtml(c.html) }))
}

/** Imports chapters for a book. Returns a human-readable report for the admin panel. */
export async function importBookChapters({ book, req }: { book: BookDoc; req: PayloadRequest }) {
  const warnings: string[] = []
  try {
    const fromWord = book.online?.importFrom === 'word'
    const fileRef = fromWord ? book.online?.wordFile : book.ebook?.epub
    if (!fileRef) {
      return fromWord
        ? 'Nothing imported: upload a Word file first.'
        : 'Nothing imported: add the EPUB file in the “EPUB & Kindle” tab first.'
    }

    const buffer = await readUpload(req, fileRef)
    const raw = fromWord ? await chaptersFromWord(buffer, warnings) : await chaptersFromEpub(buffer, warnings)
    if (!raw.length) return 'Nothing imported: no chapters with text were found in the file.'

    const allText = raw.map((c) => textOf(c.html)).join(' ')
    const bangla = allText.match(BANGLA)?.length ?? 0
    const latin = allText.match(LATIN)?.length ?? 0
    if (bangla < latin * 0.2) {
      warnings.push(
        'The text has very few Unicode Bangla letters. If it looks like gibberish, the file uses Bijoy/SutonnyMJ — convert it to Unicode and import again.',
      )
    }

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

    for (const [index, chapter] of raw.entries()) {
      const content = convertHTMLToLexical({ editorConfig, html: chapter.html, JSDOM })
      const match = byTitle.get(chapter.title.trim())
      const data = { book: book.id as number, title: chapter.title, order: index + 1, content }
      if (match) {
        byTitle.delete(chapter.title.trim())
        await req.payload.update({ collection: 'chapters', id: match.id, data, req })
        updated++
      } else {
        await req.payload.create({ collection: 'chapters', data, req })
        created++
      }
    }
    for (const leftover of byTitle.values()) {
      await req.payload.delete({ collection: 'chapters', id: leftover.id, req })
    }

    const lines = [
      `✓ ${new Date().toLocaleString('en-GB')}: ${raw.length} chapters (${created} new, ${updated} updated, ${byTitle.size} removed).`,
      ...raw.map((c, i) => `  ${i + 1}. ${c.title}`),
      ...warnings.map((w) => `⚠ ${w}`),
    ]
    return lines.join('\n')
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Book import failed')
    return `✗ Import failed: ${(error as Error).message}`
  }
}
