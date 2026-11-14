'use client'

import { usePathname } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'

import { type FormState, sendMessage, sendToKindle, subscribe } from '@/app/(frontend)/actions'
import { useT } from '@/i18n/client'

import { useAccount } from './AccountProvider'

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

/** The Turnstile script, loaded once for the whole visit (explicit rendering). */
let turnstileReady: Promise<Turnstile> | null = null
const loadTurnstile = () =>
  (turnstileReady ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    script.onerror = () => {
      turnstileReady = null
      reject(new Error('turnstile'))
    }
    document.head.append(script)
  }))

/**
 * Invisible-by-default Cloudflare spam check; renders nothing until keys are set.
 * Rendered explicitly whenever a form appears (also after moving between pages inside the
 * site, where the script's one-time page scan would miss it), renewed before it expires, and
 * started afresh after each submission (`reset` changes), since a pass can be used only once.
 */
export function Human({ reset }: { reset?: unknown }) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !box.current) return
        widget.current = turnstile.render(box.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          'refresh-expired': 'auto',
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [])

  useEffect(() => {
    if (reset !== undefined && widget.current) window.turnstile?.reset(widget.current)
  }, [reset])

  if (!siteKey) return null
  return <div ref={box} className="cf-turnstile" />
}

export const Note = ({ state }: { state: FormState }) =>
  state.message ? (
    <p className="form-note" role="status" style={{ color: state.ok ? 'inherit' : 'var(--accent)' }}>
      {state.message}
    </p>
  ) : null

export function NewsletterForm() {
  const t = useT()
  const [state, action, pending] = useActionState(subscribe, {})
  const { user } = useAccount()
  return (
    <form action={action}>
      <div className="inline-form">
        <label className="sr-only" htmlFor="nl-email">
          {t.newsletter.placeholder}
        </label>
        <input
          id="nl-email"
          className="input"
          type="email"
          name="email"
          required
          key={user?.email ?? ''}
          defaultValue={user?.email ?? ''}
          placeholder={t.newsletter.placeholder}
          autoComplete="email"
        />
        <button className="btn" disabled={pending}>
          {t.newsletter.button}
        </button>
      </div>
      <Human reset={state} />
      <Note state={state} />
    </form>
  )
}

export function ContactForm() {
  const t = useT()
  const [state, action, pending] = useActionState(sendMessage, {})
  // Signed-in readers find their name and email already filled in.
  const { user } = useAccount()
  if (state.ok) return <Note state={state} />
  return (
    <form action={action} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
      <label className="field">
        {t.contact.name}
        <input className="input" name="name" required autoComplete="name" key={`n${user?.id ?? ''}`} defaultValue={user?.name ?? ''} />
      </label>
      <label className="field">
        {t.contact.email}
        <input className="input" type="email" name="email" required autoComplete="email" key={`e${user?.id ?? ''}`} defaultValue={user?.email ?? ''} />
      </label>
      <label className="field">
        {t.contact.message}
        <textarea className="input" name="message" required />
      </label>
      <Human reset={state} />
      <div>
        <button className="btn" disabled={pending}>
          {t.contact.send}
        </button>
      </div>
      <Note state={state} />
    </form>
  )
}

export function KindleForm({ bookId, sender }: { bookId: number; sender: string }) {
  const t = useT()
  const [state, action, pending] = useActionState(sendToKindle, {})
  const { user } = useAccount()
  const pathname = usePathname()
  // Sending to Kindle needs a free account, like downloading.
  if (!user) {
    const next = `?next=${encodeURIComponent(pathname)}`
    return (
      <div className="kindle-box">
        <strong>{t.kindle.title}</strong>
        <p className="muted" style={{ margin: '8px 0' }}>
          {t.kindle.loginFirst}
        </p>
        <a href={`/login${next}`} className="btn">
          {t.kindle.loginButton}
        </a>
      </div>
    )
  }
  return (
    <form action={action} className="kindle-box">
      <strong>{t.kindle.title}</strong>
      <p className="muted" style={{ margin: '8px 0' }}>
        {t.kindle.step} <code>{sender}</code>{' '}
        <a
          href="https://www.amazon.com/sendtokindle/email"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          {t.kindle.help}
        </a>
      </p>
      <input type="hidden" name="book" value={bookId} />
      <div className="inline-form">
        <label className="sr-only" htmlFor="kindle-email">
          {t.kindle.intro}
        </label>
        <input
          id="kindle-email"
          className="input"
          type="email"
          name="kindle"
          required
          key={user?.kindleEmail ?? ''}
          defaultValue={user?.kindleEmail ?? ''}
          placeholder={t.kindle.placeholder}
        />
        <button className="btn" disabled={pending}>
          {pending ? t.kindle.sending : t.kindle.send}
        </button>
      </div>
      <Human reset={state} />
      <Note state={state} />
    </form>
  )
}
