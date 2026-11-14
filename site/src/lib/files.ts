import fs from 'fs/promises'
import path from 'path'

import { workerEnv } from './cloudflare'

/**
 * Reads an uploaded file on the server, bypassing public URLs:
 * from R2 in production, from the local upload folder in development.
 */
export async function readStoredFile(collection: 'book-files' | 'media', filename: string): Promise<Buffer> {
  const cf = await workerEnv()
  if (cf) {
    const object = await (collection === 'media' ? cf.R2 : cf.R2_FILES).get(filename)
    if (!object) throw new Error(`File not found: ${filename}`)
    return Buffer.from(await object.arrayBuffer())
  }
  return fs.readFile(path.resolve(process.cwd(), collection, filename))
}
