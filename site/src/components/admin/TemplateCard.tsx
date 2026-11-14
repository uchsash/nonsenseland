'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { drawTitleCard } from './titleCardCanvas'

const idOf = (value: unknown): number | null =>
  typeof value === 'number' ? value : value && typeof value === 'object' ? ((value as { id?: number }).id ?? null) : null

const cache = new Map<string, Promise<string | null>>()
/** A field of a document, fetched once (category name, photo URL). */
const lookup = (collection: string, id: number, key: 'name' | 'url') => {
  const k = `${collection}/${id}/${key}`
  if (!cache.has(k)) {
    cache.set(
      k,
      fetch(`/api/${collection}/${id}?depth=0`, { credentials: 'include' })
        .then((r) => r.json())
        .then((doc) => (doc?.[key] as string) ?? null)
        .catch(() => null),
    )
  }
  return cache.get(k)!
}

/**
 * Preview of the template image (article header or video title card), drawn in the browser.
 * The drawing is sent with the save (field `templateImage`), and the server stores it when a
 * new image is needed, exactly where it used to make one itself.
 */
export function TemplateCard({ group }: { group: 'header' | 'card' }) {
  const fields = useFormFields(([f]) => ({
    title: f.title?.value as string | undefined,
    category: f.category?.value,
    photo: group === 'header' ? f['header.photo']?.value : null,
    zoom: f[`${group}.zoom`]?.value as number | null | undefined,
    focusX: f[`${group}.focusX`]?.value as number | null | undefined,
    focusY: f[`${group}.focusY`]?.value as number | null | undefined,
    highlight: f[`${group}.highlight`]?.value as string | undefined,
    line2: f[`${group}.line2`]?.value as string | undefined,
    subline: f[`${group}.subline`]?.value as string | undefined,
  }))
  const drawn = useField<string | null>({ path: 'templateImage' })
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const run = useRef(0)
  const key = JSON.stringify(fields)

  useEffect(() => {
    const ticket = ++run.current
    const timer = setTimeout(async () => {
      if (!fields.title) return
      try {
        const categoryId = idOf(fields.category)
        const photoId = idOf(fields.photo)
        const [category, photoUrl] = await Promise.all([
          categoryId ? lookup('categories', categoryId, 'name') : null,
          photoId ? lookup('media', photoId, 'url') : null,
        ])
        const url = await drawTitleCard({
          title: fields.title,
          category: category ?? undefined,
          highlight: fields.highlight,
          line2: fields.line2,
          subline: fields.subline,
          photoUrl,
          framing: { zoom: fields.zoom, focusX: fields.focusX, focusY: fields.focusY },
        })
        if (ticket !== run.current) return
        setPreview(url)
        setError(null)
        // Not a change of its own: the form is only "modified" by what the owner edits.
        drawn.setValue(url, true)
      } catch (e) {
        if (ticket === run.current) setError(e instanceof Error ? e.message : String(e))
      }
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!fields.title) return null
  return (
    <div className="field-type" style={{ marginBottom: 24, maxWidth: 480 }}>
      <label className="field-label">Preview (this is what will be saved)</label>
      {preview ? (
        <img src={preview} alt="" style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(128,128,128,.3)' }} />
      ) : (
        <p>{error ? `Could not draw the image: ${error}` : 'Drawing…'}</p>
      )}
    </div>
  )
}

export const HeaderTemplateCard = () => <TemplateCard group="header" />
export const VideoTemplateCard = () => <TemplateCard group="card" />
