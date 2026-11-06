'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'

import { useT } from '@/i18n/client'
import { bnNumber } from '@/utilities/bn'

/** Same limit as the খুচরো আলাপ collection (kept here so this browser file stays light). */
const MAX = 220

import { createAlap, type PostState } from './actions'

/** Shrinks a photo in the browser (max 1600 px, JPEG) so posting is fast on mobile data. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
}

export function PostForm() {
  const t = useT()
  const [preview, setPreview] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const photo = useRef<File | null>(null)
  const [state, action, pending] = useActionState(async (prev: PostState, form: FormData) => {
    if (photo.current) form.set('image', photo.current)
    const result = await createAlap(prev, form)
    if (result.ok) {
      photo.current = null
      setPreview(null)
    }
    return result
  }, {})

  if (state.ok) {
    return (
      <div className="post-done">
        <p>{state.message}</p>
        <div className="book-actions">
          <Link className="btn" href="/alap">
            {t.post.view}
          </Link>
          <Link className="btn ghost" href="/post">
            {t.post.another}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="post-form">
      <label className="field">
        <span className="sr-only">{t.post.text}</span>
        <textarea
          className="input"
          name="text"
          required
          rows={6}
          maxLength={MAX}
          placeholder={t.post.text}
          onChange={(e) => setCount(e.target.value.length)}
        />
        <span className={`char-count${count > MAX - 20 ? ' is-near' : ''}`} aria-live="polite">
          {bnNumber(count)} / {bnNumber(MAX)}
        </span>
      </label>
      <label className="field">
        {t.post.image}
        <input
          className="input"
          type="file"
          accept="image/*"
          required
          onChange={async (e) => {
            const file = e.target.files?.[0]
            photo.current = file ? await shrink(file) : null
            setPreview(photo.current ? URL.createObjectURL(photo.current) : null)
          }}
        />
      </label>
      {preview ? <img className="post-preview" src={preview} alt="" /> : null}
      <button className="btn" disabled={pending}>
        {pending ? t.post.posting : t.post.submit}
      </button>
      {state.message ? (
        <p className="form-note" role="status" style={{ color: 'var(--accent)' }}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
