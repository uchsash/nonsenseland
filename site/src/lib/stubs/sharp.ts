/**
 * Stand-in for `sharp` in the Cloudflare build: sharp is a native library and cannot run on
 * Workers. Image sizes are made by Cloudflare Images there, and title cards in the browser.
 */
const sharp = (() => {
  throw new Error('sharp is not available on Cloudflare Workers')
}) as unknown as typeof import('sharp')
export default sharp
export type OverlayOptions = import('sharp').OverlayOptions
