'use client'

import { FieldLabel, useConfig, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'

type Section = { id?: string; blockType: string; title?: string; enabled?: boolean }

const TYPE_LABELS: Record<string, string> = {
  intro: 'Intro',
  videos: 'Video slider',
  articles: 'Article slider',
  library: 'Free books row',
  published: 'My published books',
  ad: 'Ad slot',
  newsletter: 'Newsletter sign-up',
}

/** Dropdown of the current homepage sections; stores the chosen section's id. */
export const SectionSelect: TextFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const { config } = useConfig()
  const [sections, setSections] = useState<Section[] | null>(null)

  useEffect(() => {
    fetch(`${config.serverURL}${config.routes.api}/globals/homepage?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => setSections((doc?.sections ?? []).filter((s: Section) => s.id && s.blockType !== 'intro')))
      .catch(() => setSections([]))
  }, [config.serverURL, config.routes.api])

  return (
    <div className="field-type" style={{ flex: 1 }}>
      <FieldLabel label={field.label || 'Goes to'} path={path} />
      <select
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value || null)}
        style={{ width: '100%', minHeight: 40, padding: '0 10px', borderRadius: 4 }}
      >
        <option value="">— choose a homepage section —</option>
        {(sections ?? []).map((s, i) => (
          <option key={s.id} value={s.id}>
            {i + 1}. {TYPE_LABELS[s.blockType] ?? s.blockType}
            {s.title ? `: ${s.title}` : ''}
            {s.enabled === false ? ' (switched off)' : ''}
          </option>
        ))}
      </select>
      {sections && !sections.length ? (
        <p style={{ fontSize: 13, opacity: 0.7 }}>Add sections under Settings → Homepage first.</p>
      ) : null}
    </div>
  )
}
