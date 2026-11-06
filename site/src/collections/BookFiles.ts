import type { CollectionConfig } from 'payload'

import { staffOnly } from '../access'

/**
 * EPUB and Word files. Never public: readers download through /download/[book],
 * which checks that the book is free and downloads are allowed.
 */
export const BookFiles: CollectionConfig = {
  slug: 'book-files',
  labels: { singular: 'Book file', plural: 'Book files' },
  admin: { group: 'Library', description: 'EPUB and Word files for books.' },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'note', type: 'text' }],
  upload: {
    mimeTypes: [
      'application/epub+zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
}
