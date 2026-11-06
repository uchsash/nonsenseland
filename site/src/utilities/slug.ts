import type { Field, FieldHook } from 'payload'

/** English, lowercase, dash-separated slugs. Bangla titles need a manual slug. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const fallback = data?.[fallbackField]
    if (typeof fallback === 'string') {
      const slug = slugify(fallback)
      if (slug) return slug
    }
    // Bangla-only titles produce an empty slug; use a short unique id instead.
    return `item-${Date.now().toString(36)}`
  }

export const slugField = (fallbackField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  label: 'Slug (web address)',
  admin: {
    position: 'sidebar',
    description: 'English words only, e.g. antimatter-review. Leave empty to generate.',
  },
  hooks: { beforeValidate: [formatSlug(fallbackField)] },
})
