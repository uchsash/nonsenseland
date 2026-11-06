import { APIError, type CollectionConfig } from 'payload'

import { publishedOrStaff, staffOnly } from '../access'
import { ImportError, importBookChapters } from '../lib/book-import'
import { colorField } from '../utilities/palette'
import { previewAt } from '../utilities/preview'
import { slugField } from '../utilities/slug'

export const Books: CollectionConfig = {
  slug: 'books',
  labels: { singular: 'Book', plural: 'Books' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'role', 'online.enabled', 'print.enabled', '_status'],
    group: 'Library',
    description:
      'One entry per book. A book can be readable on the site, downloadable as EPUB, sold in print — or any mix.',
    preview: previewAt('/books'),
  },
  defaultSort: 'order',
  versions: { drafts: true, maxPerDoc: 10 },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text', admin: { description: 'e.g. উপন্যাসিকা, গল্প' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          defaultValue: 'translator',
          label: 'Your role',
          options: [
            { label: 'লেখক (Writer)', value: 'writer' },
            { label: 'অনুবাদক (Translator)', value: 'translator' },
          ],
        },
        { name: 'originalAuthor', type: 'text', admin: { description: 'For translations.' } },
        { name: 'originalTitle', type: 'text' },
      ],
    },
    colorField('titleColor', 'Title colour'),
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { description: 'Short description shown on the book page and when shared.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'online',
          label: 'Read online',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Readable on the site',
            },
            {
              name: 'access',
              type: 'select',
              defaultValue: 'free',
              options: [
                { label: 'Free for everyone', value: 'free' },
                { label: 'Members only (phase 2)', value: 'members' },
                { label: 'Paid (phase 3)', value: 'paid' },
              ],
              admin: { condition: (_, s) => Boolean(s?.enabled) },
            },
            {
              name: 'sampleChapters',
              type: 'number',
              defaultValue: 1,
              min: 0,
              admin: {
                condition: (_, s) => s?.enabled && s?.access !== 'free',
                description: 'How many chapters anyone can read before login / payment.',
              },
            },
            {
              type: 'collapsible',
              label: 'Import chapters from a file',
              admin: { condition: (_, s) => Boolean(s?.enabled) },
              fields: [
                {
                  name: 'importFrom',
                  type: 'select',
                  defaultValue: 'epub',
                  options: [
                    { label: 'The EPUB file (recommended)', value: 'epub' },
                    { label: 'A Word file', value: 'word' },
                  ],
                },
                {
                  name: 'wordFile',
                  type: 'upload',
                  relationTo: 'book-files',
                  admin: {
                    condition: (_, s) => s?.importFrom === 'word',
                    description: 'Chapters start at every "Heading 1". Text must be Unicode Bangla, not Bijoy.',
                  },
                },
                {
                  name: 'importNow',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Import chapters when I save',
                  admin: {
                    description:
                      'Replaces chapter text. Chapters with the same title keep their links and readers’ places.',
                  },
                },
                {
                  name: 'importReport',
                  type: 'textarea',
                  admin: { readOnly: true, description: 'Result of the last import.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Chapters',
          description: 'This book’s chapters in reading order. Click one to edit it; “Order” sets the position.',
          fields: [
            {
              name: 'chapters',
              type: 'join',
              collection: 'chapters',
              on: 'book',
              defaultSort: 'order',
              defaultLimit: 200,
              admin: { defaultColumns: ['order', 'title', 'wordCount'], allowCreate: true },
            },
          ],
        },
        {
          name: 'ebook',
          label: 'EPUB & Kindle',
          fields: [
            { name: 'epub', type: 'upload', relationTo: 'book-files', label: 'EPUB file' },
            {
              type: 'row',
              fields: [
                { name: 'allowDownload', type: 'checkbox', defaultValue: true, label: 'Allow download' },
                { name: 'allowKindle', type: 'checkbox', defaultValue: true, label: 'Allow Send to Kindle' },
              ],
            },
            {
              type: 'ui',
              name: 'ebookNote',
              admin: {
                components: { Field: '/components/admin/Note#PaidNote' },
              },
            },
          ],
        },
        {
          name: 'print',
          label: 'Print edition',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Show in “my published books”' },
            {
              type: 'row',
              admin: { condition: (_, s) => Boolean(s?.enabled) },
              fields: [
                { name: 'publisher', type: 'text' },
                { name: 'year', type: 'number' },
                { name: 'pages', type: 'number' },
                { name: 'isbn', type: 'text' },
              ],
            },
            {
              name: 'buyLinks',
              type: 'array',
              labels: { singular: 'Buy link', plural: 'Buy links' },
              admin: { condition: (_, s) => Boolean(s?.enabled) },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'store', type: 'text', required: true, admin: { description: 'e.g. রকমারি' } },
                    { name: 'url', type: 'text', required: true },
                    { name: 'price', type: 'number', admin: { description: 'Optional, in ৳' } },
                  ],
                },
              ],
            },
            {
              name: 'badge',
              type: 'text',
              admin: {
                condition: (_, s) => Boolean(s?.enabled),
                description: 'Optional offer badge, e.g. “রকমারিতে ২৫% ছাড়”.',
              },
            },
          ],
        },
        {
          name: 'sale',
          label: 'Selling (phase 3)',
          description: 'Prepared for later. Nothing here is shown on the site yet.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'ebookPrice', type: 'number', label: 'Ebook price ৳' },
                { name: 'ebookSalePrice', type: 'number', label: 'Ebook sale price ৳' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'saleStart', type: 'date' },
                { name: 'saleEnd', type: 'date' },
              ],
            },
            { name: 'directPrint', type: 'checkbox', label: 'Sell printed copies directly' },
            {
              type: 'row',
              admin: { condition: (_, s) => Boolean(s?.directPrint) },
              fields: [
                { name: 'printPrice', type: 'number', label: 'Print price ৳' },
                { name: 'printSalePrice', type: 'number', label: 'Print sale price ৳' },
                { name: 'stock', type: 'number', defaultValue: 0 },
              ],
            },
          ],
        },
      ],
    },
    { name: 'topics', type: 'relationship', relationTo: 'topics', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.skipImport || !doc.online?.importNow) return doc
        let report: string
        try {
          report = await importBookChapters({ book: doc, req })
        } catch (error) {
          // Shown as an error when saving; the whole save (book + chapters) is rolled back.
          if (error instanceof ImportError) throw new APIError(`Chapters not imported: ${error.message}`, 400, undefined, true)
          throw error
        }
        // Return the updated book so the admin shows the new report straight after saving.
        return req.payload.update({
          collection: 'books',
          id: doc.id,
          data: { online: { ...doc.online, importNow: false, importReport: report } },
          req,
          context: { skipImport: true },
          draft: doc._status !== 'published',
        })
      },
    ],
  },
}
