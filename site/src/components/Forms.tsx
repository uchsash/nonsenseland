'use client'

import Script from 'next/script'
import { useActionState } from 'react'

import { type FormState, sendMessage, sendToKindle, subscribe } from '@/app/(frontend)/actions'
import { useT } from '@/i18n/client'

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Invisible-by-default Cloudflare spam check; renders nothing until keys are set. */
function Human() {
  if (!siteKey) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-appearance="interaction-only" />
    </>
  )
}

const Note = ({ state }: { state: FormState }) =>
  state.message ? (
    <p className="form-note" role="status" style={{ color: state.ok ? 'inherit' : 'var(--accent)' }}>
      {state.message}
    </p>
  ) : null

export function NewsletterForm() {
  const t = useT()
  const [state, action, pending] = useActionState(subscribe, {})
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
          placeholder={t.newsletter.placeholder}
          autoComplete="email"
        />
        <button className="btn" disabled={pending}>
          {t.newsletter.button}
        </button>
      </div>
      <Human />
      <Note state={state} />
    </form>
  )
}

export function ContactForm() {
  const t = useT()
  const [state, action, pending] = useActionState(sendMessage, {})
  if (state.ok) return <Note state={state} />
  return (
    <form action={action} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
      <label className="field">
        {t.contact.name}
        <input className="input" name="name" required autoComplete="name" />
      </label>
      <label className="field">
        {t.contact.email}
        <input className="input" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="field">
        {t.contact.message}
        <textarea className="input" name="message" required />
      </label>
      <Human />
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
          placeholder={t.kindle.placeholder}
        />
        <button className="btn" disabled={pending}>
          {pending ? t.kindle.sending : t.kindle.send}
        </button>
      </div>
      <Human />
      <Note state={state} />
    </form>
  )
}
