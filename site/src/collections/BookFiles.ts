import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '../access'

/** EPUB and Word files. Only staff can upload; files of free books are public downloads. */
export const BookFiles: CollectionConfig = {
  slug: 'book-files',
  labels: { singular: 'Book file', plural: 'Book files' },
  admin: { group: 'Library', description: 'EPUB and Word files for books.' },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'note', type: 'text' }],
  upload: {
    mimeTypes: [
      'application/epub+zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
}
