'use server'

import { redirect } from 'next/navigation'

import { getT } from '@/i18n/server'
import { currentUser, safeNext, setLoginCookies } from '@/lib/account'
import { payloadClient } from '@/lib/data'
import { sendEmail } from '@/lib/email'
import { validUnsubscribe } from '@/lib/newsletter'
import { verifyHuman } from '@/lib/visitor'

import type { FormState } from '../actions'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KINDLE = /^[^\s@]+@(free\.)?kindle\.(com|cn)$/i
const MIN_PASSWORD = 8
const siteUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
const human = (form: FormData) => verifyHuman(form.get('cf-turnstile-response'))

async function subscribeEmail(email: string) {
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, depth: 0 })
  if (!docs.length) await payload.create({ collection: 'subscribers', data: { email } })
  else if (docs[0].unsubscribedAt) {
    await payload.update({ collection: 'subscribers', id: docs[0].id, data: { unsubscribedAt: null } })
  }
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  if (!(await human(form))) return { ok: false, message: t.contact.failed }
  const payload = await payloadClient()
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email: text(form, 'email').toLowerCase(), password: String(form.get('password') ?? '') },
    })
    if (!result.token) return { ok: false, message: t.account.loginFailed }
    await setLoginCookies(payload, result.token, result.exp)
  } catch {
    return { ok: false, message: t.account.loginFailed }
  }
  redirect(safeNext(form.get('next')))
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const name = text(form, 'name').slice(0, 120)
  const email = text(form, 'email').toLowerCase()
  const password = String(form.get('password') ?? '')
  if (!name || !EMAIL.test(email)) return { ok: false, message: t.account.invalid }
  if (password.length < MIN_PASSWORD) return { ok: false, message: t.account.shortPassword }
  if (!(await human(form))) return { ok: false, message: t.contact.failed }

  const payload = await payloadClient()
  const taken = await payload.count({ collection: 'users', where: { email: { equals: email } } })
  if (taken.totalDocs) return { ok: false, message: t.account.emailTaken }
  try {
    await payload.create({
      collection: 'users',
      data: { name, email, password, role: 'reader' },
      context: { readerSignup: true },
    })
    const result = await payload.login({ collection: 'users', data: { email, password } })
    if (result.token) await setLoginCookies(payload, result.token, result.exp)
    if (form.get('newsletter')) await subscribeEmail(email)
  } catch (err) {
    payload.logger.error({ err }, 'Sign-up failed')
    return { ok: false, message: t.account.signupFailed }
  }
  redirect(safeNext(form.get('next')))
}

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const email = text(form, 'email').toLowerCase()
  if (!EMAIL.test(email)) return { ok: false, message: t.account.invalid }
  if (!(await human(form))) return { ok: false, message: t.contact.failed }
  const payload = await payloadClient()
  const token = await payload
    .forgotPassword({ collection: 'users', data: { email }, disableEmail: true })
    .catch(() => null)
  if (token) {
    await sendEmail({
      to: email,
      subject: t.account.resetSubject,
      text: `${t.account.resetBody}\n\n${siteUrl()}/reset-password?token=${token}`,
    }).catch((err) => payload.logger.error({ err }, 'Password email failed'))
  }
  // The same answer either way, so nobody can test which addresses have accounts.
  return { ok: true, message: t.account.resetSent }
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const password = String(form.get('password') ?? '')
  if (password.length < MIN_PASSWORD) return { ok: false, message: t.account.shortPassword }
  const payload = await payloadClient()
  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token: text(form, 'token'), password },
      overrideAccess: true,
    })
    // The reset link reached their inbox, so the address is proven.
    await payload.update({
      collection: 'users',
      id: result.user.id as number,
      data: { emailVerified: true },
      context: { keepVerified: true },
    })
    if (result.token) await setLoginCookies(payload, result.token)
  } catch {
    return { ok: false, message: t.account.resetExpired }
  }
  redirect('/account')
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const user = await currentUser()
  if (!user) return { ok: false, message: t.account.loginFailed }
  const name = text(form, 'name').slice(0, 120)
  const kindleEmail = text(form, 'kindle')
  if (kindleEmail && !KINDLE.test(kindleEmail)) return { ok: false, message: t.kindle.invalid }
  const payload = await payloadClient()
  await payload.update({ collection: 'users', id: user.id, data: { name, kindleEmail: kindleEmail || null } })
  if (form.get('newsletter')) await subscribeEmail(user.email)
  else {
    const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: user.email } }, limit: 1, depth: 0 })
    if (docs[0] && !docs[0].unsubscribedAt) {
      await payload.update({ collection: 'subscribers', id: docs[0].id, data: { unsubscribedAt: new Date().toISOString() } })
    }
  }
  return { ok: true, message: t.account.saved }
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const user = await currentUser()
  if (!user) return { ok: false, message: t.account.loginFailed }
  const password = String(form.get('password') ?? '')
  if (password.length < MIN_PASSWORD) return { ok: false, message: t.account.shortPassword }
  const payload = await payloadClient()
  try {
    await payload.login({ collection: 'users', data: { email: user.email, password: String(form.get('current') ?? '') } })
  } catch {
    return { ok: false, message: t.account.wrongPassword }
  }
  await payload.update({ collection: 'users', id: user.id, data: { password } })
  return { ok: true, message: t.account.saved }
}

export async function unsubscribe(_: FormState, form: FormData): Promise<FormState> {
  const t = await getT()
  const email = text(form, 'e').toLowerCase()
  if (!validUnsubscribe(email, text(form, 't'))) return { ok: false, message: t.account.badLink }
  const payload = await payloadClient()
  const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1, depth: 0 })
  if (docs[0]) {
    await payload.update({ collection: 'subscribers', id: docs[0].id, data: { unsubscribedAt: new Date().toISOString() } })
  }
  return { ok: true, message: t.account.unsubscribed }
}
