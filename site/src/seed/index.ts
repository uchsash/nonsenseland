/**
 * Development seed: real categories and books, plus clearly marked sample (নমুনা)
 * videos and articles so every page can be checked. Run with: npm run seed
 * Safe to re-run: existing items (matched by slug) are left alone.
 */
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import JSZip from 'jszip'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { plainToRichText } from '../utilities/rich-text-plain'

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config })
const rich = (html: string) => convertHTMLToLexical({ editorConfig, html, JSDOM })

const findBySlug = async (collection: 'categories' | 'topics' | 'books' | 'videos' | 'articles' | 'pages', slug: string) =>
  (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })).docs[0]

/** Plain placeholder image (no text), so nothing pretends to be real artwork. */
async function placeholder(alt: string, color: string, width = 1600, height = 900) {
  const data = await sharp({ create: { width, height, channels: 3, background: color } }).png().toBuffer()
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype: 'image/png', name: `placeholder-${Date.now()}.png`, size: data.length },
  })
  return doc.id
}

// ---- Admin ----
const email = process.env.DEV_ADMIN_EMAIL
const password = process.env.DEV_ADMIN_PASSWORD
if (email && password) {
  const exists = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (!exists.totalDocs) {
    await payload.create({ collection: 'users', data: { email, password, name: 'Test admin', role: 'admin' } })
    payload.logger.info(`Created local test admin ${email}`)
  }
}

// ---- Categories & topics ----
const categoryIds: Record<string, number> = {}
const categories = [
  { name: 'ননসেন্স-আলাপ', slug: 'nonsense-alap', kind: 'video' },
  { name: 'বইপ্যাঁচাল', slug: 'boipyachal-video', kind: 'video' },
  { name: 'একগুচ্ছ বই', slug: 'ekguchchho-boi', kind: 'video' },
  { name: 'ফিচার', slug: 'feature', kind: 'article' },
  { name: 'গল্প', slug: 'golpo', kind: 'article' },
  { name: 'বইপ্যাঁচাল', slug: 'boipyachal', kind: 'article' },
  { name: 'পাঁচমিশালি', slug: 'pachmishali', kind: 'article' },
] as const
for (const [order, c] of categories.entries()) {
  const existing = await findBySlug('categories', c.slug)
  categoryIds[c.slug] = existing?.id ?? (await payload.create({ collection: 'categories', data: { ...c, order } })).id
}
const topicIds: number[] = []
for (const [name, slug] of [
  ['বিজ্ঞান', 'science'],
  ['মহাকাশ', 'space'],
  ['অনুবাদ', 'translation'],
]) {
  const existing = await findBySlug('topics', slug)
  topicIds.push(existing?.id ?? (await payload.create({ collection: 'topics', data: { name, slug } })).id)
}

// ---- Published books (real list; covers and descriptions to be added by the owner) ----
const ROKOMARI = 'https://www.rokomari.com/book/author/70009/uchsash-tousif'
const published = [
  ['বিজ্ঞানবিশের খসড়া খাতা', 'biggyanbisher-khosra-khata', 'writer', '', 500],
  ['ডেড জ্বিন ইউনিভার্স', 'dead-djinn-universe', 'translator', 'পি. জেলি ক্লার্ক', 400],
  ['অ্যান্টিম্যাটার', 'antimatter', 'translator', 'ফ্র‍্যাঙ্ক ক্লোজ', 350],
  ['রসায়ন: সহজ পাঠ', 'chemistry-easy-read', 'translator', 'পিটার অ্যাটকিনস', 400],
  ['সিক্স ইজি পিসেস', 'six-easy-pieces', 'translator', 'রিচার্ড পি. ফাইনম্যান', 400],
  ['অ্যাস্ট্রোফিজিকস ফর পিপল ইন আ হারি', 'astrophysics-for-people-in-a-hurry', 'translator', 'নীল ডিগ্র্যাস টাইসন', 400],
  ['দ্য ক্যারেক্টার অব ফিজিক্যাল ল', 'the-character-of-physical-law', 'translator', 'রিচার্ড ফাইনম্যান', 450],
  ['ফ্ল্যাটল্যান্ড', 'flatland', 'translator', 'এডুইন এ অ্যাবট', 275],
  ['হোমারের পদরেখা ধরে', 'following-homer', 'translator', 'লাজলো ক্রাসনাহোরকাই', 250],
] as const
for (const [order, [title, slug, role, originalAuthor, price]] of published.entries()) {
  if (await findBySlug('books', slug)) continue
  await payload.create({
    collection: 'books',
    draft: false,
    data: {
      title,
      slug,
      role,
      originalAuthor: originalAuthor || undefined,
      cover: await placeholder(`${title} — প্রচ্ছদ (নমুনা)`, '#e9e4dd', 600, 900),
      about: plainToRichText('বইটির বিবরণ এখানে যোগ করুন।'),
      order: order + 10,
      print: { enabled: true, buyLinks: [{ store: 'রকমারি', url: ROKOMARI, price }] },
      topics: [topicIds[0]],
      _status: 'published',
    },
  })
}

