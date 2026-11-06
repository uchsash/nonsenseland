import { LogoLoader } from '@/components/LogoLoader'
import { getT } from '@/i18n/server'

/** Shown while a page loads (the header and footer stay in place). */
export default async function Loading() {
  const t = await getT()
  return <LogoLoader label={t.common.loading} />
}
