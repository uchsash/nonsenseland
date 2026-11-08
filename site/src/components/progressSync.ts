'use client'

type Place = { chapter: number; ratio: number; at: number }

const FLUSH_AFTER = 10_000
const pending = new Map<string, Place>()
let timer: ReturnType<typeof setTimeout> | null = null
let markSynced: () => void = () => {}
let synced = false
const syncDone = new Promise<void>((resolve) => {
  markSynced = resolve
})

export const maybeSignedIn = () => document.cookie.split('; ').includes('nl-in=1')

export function progressSynced() {
  synced = true
  markSynced()
}

/** Settles once this browser has the reader's saved places; at once for signed-out visitors. */
export const whenProgressReady = () => (synced || !maybeSignedIn() ? Promise.resolve() : syncDone)

function flush() {
  if (timer) clearTimeout(timer)
  timer = null
  for (const [book, place] of pending) {
    // keepalive lets the last report finish while the page is closing.
    void fetch('/account/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book, ...place }),
      keepalive: true,
    }).catch(() => {})
  }
  pending.clear()
}

/** Reports a reading place to the server, at most once every ten seconds. */
export function queueProgress(book: string, place: Place) {
  if (!maybeSignedIn()) return
  pending.set(book, place)
  if (!timer) timer = setTimeout(flush, FLUSH_AFTER)
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pending.size) flush()
  })
}

/** Merges saved places: the newer of this browser's and the server's wins on both sides. */
export function mergeProgress(server: Record<string, Partial<Place>>) {
  const seen = new Set<string>()
  try {
    for (const [book, remote] of Object.entries(server)) {
      seen.add(book)
      const key = `nl-pos-${book}`
      const local = JSON.parse(localStorage.getItem(key) ?? 'null') as Place | null
      if ((remote.at ?? 0) > (local?.at ?? 0)) localStorage.setItem(key, JSON.stringify(remote))
      else if (local && (local.at ?? 0) > (remote.at ?? 0)) queueProgress(book, local)
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('nl-pos-')) continue
      const book = key.slice('nl-pos-'.length)
      if (seen.has(book)) continue
      const local = JSON.parse(localStorage.getItem(key) ?? 'null') as Place | null
      if (local?.chapter && local.at) queueProgress(book, local)
    }
  } catch {
    // Storage unavailable: the place just isn't shared from this browser.
  }
  window.dispatchEvent(new Event('nl-storage'))
}
