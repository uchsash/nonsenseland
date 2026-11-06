import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffOnly } from '../access'
import { readingMinutes } from '../utilities/lexical'
import { slugField } from '../utilities/slug'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article (লেখা)', plural: 'Articles (লেখা)' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
  },
  defaultSort: '-publishedAt',
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Thumbnail / header image (16:9 works best).' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 220,
      admin: { description: 'One or two lines shown on cards and when shared.' },
    },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: { kind: { equals: 'article' } },
      admin: { position: 'sidebar' },
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    { name: 'author', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar' } },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show first in sliders.' },
    },
    {
      name: 'relatedBook',
      type: 'relationship',
      relationTo: 'books',
      admin: { position: 'sidebar', description: 'Promote this book at the end of the article.' },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true, description: 'Minutes (automatic).' },
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.content) data.readingTime = readingMinutes(data.content)
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
}
