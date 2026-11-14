import { DOMParser, parseHTML } from 'linkedom'

/**
 * A small stand-in for jsdom's JSDOM class, built on linkedom. jsdom is too heavy for
 * Cloudflare Workers; linkedom runs there and in Node, so the book import works in both.
 * Covers what the importer and Payload's HTML → editor converter use: `.window.document`.
 */
export class JSDOM {
  window: { document: Document }
  constructor(markup: string, options?: { contentType?: string }) {
    if (options?.contentType?.includes('xml')) {
      const document = new DOMParser().parseFromString(markup, 'text/xml') as unknown as Document
      this.window = { document }
      return
    }
    // linkedom needs a whole document; chapter HTML is often just the body's contents.
    const html = /<html[\s>]/i.test(markup)
      ? markup
      : /^\s*<body[\s>]/i.test(markup)
        ? `<!doctype html><html><head></head>${markup}</html>`
        : `<!doctype html><html><head></head><body>${markup}</body></html>`
    const { document } = parseHTML(html) as unknown as { document: Document }
    this.window = { document }
  }
}
