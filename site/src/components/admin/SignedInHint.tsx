'use client'

import { useEffect } from 'react'

/**
 * Logging in through the admin sets Payload's cookie but not the site's "may be signed in"
 * hint (nl-in), so the public pages would treat an admin as logged out (Kindle box, likes)
 * while the server knows better. Shown in the admin's menu, so only when logged in there.
 */
export function SignedInHint() {
  useEffect(() => {
    if (!document.cookie.split('; ').some((c) => c.startsWith('nl-in=')))
      document.cookie = `nl-in=1; path=/; max-age=604800; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
  }, [])
  return null
}
