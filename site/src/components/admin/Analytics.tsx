import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { AdminViewServerProps, Payload, Where } from 'payload'

/**
 * Admin → Analytics. Visitors come from Cloudflare Web Analytics (free, no cookies, so no
 * consent banner); readers, subscribers and reading come from the site's own database.
 * Visitor numbers need CF_ACCOUNT_ID, CF_WEB_ANALYTICS_SITE_TAG and the secret
 * CF_ANALYTICS_TOKEN (Account Analytics: Read); without them that part shows how to set it up.
 */
const RANGES = [7, 30, 90] as const

type Row = { label: string; value: number }
type Visitors =
  | { ok: true; views: number; visits: number; days: Row[]; pages: Row[]; referrers: Row[]; countries: Row[]; devices: Row[] }
  | { ok: false; reason: 'setup' | 'error'; message?: string }

async function cloudflareVisitors(days: number): Promise<Visitors> {
  const account = process.env.CF_ACCOUNT_ID
  const site = process.env.CF_WEB_ANALYTICS_SITE_TAG
  const token = process.env.CF_ANALYTICS_TOKEN
  if (!account || !site || !token) return { ok: false, reason: 'setup' }
  const to = new Date()
  const from = new Date(to.getTime() - days * 86400_000)
  const group = (name: string, dimension: string | null, extra = '') =>
    `${name}: rumPageloadEventsAdaptiveGroups(limit: ${dimension ? 100 : 1}, filter: $f${extra}) { count sum { visits } ${
      dimension ? `dimensions { ${dimension} }` : ''
    } }`
  const query = `query ($account: String!, $f: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
    viewer { accounts(filter: { accountTag: $account }) {
      ${group('total', null)}
      ${group('days', 'date', ', orderBy: [date_ASC]')}
      ${group('pages', 'requestPath', ', orderBy: [count_DESC]')}
      ${group('referrers', 'refererHost', ', orderBy: [count_DESC]')}
      ${group('countries', 'countryName', ', orderBy: [count_DESC]')}
      ${group('devices', 'deviceType', ', orderBy: [count_DESC]')}
    } }
  }`
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          account,
          f: { siteTag: site, datetime_geq: from.toISOString(), datetime_leq: to.toISOString(), bot: 0 },
        },
      }),
      cache: 'no-store',
    })
    const json = (await res.json()) as {
      data?: { viewer: { accounts: Record<string, { count: number; sum: { visits: number }; dimensions?: Record<string, string> }[]>[] } }
      errors?: { message: string }[]
    }
    const data = json.data?.viewer.accounts[0]
    if (!data) return { ok: false, reason: 'error', message: json.errors?.map((e) => e.message).join('; ') ?? `HTTP ${res.status}` }
    const rows = (key: string, dimension: string, top = 10): Row[] =>
      (data[key] ?? [])
        .map((r) => ({ label: r.dimensions?.[dimension] || '(direct)', value: r.count }))
        .slice(0, top)
    return {
      ok: true,
      views: data.total?.[0]?.count ?? 0,
      visits: data.total?.[0]?.sum.visits ?? 0,
      days: rows('days', 'date', 100),
      pages: rows('pages', 'requestPath', 15),
      referrers: rows('referrers', 'refererHost'),
      countries: rows('countries', 'countryName'),
      devices: rows('devices', 'deviceType'),
    }
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

/** The site's own numbers: readers, subscribers, reading, likes. */
async function siteNumbers(payload: Payload, days: number) {
  const since = new Date(Date.now() - days * 86400_000).toISOString()
  const recent: Where = { createdAt: { greater_than: since } }
  const count = (collection: Parameters<Payload['count']>[0]['collection'], where?: Where) =>
    payload.count({ collection, where, overrideAccess: true }).then((r) => r.totalDocs)
  const readerWhere: Where = { role: { equals: 'reader' } }
  const [readers, newReaders, subscribers, newSubscribers, messages, kindle, progress, likes] = await Promise.all([
    count('users', readerWhere),
    count('users', { and: [readerWhere, recent] }),
    count('subscribers', { unsubscribedAt: { exists: false } }),
    count('subscribers', { and: [{ unsubscribedAt: { exists: false } }, recent] }),
    count('messages', recent),
    count('kindle-sends', { and: [{ status: { equals: 'sent' } }, recent] }),
    payload.find({ collection: 'reading-progress', limit: 5000, depth: 1, overrideAccess: true, select: { book: true } }),
    payload.find({ collection: 'likes', where: recent, limit: 5000, depth: 1, overrideAccess: true, select: { alap: true } }),
  ])
  const tally = (names: (string | undefined)[]): Row[] => {
    const map = new Map<string, number>()
    for (const n of names) if (n) map.set(n, (map.get(n) ?? 0) + 1)
    return [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }
  const titleOf = (v: unknown) => (v && typeof v === 'object' ? ((v as { title?: string }).title ?? undefined) : undefined)
  return {
    readers,
    newReaders,
    subscribers,
    newSubscribers,
    messages,
    kindle,
    books: tally(progress.docs.map((d) => titleOf(d.book))),
    liked: tally(likes.docs.map((d) => titleOf(d.alap))),
  }
}

const bn = (n: number) => n.toLocaleString('bn-BD')

const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  padding: '16px 18px',
  background: 'var(--theme-elevation-0)',
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{bn(value)}</div>
      {note ? <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 2 }}>{note}</div> : null}
    </div>
  )
}

