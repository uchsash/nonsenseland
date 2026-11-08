type Attachment = { filename: string; content: Buffer }

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

/** Sends an email through Resend. Returns false (and logs) when email is not configured yet. */
export async function sendEmail({
  to,
  subject,
  text,
  attachments = [],
  from = process.env.EMAIL_FROM,
}: {
  to: string
  subject: string
  text: string
  attachments?: Attachment[]
  from?: string
}) {
  if (!process.env.RESEND_API_KEY || !from) {
    console.info(`[email not configured] would send "${subject}" to ${to}`)
    if (process.env.NODE_ENV !== 'production') console.info(text)
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
    }),
  })
  if (!res.ok) throw new Error(`Email failed: ${res.status} ${await res.text()}`)
  return true
}