// ---- Free library: the two ready translations (EPUBs to be uploaded by the owner) ----
for (const [order, [title, slug, subtitle]] of [
  ['আ ডেড জ্বিন ইন কায়রো', 'a-dead-djinn-in-cairo', 'উপন্যাসিকা'],
  ['কাহো', 'kaho', 'গল্প'],
].entries()) {
  if (await findBySlug('books', slug)) continue
  await payload.create({
    collection: 'books',
    draft: true,
    data: {
      title,
      slug,
      subtitle,
      role: 'translator',
      cover: await placeholder(`${title} — প্রচ্ছদ (নমুনা)`, '#f3d9c9', 600, 900),
      about: plainToRichText('বইটির বিবরণ এখানে যোগ করুন। EPUB যোগ করে “Import chapters” চালালেই বইটি পড়া যাবে।'),
      order,
      online: { enabled: true, access: 'free' },
      _status: 'draft',
    },
  })
}

// ---- A sample EPUB book to test the importer and the reader ----
async function sampleEpub() {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
  )
  const chapters = [
    ['প্রথম অধ্যায়: শুরু', 'এটি একটি নমুনা বই। রিডারের সেটিংস — পটভূমি, হরফ, অক্ষরের আকার, লাইনের ফাঁক আর পাতার চওড়া — পরীক্ষা করার জন্য এই লেখা।'],
    ['দ্বিতীয় অধ্যায়: মাঝখান', 'পড়তে পড়তে বেরিয়ে গেলেও ভয় নেই; আবার এলে যেখানে থেমেছিলেন সেখান থেকেই শুরু করা যাবে।'],
    ['তৃতীয় অধ্যায়: শেষ', 'কিবোর্ডের ডান-বাম তীর চেপে এক অধ্যায় থেকে আরেক অধ্যায়ে যাওয়া যায়। এখানেই নমুনা বই শেষ।'],
  ]
  const para = (text: string) => Array.from({ length: 14 }, () => `<p>${text}</p>`).join('')
  chapters.forEach(([title, text], i) =>
    zip.file(
      `OEBPS/ch${i + 1}.xhtml`,
      `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head><body><h1>${title}</h1>${para(text)}</body></html>`,
    ),
  )
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol>${chapters
      .map(([title], i) => `<li><a href="ch${i + 1}.xhtml">${title}</a></li>`)
      .join('')}</ol></nav></body></html>`,
  )
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">nonsenseland-sample</dc:identifier><dc:title>নমুনা বই</dc:title><dc:language>bn</dc:language></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${chapters
      .map((_, i) => `<item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
      .join('')}</manifest><spine>${chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join('')}</spine></package>`,
  )
  return zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' })
}

if (!(await findBySlug('books', 'sample-book'))) {
  const data = await sampleEpub()
  const epub = await payload.create({
    collection: 'book-files',
    data: { note: 'নমুনা EPUB' },
    file: { data, mimetype: 'application/epub+zip', name: 'sample-book.epub', size: data.length },
  })
  // Creating with importNow runs the importer, exactly like the admin “import when I save” box.
  await payload.create({
    collection: 'books',
    draft: false,
    data: {
      title: 'নমুনা বই',
      slug: 'sample-book',
      subtitle: 'রিডার পরীক্ষার জন্য',
      role: 'writer',
      cover: await placeholder('নমুনা বইয়ের প্রচ্ছদ', '#f6efe1', 600, 900),
      about: plainToRichText('রিডার আর ইমপোর্ট পরীক্ষার জন্য একটি নমুনা বই। চালু করার আগে মুছে ফেলুন।'),
      order: 5,
      online: { enabled: true, access: 'free', importFrom: 'epub', importNow: true },
      ebook: { epub: epub.id, allowDownload: true, allowKindle: true },
      _status: 'published',
    },
  })
}

// ---- Sample videos & articles (নমুনা) ----
const colors = ['#f1c9b3', '#d9e2e6', '#e8e1d3', '#f3ddd0', '#dfe6dc', '#e6dde8']
const videoCats = ['nonsense-alap', 'boipyachal-video', 'ekguchchho-boi']
for (let i = 1; i <= 6; i++) {
  const slug = `sample-video-${i}`
  if (await findBySlug('videos', slug)) continue
  await payload.create({
    collection: 'videos',
    draft: false,
    data: {
      title: `নমুনা ভিডিও ${i}`,
      slug,
      url: `https://www.facebook.com/nonsenseAtoZ/videos/${1000000000000000 + i}`,
      thumbnail: await placeholder(`নমুনা ভিডিও ${i}`, colors[i - 1]),
      description: 'এটি একটি নমুনা। আসল ভিডিওর লিংক, থাম্বনেইল আর বিবরণ দিয়ে বদলে দিন।',
      duration: `${8 + i}:3${i}`,
      category: categoryIds[videoCats[i % 3]],
      publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
      _status: 'published',
    },
  })
}

