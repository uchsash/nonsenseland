'use client'

import { FieldLabel, useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'

import { PALETTE } from '@/utilities/palette'

const SWATCHES = [{ key: 'default', label: 'Default', hex: 'currentColor' }].concat(
  Object.entries(PALETTE).map(([key, { label, hex }]) => ({ key, label, hex })),
)

/** Colour choice shown as swatches from the logo palette. */
export const ColorPicker: SelectFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const current = value || 'default'
  return (
    <div className="field-type" style={{ marginBottom: 24 }}>
      <FieldLabel label={field.label} path={path} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} role="radiogroup">
        {SWATCHES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={current === s.key}
            onClick={() => setValue(s.key)}
            title={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              background: 'transparent',
              color: 'inherit',
              border: current === s.key ? '2px solid currentColor' : '1px solid rgba(128,128,128,.4)',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: s.hex,
                border: '1px solid rgba(128,128,128,.4)',
              }}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
