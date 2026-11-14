import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache'

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  // Without a tag cache, revalidatePath does nothing on Cloudflare: cached pages (home, books)
  // would not change after an admin save until the next deploy.
  tagCache: d1NextTagCache,
})
