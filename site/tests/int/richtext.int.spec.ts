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

const para = (text: string, extra: Record<string, unknown> = {}) => ({
  type: 'paragraph',
  version: 1,
  children: text ? [{ type: 'text', version: 1, text, format: 0 }] : [],
  ...extra,
})

describe('paragraphs, empty lines and footnotes', () => {
  it('turns any number of empty lines into one fixed gap', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, { data: doc([para('এক'), para(''), para(''), para('দুই')]) }),
    )
    expect(html.match(/class="gap"/g)).toHaveLength(2) // CSS hides the second of two adjacent gaps
    expect(html).toContain('<p>এক</p><div class="gap" aria-hidden="true"></div>')
  })

  it('applies ¶ settings and editor alignment', () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        data: doc([
          para('ঘন', { $: { space: 'none' } }),
          para('ফাঁক', { $: { space: 'more', noIndent: true } }),
          para('মাঝে', { format: 'center' }),
        ]),
      }),
    )
    expect(html).toContain('<p class="sp-none">ঘন</p>')
    expect(html).toContain('<p class="sp-more no-indent">ফাঁক</p>')
    expect(html).toContain('<p class="al-center no-indent"') // Payload also adds style="text-align:center"
  })

  it('renders footnotes with Bangla numbers', () => {
    const footnote = (word: string, note: string) => ({
      type: 'link',
      version: 3,
      fields: { linkType: 'footnote', note, url: '' },
      children: [{ type: 'text', version: 1, text: word, format: 0 }],
    })
    const html = renderToStaticMarkup(
      createElement(RichText, {
        data: doc([
          {
            type: 'paragraph',
            version: 1,
            children: [
              footnote('জ্বিন', 'অশরীরী'),
              { type: 'text', version: 1, text: ' আর ', format: 0 },
              footnote('কায়রো', 'শহর'),
            ],
          },
        ]),
      }),
    )
    expect(html).toContain('জ্বিন<sup>১</sup>')
    expect(html).toContain('কায়রো<sup>২</sup>')
    expect(html).toContain('id="fnref-2"')
    expect(html).not.toContain('<a') // footnotes are buttons, not links
  })
})
