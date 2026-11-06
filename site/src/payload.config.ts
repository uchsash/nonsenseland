import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { BlocksFeature, lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig, type CollectionConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

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
import { LinesBlock } from './blocks/Lines'
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

// Files go to Cloudflare R2 in production; local disk in development.
const r2 = process.env.R2_BUCKET
  ? [
      s3Storage({
        collections: { media: true, 'book-files': true },
        bucket: process.env.R2_BUCKET,
        config: {
          endpoint: process.env.R2_ENDPOINT,
          region: 'auto',
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
          },
        },
      }),
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
    ...[Articles, Videos, Categories, Topics, Authors, Pages, Books, Chapters, Media, Ads].map(withRevalidation),
    BookFiles,
    Subscribers,
    Messages,
    KindleSends,
    Orders,
    Coupons,
    Entitlements,
    ReadingProgress,
    Users,
  ],
  globals: [SiteSettings, Homepage, AdSettings, InterfaceText].map((g) => ({
    ...g,
    hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobal] },
  })),
  // Runs scheduled publishing every minute while the server runs.
  // On Cloudflare a Cron Trigger calls /api/payload-jobs/run instead (set up at deployment).
  jobs: { autoRun: [{ cron: '* * * * *', queue: 'default' }] },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      // Text colours from the logo (toolbar: “Aa” colour menu).
      TextStateFeature({
        state: {
          color: Object.fromEntries(
            Object.entries(PALETTE).map(([key, { label, hex }]) => [key, { label, css: { color: hex } }]),
          ),
        },
      }),
      // “Lines without gaps” block (toolbar: + → Lines without gaps).
      BlocksFeature({ blocks: [LinesBlock] }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes go through migrations in production (npm run payload migrate).
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
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
