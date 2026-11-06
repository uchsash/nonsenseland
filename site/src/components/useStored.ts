'use client'

import { useSyncExternalStore } from 'react'

const CHANGE = 'nl-storage'

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange) // other tabs
  window.addEventListener(CHANGE, onChange) // this tab
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE, onChange)
  }
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // private mode / blocked storage
  }
}

/**
 * A value saved in this browser. The server (and the first render in the browser)
 * always sees `null`, so the HTML matches and there is no hydration mismatch.
 */
export function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  )
}

export function setStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the setting just won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGE))
}

export function parseStored<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
