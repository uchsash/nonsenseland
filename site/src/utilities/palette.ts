/** Colours from the logo, used for titles and coloured text. Keys are stored in the database. */
export const PALETTE = {
  'dark-orange': { label: 'Dark orange', hex: '#f15a24' },
  orange: { label: 'Orange', hex: '#f47335' },
  golden: { label: 'Golden', hex: '#f19224' },
} as const

export type PaletteKey = keyof typeof PALETTE

export const paletteOptions = [
  { label: 'Default', value: 'default' },
  ...Object.entries(PALETTE).map(([value, { label }]) => ({ label, value })),
]

/** A “colour” field with logo swatches in the admin. */
export const colorField = (name: string, label: string) => ({
  name,
  label,
  type: 'select' as const,
  defaultValue: 'default',
  options: paletteOptions,
  admin: { components: { Field: '/components/admin/ColorPicker#ColorPicker' } },
})

/** CSS class for a palette colour (defined in styles.css), or nothing for the default text colour. */
export const colorClass = (key?: string | null) => (key && key in PALETTE ? `tc-${key}` : undefined)