function Bars({ title, rows, empty = 'Nothing yet.' }: { title: string; rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div style={card}>
      <h4 style={{ margin: '0 0 12px' }}>{title}</h4>
      {rows.length === 0 ? <p style={{ margin: 0, color: 'var(--theme-elevation-500)' }}>{empty}</p> : null}
      {rows.map((r) => (
        <div key={r.label} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ color: 'var(--theme-elevation-600)' }}>{bn(r.value)}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--theme-elevation-100)', marginTop: 3 }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', borderRadius: 2, background: '#f15a24' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Page views per day as small columns. */
function Daily({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div style={card}>
      <h4 style={{ margin: '0 0 12px' }}>Page views per day</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            title={`${r.label}: ${r.value}`}
            style={{ flex: 1, minWidth: 2, height: `${Math.max(2, (r.value / max) * 100)}%`, background: '#f15a24', borderRadius: '2px 2px 0 0' }}
          />
        ))}
      </div>
    </div>
  )
}

const grid = (min: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
  gap: 16,
  marginBottom: 24,
})

export async function AnalyticsView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  const user = req.user
  const staff = user && (user as { role?: string }).role !== 'reader'
  const asked = Number((searchParams?.days as string) ?? 30)
  const days = (RANGES as readonly number[]).includes(asked) ? asked : 30
  const [visitors, site] = staff ? await Promise.all([cloudflareVisitors(days), siteNumbers(req.payload, days)]) : [null, null]

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: '24px 0' }}>
          <h1 style={{ margin: 0 }}>Analytics</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {RANGES.map((d) => (
              <Link
                key={d}
                href={`?days=${d}`}
                className={`btn btn--size-small ${d === days ? 'btn--style-primary' : 'btn--style-secondary'}`}
                style={{ margin: 0 }}
              >
                {d} days
              </Link>
            ))}
          </div>
        </div>

        {!staff || !site ? (
          <p>Only staff can see this page.</p>
        ) : (
          <>
            <h3>Visitors</h3>
            {visitors?.ok ? (
              <>
                <div style={grid(180)}>
                  <Stat label="Page views" value={visitors.views} />
                  <Stat label="Visits" value={visitors.visits} note="A visit is one sitting; bots excluded." />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <Daily rows={visitors.days} />
                </div>
                <div style={grid(300)}>
                  <Bars title="Most read pages" rows={visitors.pages} />
                  <Bars title="Where visitors came from" rows={visitors.referrers} />
                  <Bars title="Countries" rows={visitors.countries} />
                  <Bars title="Devices" rows={visitors.devices} />
                </div>
              </>
            ) : (
              <div style={{ ...card, marginBottom: 24 }}>
                {visitors?.reason === 'error' ? (
                  <p style={{ margin: 0 }}>Cloudflare did not answer: {visitors.message}</p>
                ) : (
                  <p style={{ margin: 0 }}>
                    Visitor numbers appear here once Cloudflare Web Analytics is connected (see decision.md →
                    Analytics).
                  </p>
                )}
              </div>
            )}

            <h3>Readers</h3>
            <div style={grid(180)}>
              <Stat label="Reader accounts" value={site.readers} note={`${bn(site.newReaders)} new in ${bn(days)} days`} />
              <Stat label="Newsletter subscribers" value={site.subscribers} note={`${bn(site.newSubscribers)} new in ${bn(days)} days`} />
              <Stat label="Messages" value={site.messages} note={`in ${bn(days)} days`} />
              <Stat label="Sent to Kindle" value={site.kindle} note={`in ${bn(days)} days`} />
            </div>
            <div style={grid(300)}>
              <Bars title="Books being read (readers with a saved place)" rows={site.books} />
              <Bars title={`Most liked খুচরো আলাপ (${days} days)`} rows={site.liked} />
            </div>
          </>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}

/** The link in the admin's side menu. */
export function AnalyticsNavLink() {
  return (
    <Link href="/admin/analytics" className="nav__link" style={{ margin: '12px 0' }}>
      <span className="nav__link-label">Analytics</span>
    </Link>
  )
}
