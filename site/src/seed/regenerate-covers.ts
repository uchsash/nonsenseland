/**
 * Re-creates the resized versions of every book cover after the image sizes change
 * (covers are no longer cropped). Run with: npx payload run src/seed/regenerate-covers.ts
 */
import fs from 'fs'
import path from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const books = await payload.find({ collection: 'books', limit: 500, depth: 1, draft: true })
for (const book of books.docs) {
  const cover = book.cover as { id: number; filename?: string; mimeType?: string } | null
  if (!cover?.filename) continue
  const file = path.resolve(process.cwd(), 'media', cover.filename)
  if (!fs.existsSync(file)) continue
  const data = fs.readFileSync(file)
  // Uploading the same file again makes Payload rebuild all sizes with the current settings.
  await payload.update({
    collection: 'media',
    id: cover.id,
    data: {},
    file: { data, mimetype: cover.mimeType ?? 'image/webp', name: cover.filename, size: data.length },
    overwriteExistingFiles: true,
  })
  payload.logger.info(`${book.title}: cover sizes rebuilt`)
}
process.exit(0)