const articleCats = ['feature', 'golpo', 'boipyachal', 'pachmishali']
const body = Array.from(
  { length: 12 },
  (_, i) =>
    `<p>নমুনা অনুচ্ছেদ ${i + 1}। এখানে আসল লেখা বসবে। লেখার মাঝে বিজ্ঞাপনের জায়গা, শেষে বইয়ের প্রচার আর শেয়ারের বোতাম কেমন দেখায়, তা দেখার জন্য এই লেখা।</p>${
      i === 5 ? '<h2>একটি উপশিরোনাম</h2><blockquote>একটি উদ্ধৃতি এভাবে দেখাবে।</blockquote>' : ''
    }`,
).join('')
const firstBook = await findBySlug('books', 'antimatter')
for (let i = 1; i <= 5; i++) {
  const slug = `sample-article-${i}`
  if (await findBySlug('articles', slug)) continue
  await payload.create({
    collection: 'articles',
    draft: false,
    data: {
      title: `নমুনা লেখা ${i}: শিরোনাম এখানে`,
      slug,
      cover: await placeholder(`নমুনা লেখা ${i}`, colors[(i + 2) % 6]),
      excerpt: 'এটি একটি নমুনা লেখা। কার্ডে আর শেয়ার করলে এই সারাংশ দেখাবে।',
      content: rich(body),
      category: categoryIds[articleCats[i % 4]],
      topics: [topicIds[i % 3]],
      relatedBook: i === 1 ? firstBook?.id : undefined,
      publishedAt: new Date(Date.now() - i * 2 * 86400000).toISOString(),
      _status: 'published',
    },
  })
}

// ---- Pages ----
if (!(await findBySlug('pages', 'about'))) {
  await payload.create({
    collection: 'pages',
    draft: false,
    data: {
      title: 'পরিচিতি',
      slug: 'about',
      showContactForm: true,
      _status: 'published',
      content: rich(
        '<p>[খসড়া — নিজের ভাষায় লিখে বদলে দিন]</p><p>ননসেন্সল্যান্ড: Talk. Anything and Everything. ভিডিও, লেখা আর বই নিয়ে উচ্ছ্বাস তৌসিফের আড্ডাখানা।</p><h2>আমার সম্পর্কে</h2><p>লেখক, অনুবাদক, বিজ্ঞানচিন্তার সহসম্পাদক।</p><h2>যোগাযোগ</h2><p>নিচের ফর্মে লিখুন, অথবা ইমেইল করুন।</p>',
      ),
    },
  })
}

