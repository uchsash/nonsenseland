import { describe, expect, it } from 'vitest'

import { bnNumber } from '@/utilities/bn'
import { lexicalToText, readingMinutes } from '@/utilities/lexical'
import { slugify } from '@/utilities/slug'
import { detectPlatform, embedUrl } from '@/utilities/video'

describe('video links', () => {
  it('detects Facebook and YouTube', () => {
    expect(detectPlatform('https://www.facebook.com/nonsenseAtoZ/videos/123')).toBe('facebook')
    expect(detectPlatform('https://fb.watch/abc/')).toBe('facebook')
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
    expect(detectPlatform('https://example.com/video')).toBeUndefined()
  })
  it('builds privacy-friendly embeds', () => {
    expect(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(embedUrl('https://www.facebook.com/x/videos/1')).toContain('facebook.com/plugins/video.php?href=')
  })
})

describe('text helpers', () => {
  it('makes English slugs', () => expect(slugify('  Six Easy Pieces! ')).toBe('six-easy-pieces'))
  it('converts digits to Bangla', () => expect(bnNumber('12:40')).toBe('১২:৪০'))
  it('reads plain text and reading time from rich text', () => {
    const value = { root: { children: [{ children: [{ text: 'এক দুই তিন' }] }] } }
    expect(lexicalToText(value)).toBe('এক দুই তিন')
    expect(readingMinutes(value)).toBe(1)
  })
})
