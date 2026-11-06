import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'

import { parseEpub, parseWord } from '@/lib/book-import'

/** An EPUB shaped like a Google Docs export: one file, sections split by page breaks (<hr>). */
async function googleDocsEpub() {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip')
  zip.file(
    'META-INF/container.xml',
    '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>',
  )
  zip.file(
    'content.opf',
    `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest>
      <item id="main" href="Doc/Untitled.xhtml" media-type="application/xhtml+xml"/>
      <item id="img" href="Doc/images/pic.png" media-type="image/png"/>
    </manifest><spine><itemref idref="main"/></spine></package>`,
  )
  zip.file('Doc/images/pic.png', Buffer.from('89504e470d0a1a0a', 'hex'))
  zip.file(
    'Doc/Untitled.xhtml',
    `<html xmlns="http://www.w3.org/1999/xhtml"><body>
      <p><span><img src="images/pic.png"/></span></p>
      <hr/>
      <p class="c4"><span>উৎসর্গ</span></p><p><span>সবাইকে</span></p><p><span></span></p>
      <hr/>
      <p><span>গল্পের প্রথম লাইন।</span></p>
      <p><span>***</span></p>
      <p><span>আরেক দৃশ্য। <a href="https://www.google.com/url?q=https://www.facebook.com/nonsenseAtoZ/&amp;sa=D">পেজ</a></span></p>
    </body></html>`,
  )
  return zip.generateAsync({ type: 'nodebuffer' })
}

describe('EPUB import', () => {
  it('splits a single-file Google Docs EPUB at page breaks and cleans it up', async () => {
    const warnings: string[] = []
    const { chapters, images } = await parseEpub(await googleDocsEpub(), warnings)

    // Image-only cover section is skipped; the two text sections become chapters.
    expect(chapters.map((c) => c.title)).toEqual(['উৎসর্গ', 'অধ্যায় ২'])
    // Empty spacer paragraphs are removed.
    expect(chapters[0].html).toBe('<p><span>সবাইকে</span></p>')
    // *** becomes a scene-break divider; Google redirect links are unwrapped.
    expect(chapters[1].html).toContain('<hr>')
    expect(chapters[1].html).toContain('href="https://www.facebook.com/nonsenseAtoZ/"')
    // Images are read from the EPUB and marked for upload.
    expect([...images.keys()]).toEqual(['Doc/images/pic.png'])
  })

  it('rejects files that are not EPUBs', async () => {
    const zip = new JSZip()
    zip.file('hello.txt', 'not a book')
    await expect(parseEpub(await zip.generateAsync({ type: 'nodebuffer' }), [])).rejects.toThrow('Not a valid EPUB')
  })
})

/** A minimal .docx with paragraph styles, built in memory. */
async function docx(paragraphs: [style: string, text: string][]) {
  const zip = new JSZip()
  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  )
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  )
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
  )
  zip.file('word/styles.xml', `<?xml version="1.0"?><w:styles xmlns:w="${ns}"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>`)
  const body = paragraphs
    .map(([style, text]) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t>${text}</w:t></w:r></w:p>`)
    .join('')
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="${ns}"><w:body>${body}</w:body></w:document>`)
  return zip.generateAsync({ type: 'nodebuffer' })
}

describe('Word import', () => {
  it('starts a chapter at every Heading 1', async () => {
    const warnings: string[] = []
    const { chapters } = await parseWord(
      await docx([
        ['Heading1', 'প্রথম অধ্যায়'],
        ['', 'প্রথম লেখা।'],
        ['', '***'],
        ['Heading1', 'দ্বিতীয় অধ্যায়'],
        ['', 'দ্বিতীয় লেখা।'],
      ]),
      warnings,
    )
    expect(chapters.map((c) => c.title)).toEqual(['প্রথম অধ্যায়', 'দ্বিতীয় অধ্যায়'])
    expect(chapters[0].html).toBe('<p>প্রথম লেখা।</p><hr>')
    expect(warnings).toEqual([])
  })

  it('warns when there are no Heading 1 titles', async () => {
    const warnings: string[] = []
    const { chapters } = await parseWord(await docx([['', 'শুধু লেখা।']]), warnings)
    expect(chapters).toHaveLength(1)
    expect(warnings[0]).toContain('Heading 1')
  })
})

