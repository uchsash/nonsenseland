import type { Book } from '@/payload-types'

export type EbookPrice = { free: true } | { free: false; price: number; was?: number }

/**
 * What a book costs to read on the site: free (also members-only, which only needs an
 * account), or the e-book price, with the sale price while a sale is running.
 * Null when the book isn't readable on the site or a paid book has no price yet.
 */
export function ebookPrice(book: Book, now = Date.now()): EbookPrice | null {
  if (!book.online?.enabled) return null
  if (book.online.access !== 'paid') return { free: true }
  const price = book.sale?.ebookPrice
  if (!price) return null
  const sale = book.sale?.ebookSalePrice
  const started = !book.sale?.saleStart || new Date(book.sale.saleStart).getTime() <= now
  const ended = Boolean(book.sale?.saleEnd) && new Date(book.sale!.saleEnd!).getTime() <= now
  return sale && sale < price && started && !ended ? { free: false, price: sale, was: price } : { free: false, price }
}
