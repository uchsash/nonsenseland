import path from 'path'

import sharp, { type OverlayOptions } from 'sharp'

/**
 * Automatic video thumbnail (1280×720): the logo, the category, the title in Bangla and
 * the caricature in front of a logo-style ring. Used when a video has no thumbnail.
 */
const W = 1280
const H = 720
const ASSETS = path.resolve(process.cwd(), 'src/assets')
const FONT_BOLD = path.join(ASSETS, 'fonts/HindSiliguri-SemiBold.ttf')
const FONT_MEDIUM = path.join(ASSETS, 'fonts/HindSiliguri-Medium.ttf')

/** Ring colours from the logo; each category gets one so the cards are not all alike. */
const RINGS = ['#f15a24', '#f19224', '#f47335']

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Bangla text rendered with the real font (proper যুক্তাক্ষর shaping). */
const text = (value: string, { size, color, bold = true, width }: { size: number; color: string; bold?: boolean; width: number }) =>
  sharp({
    text: {
      text: `<span foreground="${color}">${escape(value)}</span>`,
      font: `Hind Siliguri ${bold ? 'SemiBold' : 'Medium'} ${size}`,
      fontfile: bold ? FONT_BOLD : FONT_MEDIUM,
      width,
      rgba: true,
      wrap: 'word',
      spacing: Math.round(size * 0.04),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })

/** The title at the largest size that fits in three lines. */
async function fitTitle(title: string, width: number) {
  for (const size of [66, 58, 50, 44, 38]) {
    const rendered = await text(title, { size, color: '#1c1b1a', width })
    if (rendered.info.height <= size * 1.45 * 3) return rendered
  }
  return text(title, { size: 34, color: '#1c1b1a', width })
}

export async function renderTitleCard({
  title,
  category,
  colorIndex = 0,
}: {
  title: string
  category?: string
  colorIndex?: number
}): Promise<Buffer> {
  const ring = RINGS[Math.abs(colorIndex) % RINGS.length]

  // Background, the ring and a small play mark (shapes only; text is rendered separately).
  const shapes = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#f7f3ee"/>
      <circle cx="1010" cy="360" r="268" fill="none" stroke="${ring}" stroke-width="30"/>
      <circle cx="1010" cy="360" r="238" fill="#fffaf4"/>
      <polygon points="72,640 72,664 92,652" fill="${ring}"/>
    </svg>`)

  const logo = await sharp(path.resolve(process.cwd(), 'public/brand/logo.svg'), { density: 300 })
    .resize({ width: 190 })
    .png()
    .toBuffer()
  const caricature = await sharp(path.join(ASSETS, 'caricature.png')).resize({ height: 660 }).png().toBuffer()
  const cari = await sharp(caricature).metadata()

  const titleImg = await fitTitle(title, 600)
  const categoryImg = category ? await text(category, { size: 30, color: ring, bold: false, width: 600 }) : null

  // Category and title sit together, centred vertically in the left half.
  const gap = categoryImg ? 18 : 0
  const blockHeight = (categoryImg?.info.height ?? 0) + gap + titleImg.info.height
  const top = Math.max(150, Math.round((H - blockHeight) / 2) + 20)

  const layers: OverlayOptions[] = [
    { input: logo, left: 72, top: 56 },
    { input: caricature, left: 1010 - Math.round((cari.width ?? 0) / 2), top: H - (cari.height ?? 0) + 20 },
    { input: titleImg.data, left: 72, top: top + (categoryImg ? categoryImg.info.height + gap : 0) },
  ]
  if (categoryImg) layers.push({ input: categoryImg.data, left: 72, top })

  return sharp(shapes).composite(layers).webp({ quality: 88 }).toBuffer()
}
