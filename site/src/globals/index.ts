import type { Block, Field, GlobalConfig } from 'payload'

import { anyone, staffOnly } from '../access'
import { defaults } from '../i18n/bn'
import { colorField } from '../utilities/palette'

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
            {
              name: 'introTitle',
              type: 'textarea',
              required: true,
              defaultValue: 'যা কিছু কথা, সব কথা',
              admin: { rows: 2, description: 'Press Enter to start a new line.' },
            },
            colorField('introTitleColor', 'Title colour'),
            {
              name: 'introText',
              type: 'textarea',
              defaultValue: 'ভিডিও, লেখা আর বই — ননসেন্সল্যান্ডে সব কথার আসর।',
              admin: {
                rows: 4,
                description: 'Enter = new line (no gap). An empty line between = new paragraph (with a gap).',
              },
            },
            {
              name: 'introSpacing',
              type: 'select',
              label: 'Line spacing',
              defaultValue: 'normal',
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Normal', value: 'normal' },
                { label: 'Loose', value: 'loose' },
              ],
            },
            {
              name: 'introImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'The sketch or a photo. Leave empty to show the icon.' },
            },
            {
              name: 'introButtons',
              type: 'array',
              maxRows: 3,
              labels: { singular: 'Button', plural: 'Buttons' },
              admin: {
                description:
                  'Each button jumps to a section further down the homepage. The first button is filled orange.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                    {
                      name: 'section',
                      type: 'text',
                      label: 'Goes to',
                      admin: { width: '60%', components: { Field: '/components/admin/SectionSelect#SectionSelect' } },
                    },
                  ],
                },
                {
                  name: 'href',
                  type: 'text',
                  label: 'Or a link instead',
                  admin: { description: 'Optional, e.g. /about. Only used when no section is chosen.' },
                },
              ],
            },
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
    slug: 'alap',
    labels: { singular: 'খুচরো আলাপ deck', plural: 'খুচরো আলাপ decks' },
    fields: [enabled, heading],
  },
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

const SECTION_LABELS: Record<string, string> = {
  nav: 'Menu & header',
  common: 'General',
  video: 'Videos',
  article: 'Articles',
  book: 'Books',
  kindle: 'Send to Kindle',
  reader: 'Reader settings (Aa panel)',
  share: 'Share buttons',
  search: 'Search',
  newsletter: 'Newsletter',
  contact: 'Contact form',
  ad: 'Ads',
  alap: 'খুচরো আলাপ (deck)',
  post: 'খুচরো আলাপ (quick-post page)',
  notFound: 'Page not found',
}

const humanize = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())

/** One text field per interface label, pre-filled with the current text; groups mirror i18n/bn.ts. */
const textFields = (values: Record<string, unknown>): Field[] =>
  Object.entries(values).map(([key, value]): Field => {
    if (typeof value === 'string') {
      return {
        name: key,
        type: 'text',
        label: humanize(key),
        defaultValue: value,
        admin: {
          placeholder: value,
          description: value.includes('{') ? `Default: ${value} — keep {n} where the number goes.` : `Default: ${value}`,
        },
      }
    }
    return {
      name: key,
      type: 'group',
      label: SECTION_LABELS[key] ?? humanize(key),
      fields: textFields(value as Record<string, unknown>),
    }
  })

export const InterfaceText: GlobalConfig = {
  slug: 'interface-text',
  label: 'Interface text',
  admin: {
    group: 'Settings',
    description:
      'Every button, label and message on the site. Change the wording here; empty a field to go back to the default.',
  },
  access: globalAccess,
  fields: textFields(defaults),
}
