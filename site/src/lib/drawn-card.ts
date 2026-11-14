import type { Field } from 'payload'

/**
 * The template image drawn in the admin's browser (components/admin/TemplateCard.tsx), sent
 * with the save as a WebP data URL in the virtual field `templateImage`. Returns it as a file,
 * or null when there is none or it is not a sensible image.
 */
export function takeDrawnCard(data: { templateImage?: unknown }): Buffer | null {
  const value = data.templateImage
  delete data.templateImage
  if (typeof value !== 'string') return null
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(value)
  if (!match) return null
  const file = Buffer.from(match[1], 'base64')
  // RIFF....WEBP, and no bigger than a 1280×720 card plausibly is.
  const isWebp = file.subarray(0, 4).toString('ascii') === 'RIFF' && file.subarray(8, 12).toString('ascii') === 'WEBP'
  return isWebp && file.length < 4 * 1024 * 1024 ? file : null
}

/** The virtual field that carries the drawing (not stored in the database). */
export const templateImageField: Field = {
  name: 'templateImage',
  type: 'text',
  virtual: true,
  admin: { hidden: true },
}
