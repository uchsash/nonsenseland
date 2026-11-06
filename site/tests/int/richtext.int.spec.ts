import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RichText } from '@/components/RichText'

const doc = (children: unknown[]) =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children } }) as never

describe('rich text on the site', () => {
  it('shows logo-coloured text from the editor', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        data: doc([
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', version: 1, text: 'কমলা লেখা', format: 0, $: { color: 'orange' } }],
          },
        ]),
      }),
    )
    expect(html).toContain('<span class="tc-orange">কমলা লেখা</span>')
  })

  it('shows “Lines without gaps” as one paragraph with line breaks', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        data: doc([
          {
            type: 'block',
            version: 2,
            fields: { blockType: 'lines', text: 'উচ্ছ্বাস তৌসিফ\nমিরপুর, ঢাকা', align: 'right' },
          },
        ]),
      }),
    )
    expect(html).toContain('<p class="lines" style="text-align:right">')
    expect(html).toContain('উচ্ছ্বাস তৌসিফ<br/>')
    expect(html).toContain('মিরপুর, ঢাকা')
  })
})
