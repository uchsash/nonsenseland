/**
 * The Worker's bindings (see wrangler.jsonc). Written by hand: the generated Workers runtime
 * types clash with the browser types the rest of the site uses.
 */
interface R2ObjectBodyLike {
  arrayBuffer(): Promise<ArrayBuffer>
  body: ReadableStream
  httpEtag: string
  writeHttpMetadata(headers: Headers): void
}
interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>
  delete(key: string | string[]): Promise<void>
}
interface ImagesBindingLike {
  input(stream: ReadableStream): {
    transform(options: Record<string, unknown>): ReturnType<ImagesBindingLike['input']>
    output(options: { format: string; quality?: number }): Promise<{ response(): Response }>
  }
}
interface CloudflareEnv {
  HYPERDRIVE: { connectionString: string }
  R2: R2BucketLike
  R2_FILES: R2BucketLike
  NEXT_INC_CACHE_R2_BUCKET: R2BucketLike
  NEXT_TAG_CACHE_D1: unknown
  IMAGES: ImagesBindingLike
  ASSETS: { fetch(request: Request): Promise<Response> }
  NEXT_PUBLIC_SERVER_URL: string
}
