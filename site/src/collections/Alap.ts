import type { CollectionConfig, Where } from 'payload'

import { isStaff, staffOnly } from '../access'

/** খুচরো আলাপ: short posts (text + optional square image), posted quickly from the phone at /post. */
export const Alap: CollectionConfig = {
  slug: 'alap',
  labels: { singular: 'খুচরো আলাপ', plural: 'খুচরো আলাপ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'image', 'publishedAt', 'published'],
    group: 'Content',
    description: 'Short posts. Quickest from your phone: open /post on the site.',
  },
  defaultSort: '-publishedAt',
  access: {
    read: ({ req }): boolean | Where => (isStaff({ req }) ? true : { published: { equals: true } }),
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    { name: 'text', type: 'textarea', required: true, maxLength: 3000, admin: { rows: 6 } },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Required, so every card in the deck has the same shape. Square works best.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Untick to hide it from the site.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      // Short label for admin lists, filled from the text.
      name: 'title',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const text = String(siblingData?.text ?? '').replace(/\s+/g, ' ').trim()
            return text.length > 60 ? `${text.slice(0, 60)}…` : text
          },
        ],
      },
    },
  ],
}
