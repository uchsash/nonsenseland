import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffOnly } from '../access'
import { fillArticleHeader } from '../lib/article-header'
import { automaticImageCleanup } from '../lib/template-media'
import { readingMinutes } from '../utilities/lexical'
import { previewAt } from '../utilities/preview'
import { slugField } from '../utilities/slug'

const headerCleanup = automaticImageCleanup({ collection: 'articles', field: 'cover', source: 'coverSource' })

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article (লেখা)', plural: 'Articles (লেখা)' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
    preview: previewAt('/articles'),
  },
  defaultSort: '-publishedAt',
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      // Header made from the template: the photo in a frame, the category and the title.
      name: 'header',
      type: 'group',
      label: 'Header from the template',
      admin: {
        condition: (data) => data?.coverSource !== 'own',
        description:
          'Add a photo and the header is made when you save. Leave the lines empty and the title is split by itself (anything after “—” or “:” becomes the small line).',
      },
      fields: [
        { name: 'photo', type: 'upload', relationTo: 'media', admin: { description: 'Placed in the frame. Without a photo, the caricature is used.' } },
        { name: 'highlight', type: 'text', label: 'Big orange line' },
        { name: 'line2', type: 'text', label: 'Second line' },
        { name: 'subline', type: 'text', label: 'Small line' },
      ],
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Header image',
      admin: {
        description:
          'Made from the template above. To use a finished image of your own instead, remove this one and upload yours (16:9).',
      },
    },
    {
      // Where the header came from: 'own' (uploaded) or 'template' (made on save).
      name: 'coverSource',
      type: 'select',
      options: ['own', 'template'].map((v) => ({ label: v, value: v })),
      admin: { hidden: true },
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
      async ({ data, originalDoc, req }) => {
        await fillArticleHeader(data, originalDoc, req)
        return data
      },
    ],
    // Template headers that were replaced, or whose article was deleted, are removed.
    afterChange: [headerCleanup.afterChange],
    beforeDelete: [headerCleanup.beforeDelete],
    afterDelete: [headerCleanup.afterDelete],
  },
}
