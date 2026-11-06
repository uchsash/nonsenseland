import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: { group: 'Library', description: 'Covers, thumbnails, banners and images.' },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Description (alt text)',
      admin: { description: 'Short Bangla description of the image, for accessibility and Google.' },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 270, position: 'centre' },
      { name: 'card', width: 960, height: 540, position: 'centre' },
      // Book covers: resized only, never cropped (real covers have different proportions).
      { name: 'cover', width: 600 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
      // খুচরো আলাপ cards.
      { name: 'square', width: 900, height: 900, position: 'centre' },
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
}
