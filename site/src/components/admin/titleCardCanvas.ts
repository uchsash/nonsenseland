'use client'

import { FRAME_INNER, type Framing, framePhoto } from '@/utilities/photo-frame'
import { splitTitle } from '@/utilities/title-lines'

/**
 * The title card / article header drawn in the admin's browser (canvas), in the same layout as
 * lib/title-card.ts. The live site runs on Cloudflare Workers, where the server-side image
 * library (sharp) cannot run; the browser draws the image and sends it with the save.
 */
const W = 1280
const H = 720
const LEFT = 84
const TEXT_WIDTH = 560
const BG = '#fdf8f4'
const ORANGE = '#f15a24'
const INK = '#1c1b1a'
const MUTED = '#7a706a'
const FAMILY = 'NL Card Hind'

export type CardInput = {
  title: string
  category?: string
  highlight?: string | null
  line2?: string | null
  subline?: string | null
  /** The photo's URL (article headers). Without it: the caricature (video thumbnails). */
  photoUrl?: string | null
  framing?: Framing
}

let fontsReady: Promise<void> | null = null
const loadFonts = () =>
  (fontsReady ??= Promise.all([
    new FontFace(FAMILY, 'url(/brand/card/HindSiliguri-SemiBold.ttf)', { weight: '600' }).load(),
    new FontFace(FAMILY, 'url(/brand/card/HindSiliguri-Medium.ttf)', { weight: '500' }).load(),
  ]).then((faces) => faces.forEach((face) => document.fonts.add(face))))

const images = new Map<string, Promise<HTMLImageElement>>()
const loadImage = (src: string) => {
  if (!images.has(src)) {
    images.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => {
          images.delete(src)
          reject(new Error(`Could not load ${src}`))
        }
        img.src = src
      }),
    )
  }
  return images.get(src)!
}

type Line = { text: string; size: number; color: string; bold: boolean }
type Block = { lines: Line[]; height: number }

const font = (size: number, bold: boolean) => `${bold ? 600 : 500} ${size}px "${FAMILY}"`
const lineHeight = (size: number) => Math.round(size * 1.4)

/** Breaks text into lines no wider than `width` (word by word). */
function wrap(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > width) {
      lines.push(current)
      current = word
    } else current = next
  }
  if (current) lines.push(current)
  return lines
}

/** The largest size at which the text fits on one line; below the smallest it wraps. */
function fitLine(ctx: CanvasRenderingContext2D, value: string, sizes: number[], color: string, width: number): Block {
  for (const size of sizes) {
    ctx.font = font(size, true)
    if (ctx.measureText(value).width <= width) return { lines: [{ text: value, size, color, bold: true }], height: lineHeight(size) }
  }
  const size = sizes[sizes.length - 1]
  ctx.font = font(size, true)
  const lines = wrap(ctx, value, width).map((text) => ({ text, size, color, bold: true }))
  return { lines, height: lines.length * lineHeight(size) }
}

function smallBlock(ctx: CanvasRenderingContext2D, value: string, size: number, width: number): Block {
  ctx.font = font(size, false)
  const lines = wrap(ctx, value, width).map((text) => ({ text, size, color: MUTED, bold: false }))
  return { lines, height: lines.length * lineHeight(size) }
}

function drawBlock(ctx: CanvasRenderingContext2D, block: Block, left: number, top: number) {
  let y = top
  for (const line of block.lines) {
    ctx.font = font(line.size, line.bold)
    ctx.fillStyle = line.color
    ctx.textBaseline = 'middle'
    ctx.fillText(line.text, left, y + lineHeight(line.size) / 2)
    y += lineHeight(line.size)
  }
}

/** The dash with the category, the orange headline, the dark second line and the small line. */
function drawText(
  ctx: CanvasRenderingContext2D,
  input: CardInput,
  { left, width, head, second, small }: { left: number; width: number; head: number[]; second: number[]; small: number },
) {
  const auto = splitTitle(input.title)
  const lines = input.highlight?.trim()
    ? { highlight: input.highlight.trim(), line2: input.line2?.trim() ?? '', subline: input.subline?.trim() ?? '' }
    : { ...auto, subline: input.subline?.trim() || auto.subline }

  const parts: { block: Block | null; gap: number }[] = [
    { block: fitLine(ctx, lines.highlight, head, ORANGE, width), gap: 22 },
    { block: lines.line2 ? fitLine(ctx, lines.line2, second, INK, width) : null, gap: 14 },
    { block: lines.subline ? smallBlock(ctx, lines.subline, small, width) : null, gap: 30 },
  ]
  const labelRow = input.category ? lineHeight(26) : 8
  const blockHeight = labelRow + parts.reduce((sum, p) => sum + (p.block ? p.block.height + p.gap : 0), 0)
  let y = Math.max(60, Math.round((H - blockHeight) / 2) - 20)

  ctx.fillStyle = ORANGE
  ctx.beginPath()
  ctx.roundRect(left, y + Math.round(labelRow / 2) - 4, 60, 8, 4)
  ctx.fill()
  if (input.category) {
    drawBlock(ctx, { lines: [{ text: input.category, size: 26, color: MUTED, bold: false }], height: labelRow }, left + 78, y)
  }
  y += labelRow
  for (const part of parts) {
    if (!part.block) continue
    y += part.gap
    drawBlock(ctx, part.block, left, y)
    y += part.block.height
  }
}

