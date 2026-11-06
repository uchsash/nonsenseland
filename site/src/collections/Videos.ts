import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffOnly } from '../access'
import { previewAt } from '../utilities/preview'
import { slugField } from '../utilities/slug'
import { detectPlatform } from '../utilities/video'

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'platform', 'publishedAt', '_status'],
    group: 'Content',
    preview: previewAt('/videos'),
  },
  defaultSort: '-publishedAt',
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 10 },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Video link',
      admin: { description: 'Facebook or YouTube link. Facebook videos must be Public.' },
      validate: (value: unknown) =>
        typeof value === 'string' && detectPlatform(value)
          ? true
          : 'Paste a Facebook or YouTube video link.',
    },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'Facebook', value: 'facebook' },
        { label: 'YouTube', value: 'youtube' },
      ],
      admin: { position: 'sidebar', readOnly: true, description: 'Detected from the link.' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: '16:9 image shown before the video plays.' },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'duration',
      type: 'text',
      admin: { position: 'sidebar', description: 'e.g. 12:40' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: { kind: { equals: 'video' } },
      admin: { position: 'sidebar' },
    },
    { name: 'topics', type: 'relationship', relationTo: 'topics', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    slugField(),
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.url) data.platform = detectPlatform(data.url)
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
}
