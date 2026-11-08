'use client'

import Link from 'next/link'
import { type FormEvent, startTransition, useActionState } from 'react'

import {
  changePassword,
  deleteAccount,
  forgotPassword,
  login,
  resetPassword,
  signup,
  unsubscribe,
  updateProfile,
} from '@/app/(frontend)/account/actions'
import type { FormState } from '@/app/(frontend)/actions'
import { useT } from '@/i18n/client'

import { Human, Note } from './Forms'

type Action = (state: FormState, form: FormData) => Promise<FormState>

/** Submits without React's automatic reset, so a failed attempt keeps what was typed. */
function useForm(action: Action) {
  const [state, run, pending] = useActionState(action, {} as FormState)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => run(data))
  }
  return [state, submit, pending] as const
}

export function GoogleButton({ next }: { next: string }) {
  const t = useT()
  return (
    <a className="btn ghost auth-google" href={`/auth/google?next=${encodeURIComponent(next)}`}>
      {t.account.withGoogle}
    </a>
  )
}

export function LoginForm({ next }: { next: string }) {
  const t = useT()
  const [state, submit, pending] = useForm(login)
  return (
    <form onSubmit={submit} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        {t.account.email}
        <input className="input" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="field">
        {t.account.password}
        <input className="input" type="password" name="password" required autoComplete="current-password" />
      </label>
      <Human />
      <button className="btn" disabled={pending}>
        {t.account.login}
      </button>
      <Note state={state} />
      <p className="auth-links">
        <Link href="/forgot-password">{t.account.forgot}</Link>
        <Link href={`/signup?next=${encodeURIComponent(next)}`}>{t.account.createAccount}</Link>
      </p>
    </form>
  )
}

export function SignupForm({ next }: { next: string }) {
  const t = useT()
  const [state, submit, pending] = useForm(signup)
  return (
    <form onSubmit={submit} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        {t.account.name}
        <input className="input" name="name" required autoComplete="name" maxLength={120} />
      </label>
      <label className="field">
        {t.account.email}
        <input className="input" type="email" name="email" required autoComplete="email" />
      </label>
      <label className="field">
        {t.account.password}
        <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" />
        <span className="muted field-hint">{t.account.passwordHint}</span>
      </label>
      <label className="check">
        <input type="checkbox" name="newsletter" />
        {t.account.wantNewsletter}
      </label>
      <Human />
      <button className="btn" disabled={pending}>
        {t.account.createAccount}
      </button>
      <Note state={state} />
      <p className="auth-links">
        <Link href={`/login?next=${encodeURIComponent(next)}`}>{t.account.haveAccount}</Link>
      </p>
    </form>
  )
}

export function ForgotForm() {
  const t = useT()
  const [state, submit, pending] = useForm(forgotPassword)
  if (state.ok) return <Note state={state} />
  return (
    <form onSubmit={submit} className="auth-form">
      <label className="field">
        {t.account.email}
        <input className="input" type="email" name="email" required autoComplete="email" />
      </label>
      <Human />
      <button className="btn" disabled={pending}>
        {t.account.sendReset}
      </button>
      <Note state={state} />
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const t = useT()
  const [state, submit, pending] = useForm(resetPassword)
  return (
    <form onSubmit={submit} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <label className="field">
        {t.account.newPassword}
        <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" />
        <span className="muted field-hint">{t.account.passwordHint}</span>
      </label>
      <button className="btn" disabled={pending}>
        {t.account.setPassword}
      </button>
      <Note state={state} />
    </form>
  )
}

export function ProfileForm({
  name,
  kindle,
  newsletter,
}: {
  name: string
  kindle: string
  newsletter: boolean
}) {
  const t = useT()
  const [state, submit, pending] = useForm(updateProfile)
  return (
    <form onSubmit={submit} className="auth-form">
      <label className="field">
        {t.account.name}
        <input className="input" name="name" defaultValue={name} maxLength={120} autoComplete="name" />
      </label>
      <label className="field">
        {t.account.kindle}
        <input className="input" type="email" name="kindle" defaultValue={kindle} placeholder={t.kindle.placeholder} />
      </label>
      <label className="check">
        <input type="checkbox" name="newsletter" defaultChecked={newsletter} />
        {t.account.wantNewsletter}
      </label>
      <button className="btn" disabled={pending}>
        {t.account.save}
      </button>
      <Note state={state} />
    </form>
  )
}

export function PasswordForm() {
  const t = useT()
  const [state, submit, pending] = useForm(changePassword)
  return (
    <form key={state.ok ? 'done' : 'form'} onSubmit={submit} className="auth-form">
      <label className="field">
        {t.account.currentPassword}
        <input className="input" type="password" name="current" required autoComplete="current-password" />
      </label>
      <label className="field">
        {t.account.newPassword}
        <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button className="btn ghost" disabled={pending}>
        {t.account.setPassword}
      </button>
      <Note state={state} />
    </form>
  )
}

export function LogoutButton() {
  const t = useT()
  const logout = async () => {
    await fetch('/api/users/logout', { method: 'POST' }).catch(() => {})
    document.cookie = 'nl-in=; path=/; max-age=0'
    // A full page load, so nothing from the account stays in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/')
  }
  return (
    <button type="button" className="btn ghost" onClick={logout}>
      {t.account.logout}
    </button>
  )
}

export function DeleteAccountForm() {
  const t = useT()
  const [state, submit, pending] = useForm(deleteAccount)
  return (
    <details className="account-delete">
      <summary>{t.account.deleteTitle}</summary>
      <form onSubmit={submit} className="auth-form">
        <p className="muted">{t.account.deleteWarning}</p>
        <label className="field">
          {t.account.deleteConfirm}
          <input className="input" type="email" name="confirm" required autoComplete="off" />
        </label>
        <button className="btn ghost" disabled={pending}>
          {t.account.deleteButton}
        </button>
        <Note state={state} />
      </form>
    </details>
  )
}

export function UnsubscribeForm({ email, token }: { email: string; token: string }) {
  const t = useT()
  const [state, submit, pending] = useForm(unsubscribe)
  if (state.ok) return <Note state={state} />
  return (
    <form onSubmit={submit} className="auth-form">
      <input type="hidden" name="e" value={email} />
      <input type="hidden" name="t" value={token} />
      <p>{email}</p>
      <button className="btn" disabled={pending}>
        {t.account.unsubscribeButton}
      </button>
      <Note state={state} />
    </form>
  )
}
