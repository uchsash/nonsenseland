import {
  BoldFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { adminOnly, staffOnly } from '../access'
import { sendNewsletterTest } from '../lib/newsletter'

const staffAccess = { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly }

/** A reader's saved article, book or chapter. Reached only through /account routes. */
export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  admin: { group: 'Readers', hidden: true },
  access: staffAccess,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: ['article', 'book', 'chapter'].map((v) => ({ label: v, value: v })),
    },
    { name: 'target', type: 'number', required: true },
  ],
  indexes: [{ fields: ['user', 'kind', 'target'], unique: true }],
}

/** One reader's like on a খুচরো আলাপ card. The total is kept on the card (likeCount). */
export const Likes: CollectionConfig = {
  slug: 'likes',
  admin: { group: 'Readers', hidden: true },
  access: staffAccess,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'alap', type: 'relationship', relationTo: 'alap', required: true, index: true },
  ],
  indexes: [{ fields: ['user', 'alap'], unique: true }],
}

type Newsletter = { status?: string; sendNow?: boolean; testEmail?: string | null; subject?: string; body?: unknown }

/** A newsletter written in the admin and sent to every subscriber. */
export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  labels: { singular: 'Newsletter', plural: 'Newsletters' },
  admin: {
    useAsTitle: 'subject',
    group: 'Readers',
    defaultColumns: ['subject', 'status', 'sentCount', 'sentAt'],
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminOnly },
  fields: [
    { name: 'subject', type: 'text', required: true },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          UnorderedListFeature(),
          OrderedListFeature(),
          LinkFeature({ enabledCollections: [] }),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'testEmail',
      type: 'email',
      label: 'Send a test to',
      admin: {
        position: 'sidebar',
        description: 'Save with an address here to send only a test copy there. Nobody else receives it.',
      },
    },
    {
      name: 'sendNow',
      type: 'checkbox',
      label: 'Send to all subscribers',
      admin: {
        position: 'sidebar',
        condition: (data) => !data?.status || data.status === 'draft',
        description: 'Tick and save to start sending. This cannot be undone.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'queued', 'sending', 'sent', 'failed'].map((v) => ({ label: v, value: v })),
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'sentCount', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    { name: 'sentAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    { name: 'report', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    // Where sending got to, so a retry never emails anyone twice.
    { name: 'cursor', type: 'number', defaultValue: 0, admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const doc = data as Newsletter
        if (doc.testEmail) {
          await sendNewsletterTest(doc.testEmail, doc.subject ?? '', doc.body, req.payload)
          doc.testEmail = null
        }
        if (doc.sendNow && (!doc.status || doc.status === 'draft')) doc.status = 'queued'
        doc.sendNow = false
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status === 'queued' && previousDoc?.status !== 'queued') {
          await req.payload.jobs.queue({ task: 'sendNewsletter', input: { newsletter: doc.id }, req })
        }
      },
    ],
  },
}