/** One-file EPUB with the given body (and optional extra files). */
async function epubWith(body: string, extra: Record<string, string> = {}, spine = ['main']) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip')
  zip.file(
    'META-INF/container.xml',
    '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>',
  )
  const items = Object.keys(extra).map((name) => `<item id="${name.split('.')[0]}" href="${name}" media-type="application/xhtml+xml"/>`)
  zip.file(
    'content.opf',
    `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="main" href="main.xhtml" media-type="application/xhtml+xml"/>${items.join('')}</manifest><spine>${spine.map((id) => `<itemref idref="${id}"/>`).join('')}</spine></package>`,
  )
  zip.file('main.xhtml', `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body>${body}</body></html>`)
  for (const [name, content] of Object.entries(extra)) zip.file(name, content)
  return zip.generateAsync({ type: 'nodebuffer' })
}

describe('footnote import', () => {
  it('Google Docs footnotes attach to the word before the number', async () => {
    const { chapters, notes } = await parseEpub(
      await epubWith(
        `<p>ওটা একটা জ্বিনের<sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup> লাশ।</p><p>দ্বিতীয় লাইন।</p>
         <hr/><div><p><a href="#ftnt_ref1" id="ftnt1">[1]</a> আরবি পুরাণের অশরীরী।</p></div>`,
      ),
      [],
    )
    expect(notes).toEqual(['আরবি পুরাণের অশরীরী।'])
    expect(chapters).toHaveLength(1) // the note block and its divider are removed
    expect(chapters[0].html).toContain('ওটা একটা <a href="https://nl-fn.invalid/0">জ্বিনের</a> লাশ।')
    expect(chapters[0].html).not.toContain('আরবি পুরাণের')
  })

  it('EPUB 3 footnotes in another file are found too', async () => {
    const { chapters, notes } = await parseEpub(
      await epubWith(
        '<p>কায়রো<a epub:type="noteref" href="notes.xhtml#n1">১</a> শহর।</p><p>আরও লেখা।</p>',
        {
          'notes.xhtml':
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><aside epub:type="footnote" id="n1"><p>মিসরের রাজধানী।</p></aside></body></html>',
        },
        ['main', 'notes'],
      ),
      [],
    )
    expect(notes).toEqual(['মিসরের রাজধানী।'])
    expect(chapters).toHaveLength(1) // the notes-only file disappears
    expect(chapters[0].html).toContain('<a href="https://nl-fn.invalid/0">কায়রো</a>')
  })

  it('Word footnotes become footnotes', async () => {
    const zip = new JSZip()
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    zip.file(
      '[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>',
    )
    zip.file(
      '_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    )
    zip.file(
      'word/_rels/document.xml.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>',
    )
    zip.file(
      'word/footnotes.xml',
      `<?xml version="1.0"?><w:footnotes xmlns:w="${ns}"><w:footnote w:id="1"><w:p><w:r><w:t>জাদুবিদ্যা মন্ত্রণালয়।</w:t></w:r></w:p></w:footnote></w:footnotes>`,
    )
    zip.file(
      'word/document.xml',
      `<?xml version="1.0"?><w:document xmlns:w="${ns}"><w:body><w:p><w:r><w:t xml:space="preserve">ফাতেমা মিনিস্ট্রিতে</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r><w:r><w:t xml:space="preserve"> কাজ করে।</w:t></w:r></w:p></w:body></w:document>`,
    )
    const { chapters, notes } = await parseWord(await zip.generateAsync({ type: 'nodebuffer' }), [])
    expect(notes).toEqual(['জাদুবিদ্যা মন্ত্রণালয়।'])
    expect(chapters[0].html).toContain('<a href="https://nl-fn.invalid/0">মিনিস্ট্রিতে</a>')
    expect(chapters[0].html).not.toContain('জাদুবিদ্যা')
  })
})
