import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { payloadClient } from '@/lib/data'

/** Lets a logged-in admin/editor see drafts on the real site. ?exit leaves preview. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? '/'
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/'

  if (url.searchParams.has('exit')) {
    ;(await draftMode()).disable()
    redirect(safePath)
  }

  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const role = (user as { role?: string } | null)?.role
  if (role !== 'admin' && role !== 'editor') return new Response('Please log in to the admin panel first.', { status: 401 })

  ;(await draftMode()).enable()
  redirect(safePath)
}
