export type Platform = 'facebook' | 'youtube'

export const detectPlatform = (url: string): Platform | undefined => {
  if (/(?:youtube\.com|youtu\.be)\//i.test(url)) return 'youtube'
  if (/(?:facebook\.com|fb\.watch)\//i.test(url)) return 'facebook'
  return undefined
}

export const youtubeId = (url: string) =>
  url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/)?.[1]

/** Player URL for an iframe. Only requested after the visitor presses play. */
export const embedUrl = (url: string): string | undefined => {
  const platform = detectPlatform(url)
  if (platform === 'youtube') {
    const id = youtubeId(url)
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : undefined
  }
  if (platform === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`
  }
  return undefined
}
