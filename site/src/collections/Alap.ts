import type { CollectionConfig, Where } from 'payload'

import { isStaff, staffOnly } from '../access'

/** Longest খুচরো আলাপ post, in characters. */
export const ALAP_MAX_CHARS = 220

export const NEW_BOOK_HEADLINE = 'নতুন বই চলে এসেছে!'

type Sibling = { kind?: 'post' | 'book' } | undefined
const isBookCard = (sibling: unknown) => (sibling as Sibling)?.kind === 'book'

/**
 * খুচরো আলাপ: short posts (text + a square image), posted quickly from the phone at /post.
 * A “book card” instead shows a book's cover as a mockup with a “বইটি পড়ুন” link; it is
 * shown only while pinned (first in the deck), and only one card can be pinned at a time.
 */
export const Alap: CollectionConfig = {
  slug: 'alap',
  labels: { singular: 'খুচরো আলাপ', plural: 'খুচরো আলাপ' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'pinned', 'publishedAt', 'published'],
    group: 'Content',
    description: 'Short posts. Quickest from your phone: open /post on the site.',
  },
  defaultSort: '-publishedAt',
  access: {
    read: ({ req }): boolean | Where => (isStaff({ req }) ? true : { published: { equals: true } }),
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      name: 'kind',
      type: 'radio',
      defaultValue: 'post',
      options: [
        { label: 'Normal post (photo + text)', value: 'post' },
        { label: 'Book card (নতুন বই)', value: 'book' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      admin: {
        condition: (_, sibling) => isBookCard(sibling),
        description: 'The card shows this book’s cover as a mockup, its name and a “বইটি পড়ুন” link.',
      },
      validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
        isBookCard(siblingData) && !value ? 'Choose the book for this card.' : true,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      maxLength: ALAP_MAX_CHARS,
      admin: {
        rows: 6,
        description: `At most ${ALAP_MAX_CHARS} characters, so cards stay short. For a book card this is the headline.`,
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, sibling) => !isBookCard(sibling),
        description: 'Required for normal posts, so every card has the same shape. Square works best.',
      },
      validate: (value: unknown, { siblingData }: { siblingData: unknown }) =>
        !isBookCard(siblingData) && !value ? 'Add a photo — every post needs one.' : true,
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      label: 'Pin first in the deck',
      admin: {
        position: 'sidebar',
        description: 'Only one card can be pinned; pinning this one unpins the other. Book cards show only while pinned.',
      },
    },
    {
      name: 'pinUntil',
      type: 'date',
      label: 'Pinned until',
      admin: {
        position: 'sidebar',
        condition: (_, sibling) => Boolean((sibling as { pinned?: boolean })?.pinned),
        description: 'Optional. After this date the pin ends by itself.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Untick to hide it from the site.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      // Short label for admin lists, filled from the text.
      name: 'title',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const text = String(siblingData?.text ?? '').replace(/\s+/g, ' ').trim()
            const label = text.length > 60 ? `${text.slice(0, 60)}…` : text
            return isBookCard(siblingData) ? `📕 ${label}` : label
          },
        ],
      },
    },
  ],
  hooks: {
    beforeValidate: [
      // A book card starts with the usual headline.
      ({ data }) => {
        if (data && data.kind === 'book' && !String(data.text ?? '').trim()) data.text = NEW_BOOK_HEADLINE
        return data
      },
    ],
    afterChange: [
      // Only one pinned card: pinning this one unpins the others.
      async ({ doc, req, context }) => {
        if (!doc.pinned || context.unpinning) return doc
        const others = await req.payload.find({
          collection: 'alap',
          where: { and: [{ pinned: { equals: true } }, { id: { not_equals: doc.id } }] },
          limit: 50,
          depth: 0,
          req,
        })
        for (const other of others.docs) {
          await req.payload.update({
            collection: 'alap',
            id: other.id,
            data: { pinned: false },
            req,
            context: { unpinning: true },
          })
        }
        return doc
      },
    ],
  },
}
