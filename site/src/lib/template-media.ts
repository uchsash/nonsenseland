import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeDeleteHook, PayloadRequest } from 'payload'

import { idOf } from './video-thumbnail'

type Owner = { collection: 'articles' | 'videos'; field: 'cover' | 'thumbnail'; source: 'coverSource' | 'thumbnailSource' }

/** Images of documents being deleted, noted before their versions disappear. */
const pendingDeletes = new Map<string, (number | null)[]>()

const isAutomatic = (source: unknown) => source === 'template' || source === 'card' || source === 'youtube'

/** Removes an automatic image unless a saved document (published or draft) still shows it. */
async function removeIfUnused({ collection, field }: Owner, id: number, req: PayloadRequest, deleted?: number | string) {
  // While a document is being deleted its own versions may still be there; they don't count.
  const notDeleted = deleted ? [{ parent: { not_equals: deleted } }] : []
  const where = { [field]: { equals: id } }
  const [live, latest] = await Promise.all([
    req.payload.count({ collection, where, req }),
    req.payload.countVersions({ collection, where: { and: [{ latest: { equals: true } }, { [`version.${field}`]: { equals: id } }, ...notDeleted] }, req }),
  ])
  if (live.totalDocs || latest.totalDocs) return
  await req.payload
    .delete({ collection: 'media', id, req })
    .catch((err) => req.payload.logger.warn({ err }, 'Could not remove an old automatic image'))
}

/**
 * Hooks that keep the media library tidy: an automatic image (template header, title card,
 * YouTube thumbnail) is removed once it is replaced or its document is deleted — but never
 * while the published or the latest draft version still uses it, and never one you uploaded.
 */
export function automaticImageCleanup(owner: Owner) {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    const before = idOf(previousDoc?.[owner.field])
    if (!before || before === idOf(doc[owner.field]) || !isAutomatic(previousDoc?.[owner.source])) return
    await removeIfUnused(owner, before, req)
  }
  // Before deleting, note the latest draft's image too (the versions are gone afterwards).
  const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
    const versions = await req.payload
      .findVersions({ collection: owner.collection, where: { parent: { equals: id } }, sort: '-updatedAt', limit: 20, depth: 0, req })
      .catch(() => null)
    pendingDeletes.set(`${owner.collection}:${id}`, (versions?.docs ?? [])
      .filter((v) => isAutomatic((v.version as unknown as Record<string, unknown>)[owner.source]))
      .map((v) => idOf((v.version as unknown as Record<string, unknown>)[owner.field])))
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    const key = `${owner.collection}:${doc.id}`
    const ids = new Set<number>((pendingDeletes.get(key) ?? []).filter((x): x is number => !!x))
    pendingDeletes.delete(key)
    if (isAutomatic(doc[owner.source]) && idOf(doc[owner.field])) ids.add(idOf(doc[owner.field])!)
    for (const id of ids) await removeIfUnused(owner, id, req, doc.id)
  }
  return { afterChange, beforeDelete, afterDelete }
}
