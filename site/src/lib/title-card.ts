import path from 'path'

import sharp, { type OverlayOptions } from 'sharp'

/**
 * Template images (1280×720), in the style of the hand-made reel thumbnails. Video thumbnail:
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
async function fitLine(value: string, sizes: number[], color: string, width = TEXT_WIDTH): Promise<Rendered> {
  for (const size of sizes) {
    const rendered = await text(value, { size, color })
    if (rendered.info.width <= width) return rendered
  }
  return text(value, { size: sizes[sizes.length - 1], color, width })
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

type CardInput = {
  title: string
  category?: string
  highlight?: string | null
  line2?: string | null
  subline?: string | null
  /** A photo to place in the template's frame (article headers). Without it: the caricature. */
  photo?: Buffer | null
}

const svg = (body: string, w = W, h = H) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`)

/**
 * The text block: a dash with the category, the orange headline, the dark second line and
 * the small line, vertically centred. Returns the layers to composite.
 */
async function textBlock(
  input: CardInput,
  { left, width, head, second, small }: { left: number; width: number; head: number[]; second: number[]; small: number },
): Promise<OverlayOptions[]> {
  const auto = splitTitle(input.title)
  const lines = input.highlight?.trim()
    ? { highlight: input.highlight.trim(), line2: input.line2?.trim() ?? '', subline: input.subline?.trim() ?? '' }
    : { ...auto, subline: input.subline?.trim() || auto.subline }

  const headImg = await fitLine(lines.highlight, head, ORANGE, width)
  const secondImg = lines.line2 ? await fitLine(lines.line2, second, INK, width) : null
  const smallImg = lines.subline ? await text(lines.subline, { size: small, color: MUTED, bold: false, width }) : null
  const label = input.category ? await text(input.category, { size: 26, color: MUTED, bold: false }) : null

  const labelRow = Math.max(label?.info.height ?? 0, 8)
  const parts: { img: Rendered | null; gap: number }[] = [
    { img: headImg, gap: 22 },
    { img: secondImg, gap: 14 },
    { img: smallImg, gap: 30 },
  ]
  const blockHeight = labelRow + parts.reduce((sum, p) => sum + (p.img ? p.img.info.height + p.gap : 0), 0)
  let y = Math.max(60, Math.round((H - blockHeight) / 2) - 20)

  const layers: OverlayOptions[] = [
    { input: svg(`<rect width="60" height="8" rx="4" fill="${ORANGE}"/>`, 60, 8), left, top: y + Math.round(labelRow / 2) - 4 },
  ]
  if (label) layers.push({ input: label.data, left: left + 78, top: y })
  y += labelRow
  for (const part of parts) {
    if (!part.img) continue
    y += part.gap
    layers.push({ input: part.img.data, left, top: y })
    y += part.img.info.height
  }
  return layers
}

const iconImage = (width: number) =>
  sharp(path.resolve(process.cwd(), 'public/brand/icon.svg'), { density: 300 }).resize({ width }).png().toBuffer()

/** Video thumbnail: text on the left, the caricature on its orange waves on the right. */
async function caricatureCard(input: CardInput): Promise<OverlayOptions[]> {
  const scene = await sharp(path.join(ASSETS, 'caricature-scene.png'))
    .trim()
    .resize({ height: 690 })
    .png()
    .toBuffer({ resolveWithObject: true })
  return [
    { input: scene.data, left: W - scene.info.width + 10, top: H - scene.info.height },
    { input: await iconImage(76), left: LEFT, top: H - 76 - 44 },
    ...(await textBlock(input, {
      left: LEFT,
      width: TEXT_WIDTH,
      head: [104, 96, 88, 80, 72, 64, 56],
      second: [72, 66, 60, 54, 48, 44],
      small: 30,
    })),
  ]
}

/**
 * Article header: the photo in a rounded frame on the left (white border, an orange
 * gradient frame offset behind it, the brand's small circles), the text on the right.
 */
const FRAME = { x: 56, y: 56, w: 664, h: 584, r: 26, border: 10 }

async function photoCard(input: CardInput & { photo: Buffer }): Promise<OverlayOptions[]> {
  const { x, y, w, h, r, border } = FRAME
  const inner = { w: w - border * 2, h: h - border * 2 }
  const photo = await sharp(input.photo)
    .rotate()
    .resize({ width: inner.w, height: inner.h, fit: 'cover', position: sharp.strategy.attention })
    .composite([{ input: svg(`<rect width="${inner.w}" height="${inner.h}" rx="${r - 6}" fill="#fff"/>`, inner.w, inner.h), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const decor = svg(`
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f9a03f"/><stop offset="1" stop-color="#f15a24"/>
      </linearGradient>
      <filter id="s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect x="${x + 26}" y="${y + 26}" width="${w}" height="${h}" rx="${r}" fill="url(#g)"/>
    <rect x="${x + 6}" y="${y + 14}" width="${w}" height="${h}" rx="${r}" fill="#000" opacity="0.16" filter="url(#s)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff"/>
    <circle cx="1196" cy="88" r="20" fill="none" stroke="#f15a24" stroke-width="3"/>
    <circle cx="1148" cy="150" r="9" fill="none" stroke="#f19224" stroke-width="3"/>
    <circle cx="770" cy="664" r="11" fill="none" stroke="#f19224" stroke-width="3"/>`)

  return [
    { input: decor, left: 0, top: 0 },
    { input: photo, left: x + border, top: y + border },
    { input: await iconImage(66), left: W - 66 - 56, top: H - 66 - 46 },
    ...(await textBlock(input, {
      left: 790,
      width: 430,
      head: [88, 80, 72, 64, 58, 52, 46],
      second: [62, 56, 50, 46, 42, 38],
      small: 27,
    })),
  ]
}

/** 1280×720 webp: an article header (with a photo) or a video thumbnail (without). */
export async function renderTitleCard(input: CardInput): Promise<Buffer> {
  const layers = input.photo ? await photoCard({ ...input, photo: input.photo }) : await caricatureCard(input)
  return sharp(svg(`<rect width="${W}" height="${H}" fill="${BG}"/>`))
    .composite(layers)
    .webp({ quality: 90 })
    .toBuffer()
}
