/** True when running inside a Cloudflare Worker (the live site), false in Node (dev, scripts). */
export const onWorkers = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

/** The Worker's bindings (database, R2 buckets, images), or undefined outside Workers. */
export async function workerEnv(): Promise<CloudflareEnv | undefined> {
  if (!onWorkers) return undefined
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  return (await getCloudflareContext({ async: true })).env
}
