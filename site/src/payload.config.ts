import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { BlocksFeature, lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import path from 'path'
import { buildConfig, type CollectionConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Alap } from './collections/Alap'
import { Articles } from './collections/Articles'
import { BookFiles } from './collections/BookFiles'
import { Books } from './collections/Books'
import { Chapters } from './collections/Chapters'
import { Media } from './collections/Media'
import {
  Ads,
  Coupons,
  Entitlements,
  KindleSends,
  Messages,
  Orders,
  Pages,
  ReadingProgress,
  Subscribers,
} from './collections/Site'
import { Authors, Categories, Topics } from './collections/Taxonomy'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { workerEnv } from './lib/cloudflare'
import { AdBlock } from './blocks/AdBlock'
import { LinesBlock } from './blocks/Lines'
import { Bookmarks, Likes, Newsletters } from './collections/Readers'
import { FootnoteLinkFeature } from './features/footnoteLink'
import { deliverNewsletter } from './lib/newsletter'
import { ParagraphStyleFeature } from './features/paragraphStyle/feature.server'
import { AdSettings, Homepage, InterfaceText, SiteSettings } from './globals'
import { PALETTE } from './utilities/palette'
import { revalidateAfterChange, revalidateAfterDelete, revalidateGlobal } from './utilities/revalidate'

/** Collections shown on the public site refresh its cache when they change. */
const withRevalidation = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  hooks: {
    ...c.hooks,
    afterChange: [...(c.hooks?.afterChange ?? []), revalidateAfterChange],
    afterDelete: [...(c.hooks?.afterDelete ?? []), revalidateAfterDelete],
  },
})

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// On Cloudflare: the database through Hyperdrive, files in R2. In development: local
// Postgres and the local upload folders.
const cf = await workerEnv()
// (The plugin's _objectKey column is declared on the collections, so the schema matches.)
const r2 = cf
  ? [
      r2Storage({ collections: { media: true }, bucket: cf.R2 as never }),
      r2Storage({ collections: { 'book-files': true }, bucket: cf.R2_FILES as never }),
    ]
  : []

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Nonsenseland admin' },
  },
  collections: [
    ...[Articles, Videos, Alap, Categories, Topics, Authors, Pages, Books, Chapters, Media, Ads].map(withRevalidation),
    BookFiles,
    Subscribers,
    Messages,
    KindleSends,
    Orders,
    Coupons,
    Entitlements,
    ReadingProgress,
    Bookmarks,
    Likes,
    Newsletters,
    Users,
  ],
  globals: [SiteSettings, Homepage, AdSettings, InterfaceText].map((g) => ({
    ...g,
    hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobal] },
  })),
  // Development: runs queued jobs (scheduled publishing) every minute while the server runs.
  // Cloudflare: the hourly Cron Trigger in worker.ts calls /api/payload-jobs/run with CRON_SECRET.
  jobs: {
    autoRun: cf ? undefined : [{ cron: '* * * * *', queue: 'default' }],
    access: {
      run: ({ req }) =>
        Boolean(req.user) ||
        (Boolean(process.env.CRON_SECRET) && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`),
    },
    tasks: [
      {
        slug: 'sendNewsletter',
        retries: 3,
        inputSchema: [{ name: 'newsletter', type: 'number', required: true }],
        handler: async ({ input, req }) => {
          await deliverNewsletter(input.newsletter, req.payload)
          return { output: {} }
        },
      },
    ],
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      // The built-in link feature is replaced by one that also does footnotes.
      ...defaultFeatures.filter((feature) => feature.key !== 'link'),
      FootnoteLinkFeature,
      // ¶ menu: space above a paragraph, and “no indent”.
      ParagraphStyleFeature(),
      // Text colours from the logo (toolbar: “Aa” colour menu).
      TextStateFeature({
        state: {
          color: Object.fromEntries(
            Object.entries(PALETTE).map(([key, { label, hex }]) => [key, { label, css: { color: hex } }]),
          ),
        },
      }),
      // “Lines without gaps” block (toolbar: + → Lines without gaps).
      BlocksFeature({ blocks: [LinesBlock, AdBlock] }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: cf
      ? {
          connectionString: cf.HYPERDRIVE.connectionString,
          // A Worker cannot reuse a connection opened during another request, so each one is
          // closed after use. Cheap: Hyperdrive keeps the real connections to Neon open.
          maxUses: 1,
        }
      : { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes go through migrations in production (npm run payload migrate).
    push: process.env.NODE_ENV !== 'production',
  }),
  // Not on Workers: there, image sizes come from Cloudflare Images (see /img).
  sharp: cf ? undefined : sharp,
  plugins: [
    seoPlugin({
      collections: ['articles', 'videos', 'books', 'pages'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · ননসেন্সল্যান্ড`,
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.description ?? '',
    }),
    ...r2,
  ],
})
