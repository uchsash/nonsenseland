import path from 'path'

import sharp, { type OverlayOptions } from 'sharp'

/**
 * Automatic video thumbnail (1280×720), in the style of the hand-made reel thumbnails:
 * a short orange dash and the category, the headline big in orange, a dark second line,
 * a small muted line, the icon in the corner, and the caricature on its orange base
 * (taken from the Facebook cover) on the right.
 */
const W = 1280
const H = 720
const LEFT = 84
const TEXT_WIDTH = 560
const ASSETS = path.resolve(process.cwd(), 'src/assets')
const FONT_BOLD = path.join(ASSETS, 'fonts/HindSiliguri-SemiBold.ttf')
const FONT_MEDIUM = path.join(ASSETS, 'fonts/HindSiliguri-Medium.ttf')

const BG = '#fdf8f4'
const ORANGE = '#f15a24'
const INK = '#1c1b1a'
const MUTED = '#7a706a'

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

type Rendered = { data: Buffer; info: { width: number; height: number } }

/** Bangla text rendered with the real font (proper যুক্তাক্ষর shaping). No width = one line. */
const text = (
  value: string,
  { size, color, bold = true, width }: { size: number; color: string; bold?: boolean; width?: number },
): Promise<Rendered> =>
  sharp({
    text: {
      text: `<span foreground="${color}">${escape(value)}</span>`,
      font: `Hind Siliguri ${bold ? 'SemiBold' : 'Medium'} ${size}`,
      fontfile: bold ? FONT_BOLD : FONT_MEDIUM,
      ...(width ? { width, wrap: 'word' as const } : {}),
      rgba: true,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })

/** The largest size at which the line fits on one line; below the smallest it wraps. */
async function fitLine(value: string, sizes: number[], color: string): Promise<Rendered> {
  for (const size of sizes) {
    const rendered = await text(value, { size, color })
    if (rendered.info.width <= TEXT_WIDTH) return rendered
  }
  return text(value, { size: sizes[sizes.length - 1], color, width: TEXT_WIDTH })
}

/**
 * Splits a title into the three lines when the admin left them empty: anything after
 * “—”, “–” or “:” becomes the small line; a long main part is broken in two, the first
 * half going orange.
 */
export function splitTitle(title: string): { highlight: string; line2: string; subline: string } {
  const [main, ...rest] = title.split(/\s+[—–-]\s+|\s*[:।|]\s+|\n/)
  const subline = rest.join(' ').trim()
  const words = main.trim().split(/\s+/)
  if (main.length <= 16 || words.length < 2) return { highlight: main.trim(), line2: '', subline }
  let cut = 1
  while (cut < words.length - 1 && words.slice(0, cut + 1).join(' ').length <= main.length / 2) cut++
  return { highlight: words.slice(0, cut).join(' '), line2: words.slice(cut).join(' '), subline }
}

export async function renderTitleCard({
  title,
  category,
  highlight,
  line2,
  subline,
}: {
  title: string
  category?: string
  highlight?: string | null
  line2?: string | null
  subline?: string | null
}): Promise<Buffer> {
  const auto = splitTitle(title)
  const lines = highlight?.trim()
    ? { highlight: highlight.trim(), line2: line2?.trim() ?? '', subline: subline?.trim() ?? '' }
    : { ...auto, subline: subline?.trim() || auto.subline }

  // The caricature on its orange base, bottom-right.
  const scene = await sharp(path.join(ASSETS, 'caricature-scene.png'))
    .trim()
    .resize({ height: 690 })
    .png()
    .toBuffer({ resolveWithObject: true })
  const icon = await sharp(path.resolve(process.cwd(), 'public/brand/icon.svg'), { density: 300 })
    .resize({ width: 76 })
    .png()
    .toBuffer()

  const head = await fitLine(lines.highlight, [104, 96, 88, 80, 72, 64, 56], ORANGE)
  const second = lines.line2 ? await fitLine(lines.line2, [72, 66, 60, 54, 48, 44], INK) : null
  const small = lines.subline ? await text(lines.subline, { size: 30, color: MUTED, bold: false, width: TEXT_WIDTH }) : null
  const label = category ? await text(category, { size: 26, color: MUTED, bold: false }) : null

  // Vertical rhythm: dash/category, headline, second line, small line.
  const labelRow = Math.max(label?.info.height ?? 0, 8)
  const parts: { img: Rendered | null; gap: number }[] = [
    { img: head, gap: 22 },
    { img: second, gap: 14 },
    { img: small, gap: 30 },
  ]
  const blockHeight =
    labelRow + parts.reduce((sum, p) => sum + (p.img ? p.img.info.height + p.gap : 0), 0)
  let y = Math.max(60, Math.round((H - blockHeight) / 2) - 20)

  const dash = Buffer.from(
    `<svg width="60" height="8" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="8" rx="4" fill="${ORANGE}"/></svg>`,
  )
  const layers: OverlayOptions[] = [
    { input: scene.data, left: W - scene.info.width + 10, top: H - scene.info.height },
    { input: icon, left: LEFT, top: H - 76 - 44 },
    { input: dash, left: LEFT, top: y + Math.round(labelRow / 2) - 4 },
  ]
  if (label) layers.push({ input: label.data, left: LEFT + 78, top: y })
  y += labelRow
  for (const part of parts) {
    if (!part.img) continue
    y += part.gap
    layers.push({ input: part.img.data, left: LEFT, top: y })
    y += part.img.info.height
  }

  const background = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${BG}"/></svg>`,
  )
  return sharp(background).composite(layers).webp({ quality: 90 }).toBuffer()
}
