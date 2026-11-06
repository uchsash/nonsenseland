import { createHash } from 'crypto'
import { headers } from 'next/headers'

/** A salted hash of the visitor's IP: enough for rate limits, never stores the IP itself. */
export async function visitorHash() {
  const h = await headers()
  const ip = h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  return createHash('sha256')
    .update(`${process.env.PAYLOAD_SECRET}:${ip}`)
    .digest('hex')
    .slice(0, 32)
}

/** Cloudflare Turnstile check. Skipped until keys are configured (development). */
export async function verifyHuman(token: FormDataEntryValue | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== 'string' || !token) return false
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = (await res.json()) as { success?: boolean }
  return Boolean(data.success)
}
