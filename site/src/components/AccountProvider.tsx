'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { maybeSignedIn, mergeProgress, progressSynced } from './progressSync'

type AccountUser = { id: number; name?: string | null; email: string; kindleEmail?: string | null }

type Account = {
  user: AccountUser | null
  likes: Set<number>
  bookmarks: Set<string>
  counts: Record<number, number>
  loadCounts: () => void
  toggleLike: (id: number) => void
  toggleBookmark: (kind: string, target: number) => void
}

const Context = createContext<Account | null>(null)

export const useAccount = () => {
  const value = use(Context)
  if (!value) throw new Error('useAccount needs AccountProvider')
  return value
}

const post = (path: string, body: unknown) =>
  fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** Visitors who were never signed in cost no request: the state is fetched only with the hint cookie. */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const stateLoaded = useRef(false)
  const [user, setUser] = useState<AccountUser | null>(null)
  const [likes, setLikes] = useState<Set<number>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [counts, setCounts] = useState<Record<number, number>>({})
  const countsLoaded = useRef(false)

  // Runs on every navigation until loaded, so it also picks up a login that just happened.
  useEffect(() => {
    if (stateLoaded.current) return
    if (!maybeSignedIn()) return
    stateLoaded.current = true
    fetch('/account/state', { cache: 'no-store' })
      .then((r) => r.json())
      .then((state) => {
        if (!state.user) {
          document.cookie = 'nl-in=; path=/; max-age=0'
          return
        }
        setUser(state.user)
        setLikes(new Set(state.likes))
        setBookmarks(new Set(state.bookmarks))
        mergeProgress(state.progress)
      })
      .catch(() => {})
      .finally(progressSynced)
  }, [pathname])

  const loadCounts = useCallback(() => {
    if (countsLoaded.current) return
    countsLoaded.current = true
    fetch('/alap/likes')
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {})
  }, [])

  const toLogin = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(pathname)}`)
  }, [pathname, router])

  const toggleLike = useCallback(
    (id: number) => {
      if (!maybeSignedIn()) return toLogin()
      setLikes((prev) => {
        const next = new Set(prev)
        if (!next.delete(id)) next.add(id)
        return next
      })
      post('/account/like', { alap: id })
        .then((r) => (r.status === 401 ? (toLogin(), null) : r.json()))
        .then((result) => {
          if (!result) return
          setCounts((prev) => ({ ...prev, [id]: result.count }))
          setLikes((prev) => {
            const next = new Set(prev)
            if (result.liked) next.add(id)
            else next.delete(id)
            return next
          })
        })
        .catch(() => {})
    },
    [toLogin],
  )

  const toggleBookmark = useCallback(
    (kind: string, target: number) => {
      if (!maybeSignedIn()) return toLogin()
      const key = `${kind}:${target}`
      setBookmarks((prev) => {
        const next = new Set(prev)
        if (!next.delete(key)) next.add(key)
        return next
      })
      post('/account/bookmark', { kind, target })
        .then((r) => {
          if (r.status === 401) toLogin()
        })
        .catch(() => {})
    },
    [toLogin],
  )

  const value = useMemo(
    () => ({ user, likes, bookmarks, counts, loadCounts, toggleLike, toggleBookmark }),
    [user, likes, bookmarks, counts, loadCounts, toggleLike, toggleBookmark],
  )
  return <Context value={value}>{children}</Context>
}
