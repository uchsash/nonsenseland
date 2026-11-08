'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import type { PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { FRAME_INNER, framePhoto } from '@/utilities/photo-frame'

type Media = { url: string; width: number; height: number }

const buttonStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid rgba(128,128,128,.4)',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
}

/**
 * Choose how the photo sits in the header's frame: drag to move it, slide to zoom,
 * or “Show the whole photo” to keep everything visible. Saved with the article.
 */
export function HeaderPhotoFrame() {
  const photo = useFormFields(([fields]) => fields['header.photo']?.value) as number | { id: number } | null | undefined
  const photoId = typeof photo === 'object' ? photo?.id : photo
  const zoom = useField<number | null>({ path: 'header.zoom' })
  const focusX = useField<number | null>({ path: 'header.focusX' })
  const focusY = useField<number | null>({ path: 'header.focusY' })
  const [loaded, setLoaded] = useState<{ id: number; media: Media } | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
  const seenPhoto = useRef(photoId)

  useEffect(() => {
    if (!photoId) return
    let stale = false
    fetch(`/api/media/${photoId}?depth=0`, { credentials: 'include' })
      .then((r) => r.json())
      .then((doc) => {
        if (!stale && doc?.url) setLoaded({ id: photoId, media: { url: doc.url, width: doc.width, height: doc.height } })
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [photoId])

  // A different photo starts from the automatic framing again.
  useEffect(() => {
    if (seenPhoto.current === photoId) return
    seenPhoto.current = photoId
    zoom.setValue(null)
    focusX.setValue(null)
    focusY.setValue(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId])

  const media = loaded && loaded.id === photoId ? loaded.media : null
  if (!photoId) return null
  if (!media) return <p style={{ marginBottom: 24 }}>Loading the photo…</p>

  const placed = framePhoto(media, { zoom: zoom.value, focusX: focusX.value, focusY: focusY.value })
  const percent = (value: number, of: number) => `${(value / of) * 100}%`
  const auto = zoom.value == null

  const set = (next: { zoom?: number; cx?: number; cy?: number }) => {
    zoom.setValue(next.zoom ?? placed.zoom)
    focusX.setValue(next.cx ?? placed.cx)
    focusY.setValue(next.cy ?? placed.cy)
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, cx: placed.cx, cy: placed.cy }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !box.current) return
    // Screen pixels → frame pixels → a share of the photo; the photo follows the pointer.
    const ratio = FRAME_INNER.w / box.current.clientWidth
    const dx = ((e.clientX - drag.current.x) * ratio) / placed.width
    const dy = ((e.clientY - drag.current.y) * ratio) / placed.height
    set({ cx: Math.min(1, Math.max(0, drag.current.cx - dx)), cy: Math.min(1, Math.max(0, drag.current.cy - dy)) })
  }

  return (
    <div className="field-type" style={{ marginBottom: 24, maxWidth: 480 }}>
      <label className="field-label">Position in the frame</label>
      <div
        ref={box}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        style={{
          position: 'relative',
          aspectRatio: `${FRAME_INNER.w} / ${FRAME_INNER.h}`,
          overflow: 'hidden',
          borderRadius: 12,
          cursor: 'grab',
          touchAction: 'none',
          background: '#222',
        }}
      >
        <img
          src={media.url}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(.8)', transform: 'scale(1.15)' }}
        />
        <img
          src={media.url}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: percent(placed.left, FRAME_INNER.w),
            top: percent(placed.top, FRAME_INNER.h),
            width: percent(placed.width, FRAME_INNER.w),
            height: percent(placed.height, FRAME_INNER.h),
            maxWidth: 'none',
          }}
        />
      </div>
      <input
        type="range"
        aria-label="Zoom"
        min={placed.fit}
        max={3}
        step={0.01}
        value={placed.zoom}
        onChange={(e) => set({ zoom: Number(e.target.value) })}
        style={{ width: '100%', margin: '10px 0' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={buttonStyle} onClick={() => set({ zoom: placed.fit, cx: 0.5, cy: 0.5 })}>
          Show the whole photo
        </button>
        <button type="button" style={buttonStyle} onClick={() => set({ zoom: 1, cx: 0.5, cy: 0.5 })}>
          Fill the frame
        </button>
        <button
          type="button"
          style={buttonStyle}
          disabled={auto}
          onClick={() => {
            zoom.setValue(null)
            focusX.setValue(null)
            focusY.setValue(null)
          }}
        >
          Automatic
        </button>
      </div>
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Drag the photo to move it. {auto ? 'Now: automatic, the site picks the area when you save.' : 'Save the article to apply.'}
      </p>
    </div>
  )
}
