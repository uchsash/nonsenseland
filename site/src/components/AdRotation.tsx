'use client'

import { Children, type ReactNode, useLayoutEffect, useRef } from 'react'

/**
 * Shows one of the ads at random. On a full page load the inline script below has already
 * chosen before the first paint (pages are cached, so the server cannot choose per visitor);
 * when the reader arrives by a link inside the site React does not run that script, and the
 * layout effect chooses instead, still before the paint.
 */
const PICK = `(()=>{const s=document.currentScript.previousElementSibling,c=s.children,n=Math.floor(Math.random()*c.length);for(let i=0;i<c.length;i++)c[i].hidden=i!==n;s.dataset.picked='1'})()`

export function AdRotation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box || box.dataset.picked) return
    const items = Array.from(box.children) as HTMLElement[]
    const n = Math.floor(Math.random() * items.length)
    items.forEach((el, i) => (el.hidden = i !== n))
    box.dataset.picked = '1'
  }, [])
  return (
    <>
      <div ref={ref} className="ad-rotation" suppressHydrationWarning>
        {Children.map(children, (child, i) => (
          <div hidden={i > 0} suppressHydrationWarning>
            {child}
          </div>
        ))}
      </div>
      <script dangerouslySetInnerHTML={{ __html: PICK }} suppressHydrationWarning />
    </>
  )
}
