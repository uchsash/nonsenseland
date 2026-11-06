import fs from 'fs/promises'
import path from 'path'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

let client: S3Client | undefined
const r2 = () =>
  (client ??= new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  }))

/**
 * Reads an uploaded file on the server, bypassing public URLs:
 * from R2 in production, from the local upload folder in development.
 */
export async function readStoredFile(collection: 'book-files' | 'media', filename: string): Promise<Buffer> {
  if (process.env.R2_BUCKET) {
    const res = await r2().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: filename }))
    return Buffer.from(await res.Body!.transformToByteArray())
  }
  return fs.readFile(path.resolve(process.cwd(), collection, filename))
}
