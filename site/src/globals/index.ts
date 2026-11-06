import type { Block, Field, GlobalConfig } from 'payload'

import { anyone, staffOnly } from '../access'

const globalAccess = { read: anyone, update: staffOnly }

const linkFields: Field[] = [
  { name: 'label', type: 'text', required: true },
  {
    name: 'href',
    type: 'text',
    required: true,
    admin: { description: 'e.g. /videos, /articles, /books, /about or a full https:// link' },
  },
]

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: globalAccess,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'ননসেন্সল্যান্ড' },
            { name: 'tagline', type: 'text', defaultValue: 'Talk. Anything and Everything.' },
            {
              name: 'ownerName',
              type: 'text',
              required: true,
              defaultValue: 'উচ্ছ্বাস তৌসিফ',
              admin: { description: 'Shown as writer/translator on book pages.' },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Optional. Leave empty to use the built-in logo.' },
            },
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Square icon, used as favicon. Leave empty for the built-in icon.' },
            },
            {
              name: 'shareImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Default image when a page is shared on Facebook (1200×630).' },
            },
          ],
        },
        {
          label: 'Intro',
          fields: [
            { name: 'introTitle', type: 'text', required: true, defaultValue: 'যা কিছু কথা, সব কথা' },
            {
              name: 'introText',
              type: 'textarea',
              defaultValue: 'ভিডিও, লেখা আর বই — ননসেন্সল্যান্ডে সব কথার আসর।',
            },
            {
              name: 'introImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'The sketch or a photo. Leave empty to show the icon.' },
            },
            { name: 'introButtons', type: 'array', maxRows: 2, fields: linkFields },
          ],
        },
        {
          label: 'Menu & footer',
          fields: [
            { name: 'menu', type: 'array', fields: linkFields },
            {
              name: 'social',
              type: 'array',
              fields: [
                {
                  name: 'network',
                  type: 'select',
                  required: true,
                  options: ['facebook', 'instagram', 'youtube', 'email'].map((v) => ({ label: v, value: v })),
                },
                { name: 'url', type: 'text', required: true },
              ],
            },
            { name: 'footerText', type: 'text' },
            { name: 'footerLinks', type: 'array', fields: linkFields },
          ],
        },
        {
          label: 'Announcement',
          fields: [
            { name: 'announcementOn', type: 'checkbox', defaultValue: false, label: 'Show announcement bar' },
            { name: 'announcementText', type: 'text' },
            { name: 'announcementLink', type: 'text' },
          ],
        },
      ],
    },
  ],
}

const enabled: Field = { name: 'enabled', type: 'checkbox', defaultValue: true }
const heading: Field = { name: 'title', type: 'text', required: true }

const blocks: Block[] = [
  { slug: 'intro', labels: { singular: 'Intro', plural: 'Intro' }, fields: [enabled] },
  {
    slug: 'videos',
    labels: { singular: 'Video slider', plural: 'Video sliders' },
    fields: [enabled, heading, { name: 'showFilters', type: 'checkbox', defaultValue: true }],
  },
  {
    slug: 'articles',
    labels: { singular: 'Article slider', plural: 'Article sliders' },
    fields: [
      enabled,
      heading,
      {
        name: 'category',
        type: 'relationship',
        relationTo: 'categories',
        filterOptions: { kind: { equals: 'article' } },
        admin: { description: 'Optional: only this category.' },
      },
    ],
  },
  { slug: 'library', labels: { singular: 'Free books row', plural: 'Free books rows' }, fields: [enabled, heading] },
  {
    slug: 'published',
    labels: { singular: 'My published books', plural: 'My published books' },
    fields: [enabled, heading],
  },
  { slug: 'ad', labels: { singular: 'Ad slot', plural: 'Ad slots' }, fields: [enabled] },
  {
    slug: 'newsletter',
    labels: { singular: 'Newsletter sign-up', plural: 'Newsletter sign-ups' },
    fields: [enabled, heading, { name: 'text', type: 'text' }],
  },
]

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Settings', description: 'Add, reorder (drag) or switch off homepage sections.' },
  access: globalAccess,
  fields: [{ name: 'sections', type: 'blocks', blocks }],
}

export const AdSettings: GlobalConfig = {
  slug: 'ad-settings',
  label: 'Ad settings',
  admin: { group: 'Promotion' },
  access: globalAccess,
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show ads on the site (master switch)',
    },
    {
      name: 'adsenseClient',
      type: 'text',
      label: 'AdSense publisher ID',
      admin: { description: 'e.g. ca-pub-1234567890. Only needed once AdSense is approved.' },
    },
  ],
}