async function drawIcon(ctx: CanvasRenderingContext2D, width: number, left: number, top: number) {
  const icon = await loadImage('/brand/icon.svg')
  const height = (icon.naturalHeight / icon.naturalWidth) * width || width
  ctx.drawImage(icon, left, top, width, height)
}

/** Video thumbnail: text on the left, the caricature on its orange waves on the right. */
async function caricatureCard(ctx: CanvasRenderingContext2D, input: CardInput) {
  const scene = await loadImage('/brand/card/caricature-scene.png')
  ctx.drawImage(scene, W - scene.naturalWidth + 10, H - scene.naturalHeight)
  await drawIcon(ctx, 76, LEFT, H - 76 - 44)
  drawText(ctx, input, { left: LEFT, width: TEXT_WIDTH, head: [104, 96, 88, 80, 72, 64, 56], second: [72, 66, 60, 54, 48, 44], small: 30 })
}

const FRAME = { x: 56, y: 56, w: FRAME_INNER.w + 20, h: FRAME_INNER.h + 20, r: 26, border: 10 }

/** Article header: the photo in a rounded frame on the left, the text on the right. */
async function photoCard(ctx: CanvasRenderingContext2D, input: CardInput & { photoUrl: string }) {
  const { x, y, w, h, r, border } = FRAME
  // Orange gradient frame behind, a soft shadow, the white frame.
  const gradient = ctx.createLinearGradient(x + 26, y + 26, x + 26 + w, y + 26 + h)
  gradient.addColorStop(0, '#f9a03f')
  gradient.addColorStop(1, '#f15a24')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(x + 26, y + 26, w, h, r)
  ctx.fill()
  ctx.save()
  ctx.filter = 'blur(14px)'
  ctx.globalAlpha = 0.16
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(x + 6, y + 14, w, h, r)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  // The brand's small circles.
  ctx.lineWidth = 3
  for (const [cx, cy, radius, color] of [
    [1196, 88, 20, '#f15a24'],
    [1148, 150, 9, '#f19224'],
    [770, 664, 11, '#f19224'],
  ] as const) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // The photo inside the frame: placed by hand, or filling the frame from the centre.
  const photo = await loadImage(input.photoUrl)
  const inner = { x: x + border, y: y + border, w: w - border * 2, h: h - border * 2 }
  const placed = framePhoto({ width: photo.naturalWidth, height: photo.naturalHeight }, input.framing ?? {})
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(inner.x, inner.y, inner.w, inner.h, r - 6)
  ctx.clip()
  // A blurred, darker copy fills any space around a whole photo.
  ctx.save()
  ctx.filter = 'blur(28px) brightness(0.82)'
  const cover = Math.max(inner.w / photo.naturalWidth, inner.h / photo.naturalHeight)
  const cw = photo.naturalWidth * cover
  const ch = photo.naturalHeight * cover
  ctx.drawImage(photo, inner.x + (inner.w - cw) / 2, inner.y + (inner.h - ch) / 2, cw, ch)
  ctx.restore()
  ctx.drawImage(photo, inner.x + placed.left, inner.y + placed.top, placed.width, placed.height)
  ctx.restore()

  await drawIcon(ctx, 66, W - 66 - 56, H - 66 - 46)
  drawText(ctx, input, { left: 790, width: 430, head: [88, 80, 72, 64, 58, 52, 46], second: [62, 56, 50, 46, 42, 38], small: 27 })
}

/** Draws the 1280×720 card and returns it as a WebP data URL. */
export async function drawTitleCard(input: CardInput): Promise<string> {
  await loadFonts()
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  if (input.photoUrl) await photoCard(ctx, { ...input, photoUrl: input.photoUrl })
  else await caricatureCard(ctx, input)
  return canvas.toDataURL('image/webp', 0.9)
}
