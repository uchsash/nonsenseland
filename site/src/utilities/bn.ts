const DIGITS = '০১২৩৪৫৬৭৮৯'

/** 12 → ১২ */
export const bnNumber = (value: number | string) => String(value).replace(/\d/g, (d) => DIGITS[Number(d)])

/** “৬ নভেম্বর ২০২৬” */
export const bnDate = (value?: string | null) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}