// ---- Settings (only filled when empty, so the owner's edits are never overwritten) ----
const settings = await payload.findGlobal({ slug: 'site-settings' })
if (!settings.social?.length) {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      social: [
        { network: 'facebook', url: 'https://www.facebook.com/nonsenseAtoZ' },
        { network: 'instagram', url: 'https://instagram.com/nonsenseatoz' },
        { network: 'email', url: 'nonsensesland@gmail.com' },
      ],
    },
  })
}
const home = await payload.findGlobal({ slug: 'homepage' })
if (!home.sections?.length) {
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      sections: [
        { blockType: 'intro', enabled: true },
        { blockType: 'videos', enabled: true, title: 'ভিডিও', showFilters: true },
        { blockType: 'articles', enabled: true, title: 'লেখা' },
        { blockType: 'ad', enabled: true },
        { blockType: 'library', enabled: true, title: 'বিনামূল্যে পড়ুন' },
        { blockType: 'published', enabled: true, title: 'আমার প্রকাশিত বই' },
        { blockType: 'newsletter', enabled: true, title: 'নতুন লেখা আর ভিডিওর খবর পেতে', text: 'মাসে এক-দুইবার, এর বেশি নয়।' },
      ],
    },
  })
}

// Intro buttons jump to homepage sections: videos and the free books row.
const homeNow = await payload.findGlobal({ slug: 'homepage' })
const sectionId = (type: string) => homeNow.sections?.find((x) => x.blockType === type)?.id
if (!settings.introButtons?.length && sectionId('videos') && sectionId('library')) {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      introButtons: [
        { label: 'ভিডিও', section: sectionId('videos') },
        { label: 'বিনামূল্যে পড়ুন', section: sectionId('library') },
      ],
    },
  })
}

// Sample খুচরো আলাপ posts (নমুনা) so the deck can be seen; delete them in the admin.
if (!(await payload.count({ collection: 'alap' })).totalDocs) {
  const samples = [
    ['নমুনা আলাপ ১: এখানে ছোট একটা ভাবনা বা খবর লেখা থাকবে, ছবির সঙ্গে।', '#f3d9c9'],
    ['নমুনা আলাপ ২: প্রতিটা আলাপে একটা ছবি থাকে, তাই সব কার্ড একই মাপের।\nনতুন লাইনও রাখা যায়।', '#e8e1d3'],
    ['নমুনা আলাপ ৩: শেষটার পর আবার প্রথমটা ফিরে আসবে।', '#d9e2e6'],
  ] as const
  for (const [i, [text, color]] of samples.entries()) {
    await payload.create({
      collection: 'alap',
      data: {
        text,
        image: await placeholder(`নমুনা আলাপের ছবি ${i + 1}`, color, 1080, 1080),
        publishedAt: new Date(Date.now() - i * 3600_000).toISOString(),
      },
    })
  }
}
const homeSections = (await payload.findGlobal({ slug: 'homepage' })).sections ?? []
if (homeSections.length && !homeSections.some((s) => s.blockType === 'alap')) {
  const after = homeSections.findIndex((s) => s.blockType === 'articles')
  const sections = [...homeSections]
  sections.splice(after + 1, 0, { blockType: 'alap', enabled: true, title: 'খুচরো আলাপ' })
  await payload.updateGlobal({ slug: 'homepage', data: { sections } })
}

// A house ad promoting a published book.
if (!(await payload.count({ collection: 'ads' })).totalDocs) {
  await payload.create({
    collection: 'ads',
    data: {
      name: 'নমুনা: অ্যান্টিম্যাটার প্রচার',
      placement: 'anywhere',
      slots: ['home', 'article-end'],
      mode: 'house',
      image: await placeholder('অ্যান্টিম্যাটার বইয়ের প্রচার (নমুনা)', '#f15a24', 1200, 300),
      book: firstBook?.id,
      active: true,
    },
  })
}

const chapters = await payload.count({ collection: 'chapters' })
payload.logger.info(`Seed done. Chapters in the database: ${chapters.totalDocs}`)
process.exit(0)
