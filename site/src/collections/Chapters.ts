import type { CollectionConfig } from 'payload'

import { staffOnly } from '../access'
import { lexicalToText } from '../utilities/lexical'
import { colorField } from '../utilities/palette'

/**
 * Chapters are never readable through the public API. The site reads them on the
 * server and checks access per book (free / members / paid) in lib/reading.ts.
 */
export const Chapters: CollectionConfig = {
  slug: 'chapters',
  labels: { singular: 'Chapter', plural: 'Chapters' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'book', 'order', 'wordCount'],
    // Not in the sidebar: chapters are managed from each book's “Chapters” tab.
    group: false,
    listSearchableFields: ['title'],
  },
  defaultSort: 'order',
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    {
      name: 'backToBook',
      type: 'ui',
      admin: { components: { Field: '/components/admin/BackToBook#BackToBook' } },
    },
    { name: 'book', type: 'relationship', relationTo: 'books', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'order', type: 'number', required: true, index: true },
        { name: 'wordCount', type: 'number', admin: { readOnly: true } },
      ],
    },
    colorField('titleColor', 'Title colour'),
    { name: 'content', type: 'richText', required: true },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.content) data.wordCount = lexicalToText(data.content).split(' ').filter(Boolean).length
        return data
      },
    ],
  },
}
