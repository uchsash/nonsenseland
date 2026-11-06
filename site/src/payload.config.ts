import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
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
import { AdSettings, Homepage, SiteSettings } from './globals'

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
    Articles,
    Videos,
    Categories,
    Topics,
    Authors,
    Pages,
    Books,
    Chapters,
    Media,
    BookFiles,
    Ads,
    Subscribers,
    Messages,
    KindleSends,
    Orders,
    Coupons,
    Entitlements,
    ReadingProgress,
    Users,
  ],
  globals: [SiteSettings, Homepage, AdSettings],
  editor: lexicalEditor(),
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
