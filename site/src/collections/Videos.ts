import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffOnly } from '../access'
import { automaticImageCleanup } from '../lib/template-media'
import { fillVideoThumbnail } from '../lib/video-thumbnail'
import { previewAt } from '../utilities/preview'
import { slugField } from '../utilities/slug'
import { detectPlatform } from '../utilities/video'

const thumbnailCleanup = automaticImageCleanup({ collection: 'videos', field: 'thumbnail', source: 'thumbnailSource' })

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
      admin: {
        description:
          'Optional. Leave empty and one is made when you save: YouTube’s thumbnail for YouTube links, otherwise a title card with the caricature. Uploading your own always wins.',
      },
    },
    {
      // Where the thumbnail came from: 'own' (uploaded), 'youtube' or 'card' (automatic).
      name: 'thumbnailSource',
      type: 'select',
      options: ['own', 'youtube', 'card'].map((v) => ({ label: v, value: v })),
      admin: { hidden: true },
    },
    {
      // Wording for the automatic title card. Empty lines are taken from the title.
      name: 'card',
      type: 'group',
      label: 'Title card text',
      admin: {
        condition: (data) => data?.thumbnailSource !== 'own' && data?.thumbnailSource !== 'youtube',
        description:
          'Optional. Leave empty and the title is split by itself (anything after “—” or “:” becomes the small line).',
      },
      fields: [
        { name: 'highlight', type: 'text', label: 'Big orange line', admin: { placeholder: 'হ্যারি পটার' } },
        { name: 'line2', type: 'text', label: 'Second line', admin: { placeholder: 'এখন বাংলায়' } },
        { name: 'subline', type: 'text', label: 'Small line', admin: { placeholder: 'রেগুলার ও ইলাস্ট্রেটেড এডিশন' } },
      ],
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
      async ({ data, originalDoc, req }) => {
        if (data.url) data.platform = detectPlatform(data.url)
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        // Automatic thumbnail (YouTube's, or a title card) when none is given.
        await fillVideoThumbnail(data, originalDoc, req)
        return data
      },
    ],
    // Automatic thumbnails that were replaced, or whose video was deleted, are removed.
    afterChange: [thumbnailCleanup.afterChange],
    beforeDelete: [thumbnailCleanup.beforeDelete],
    afterDelete: [thumbnailCleanup.afterDelete],
  },
}
