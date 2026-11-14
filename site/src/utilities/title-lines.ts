/**
 * Splits a title into the three lines of a title card when the admin left them empty:
 * anything after “—”, “–” or “:” becomes the small line; a long main part is broken in two,
 * the first half going orange. Used by the server (sharp) and the browser (canvas) versions.
 */
export function splitTitle(title: string): { highlight: string; line2: string; subline: string } {
  const [main, ...rest] = title.split(/\s+[—–-]\s+|\s*[:।|]\s+|\n/)
  const subline = rest.join(' ').trim()
  const words = main.trim().split(/\s+/)
  if (main.length <= 16 || words.length < 2) return { highlight: main.trim(), line2: '', subline }
  let cut = 1
  while (cut < words.length - 1 && words.slice(0, cut + 1).join(' ').length <= main.length / 2) cut++
  return { highlight: words.slice(0, cut).join(' '), line2: words.slice(cut).join(' '), subline }
}
