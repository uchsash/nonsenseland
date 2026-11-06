import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { defaults, mergeUiText, type UiText } from './bn'

/** Interface text for server components: admin texts merged over the defaults. */
export const getT = cache(async (): Promise<UiText> => {
  const payload = await getPayload({ config })
  const saved = await payload.findGlobal({ slug: 'interface-text', depth: 0 }).catch(() => null)
  return mergeUiText(defaults, saved)
})
