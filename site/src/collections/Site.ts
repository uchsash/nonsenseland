import type { CollectionConfig } from 'payload'

import { anyone, publishedOrStaff, staffOnly } from '../access'
import { slugField } from '../utilities/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    description: 'About, Privacy Policy, Terms, Refund Policy…',
  },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional photo or sketch.' } },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'showContactForm',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    slugField(),
  ],
}

export const AD_SLOTS = [
  { label: 'Homepage — between sections', value: 'home' },
  { label: 'Article — inside the text', value: 'article-inline' },
  { label: 'Article — after the text', value: 'article-end' },
  { label: 'Book page', value: 'book' },
  { label: 'Video page', value: 'video' },
] as const

export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: { singular: 'Ad / promo', plural: 'Ads & promos' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slots', 'mode', 'active', 'endAt'],
    group: 'Promotion',
    description: 'House ads for your books now; Google AdSense or other code later. Master switch: Ad settings.',
  },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'For you only, not shown.' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'slots',
      type: 'select',
      hasMany: true,
      required: true,
      options: AD_SLOTS.map((s) => ({ ...s })),
      admin: { description: 'Where this can appear.' },
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'house',
      options: [
        { label: 'House ad (my banner)', value: 'house' },
        { label: 'Google AdSense', value: 'adsense' },
        { label: 'Custom code', value: 'custom' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (d) => d?.mode === 'house',
        description: 'Wide banner, e.g. 1200×300.',
      },
    },
    { name: 'link', type: 'text', admin: { condition: (d) => d?.mode === 'house' } },
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      admin: {
        condition: (d) => d?.mode === 'house',
        description: 'Or link to one of your books instead of a URL.',
      },
    },
    {
      name: 'adsenseSlot',
      type: 'text',
      label: 'AdSense ad unit ID',
      admin: { condition: (d) => d?.mode === 'adsense' },
    },
    {
      name: 'code',
      type: 'code',
      admin: { language: 'html', condition: (d) => d?.mode === 'custom' },
    },
    { name: 'startAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'endAt', type: 'date', admin: { position: 'sidebar', description: 'Hides itself after this.' } },
  ],
}

const formOnly = { read: staffOnly, create: anyone, update: staffOnly, delete: staffOnly }

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: { useAsTitle: 'email', group: 'Readers', defaultColumns: ['email', 'createdAt'] },
  access: formOnly,
  fields: [{ name: 'email', type: 'email', required: true, unique: true }],
}

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Message', plural: 'Messages' },
  admin: { useAsTitle: 'name', group: 'Readers', defaultColumns: ['name', 'email', 'createdAt'] },
  access: formOnly,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'message', type: 'textarea', required: true },
  ],
}

/** Log of Kindle sends, used for rate limiting. Stores a hash of the IP, never the IP. */
export const KindleSends: CollectionConfig = {
  slug: 'kindle-sends',
  admin: { group: 'Readers', defaultColumns: ['book', 'status', 'createdAt'] },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'ipHash', type: 'text', index: true },
    {
      name: 'status',
      type: 'select',
      options: ['sent', 'failed'].map((v) => ({ label: v, value: v })),
    },
  ],
}

/* ---- Prepared for phase 3 (hidden in admin until then) ---- */

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: { group: 'Shop', hidden: true },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'book', type: 'relationship', relationTo: 'books', required: true },
        {
          name: 'format',
          type: 'select',
          required: true,
          options: ['ebook', 'print'].map((v) => ({ label: v, value: v })),
        },
        { name: 'quantity', type: 'number', defaultValue: 1 },
        { name: 'unitPrice', type: 'number', required: true },
      ],
    },
    { name: 'subtotal', type: 'number' },
    { name: 'discount', type: 'number', defaultValue: 0 },
    { name: 'delivery', type: 'number', defaultValue: 0 },
    { name: 'total', type: 'number' },
    { name: 'coupon', type: 'relationship', relationTo: 'coupons' },
    {
      name: 'paymentMethod',
      type: 'select',
      options: ['bkash-api', 'bkash-manual', 'cod'].map((v) => ({ label: v, value: v })),
    },
    { name: 'transactionId', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'received',
      options: ['received', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'].map((v) => ({
        label: v,
        value: v,
      })),
    },
    {
      name: 'shipping',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'textarea' },
        { name: 'insideDhaka', type: 'checkbox' },
      ],
    },
  ],
}

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: { useAsTitle: 'code', group: 'Shop', hidden: true },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Percent', value: 'percent' },
        { label: 'Fixed ৳', value: 'fixed' },
      ],
    },
    { name: 'amount', type: 'number', required: true },
    { name: 'books', type: 'relationship', relationTo: 'books', hasMany: true },
    { name: 'startAt', type: 'date' },
    { name: 'endAt', type: 'date' },
    { name: 'usageLimit', type: 'number' },
    { name: 'used', type: 'number', defaultValue: 0 },
  ],
}

/** Which user owns which book (free / bought / gift). Used from phase 2. */
export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  admin: { group: 'Shop', hidden: true },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    {
      name: 'source',
      type: 'select',
      options: ['free', 'purchase', 'gift'].map((v) => ({ label: v, value: v })),
    },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
  ],
}

/** Reading position synced across devices. Used from phase 2. */
export const ReadingProgress: CollectionConfig = {
  slug: 'reading-progress',
  admin: { group: 'Readers', hidden: true },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'chapter', type: 'relationship', relationTo: 'chapters' },
    { name: 'position', type: 'number', admin: { description: '0–1 within the chapter' } },
  ],
}
