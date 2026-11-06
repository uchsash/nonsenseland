/**
 * Default interface text (buttons, labels, messages). Every entry can be changed in the
 * admin under Settings → Interface text; an empty field there falls back to the text here.
 * Placeholders like {n} are filled in by the site (e.g. {n} = number of minutes).
 */
export const defaults = {
  nav: {
    videos: 'ভিডিও',
    articles: 'লেখা',
    books: 'বই',
    about: 'পরিচিতি',
    search: 'খুঁজুন',
    menu: 'মেনু',
    close: 'বন্ধ করুন',
    themeLight: 'আলো',
    themeDark: 'অন্ধকার',
    home: 'প্রথম পাতা',
  },
  common: {
    all: 'সব',
    seeAll: 'সব দেখুন',
    readMore: 'পড়ুন',
    minRead: '{n} মিনিটের পড়া',
    previous: 'আগেরটা',
    next: 'পরেরটা',
    back: 'ফিরে যান',
    empty: 'এখানে এখনো কিছু নেই।',
    topics: 'বিষয়',
  },
  video: {
    play: 'ভিডিও চালান',
    watchOnFacebook: 'ফেসবুকে দেখুন',
    watchOnYoutube: 'ইউটিউবে দেখুন',
    related: 'আরও ভিডিও',
  },
  article: {
    by: 'লিখেছেন',
    related: 'আরও লেখা',
    bookPromo: 'এই লেখা ভালো লাগলে পড়ে দেখতে পারেন',
  },
  book: {
    free: 'বিনামূল্যে পড়ুন',
    published: 'আমার প্রকাশিত বই',
    startReading: 'পড়া শুরু করুন',
    continueReading: 'যেখানে থেমেছিলেন',
    chapters: 'অধ্যায়সমূহ',
    chapter: 'অধ্যায়',
    download: 'EPUB ডাউনলোড',
    kindle: 'Kindle-এ পাঠান',
    buyFrom: 'কিনুন',
    writer: 'লেখক',
    translator: 'অনুবাদক',
    originalAuthor: 'মূল লেখক',
    publisher: 'প্রকাশক',
    pages: 'পৃষ্ঠা',
    contents: 'সূচিপত্র',
    finished: 'বইটি শেষ। পড়ার জন্য ধন্যবাদ!',
    backToBook: 'বইয়ের পাতায় ফিরুন',
    locked: 'এই অধ্যায়টি এখনো উন্মুক্ত নয়।',
    notes: 'টীকা',
    filterOriginal: 'মৌলিক',
    filterTranslation: 'অনুবাদ',
    filterFiction: 'ফিকশন',
    filterNonfiction: 'নন-ফিকশন',
    filterEmpty: 'এই ধরনের বই এখনো নেই।',
    backToText: 'লেখায় ফিরুন',
  },
  kindle: {
    title: 'Kindle-এ পাঠান',
    intro: 'আপনার Kindle-এর ইমেইল ঠিকানা লিখুন (…@kindle.com)।',
    step:
      'প্রথমবার পাঠানোর আগে Amazon-এ গিয়ে “Approved Personal Document E-mail List”-এ এই ঠিকানাটি যোগ করুন:',
    help: 'কীভাবে করবেন?',
    placeholder: 'yourname@kindle.com',
    send: 'পাঠান',
    sending: 'পাঠানো হচ্ছে…',
    sent: 'পাঠানো হয়েছে! কয়েক মিনিটের মধ্যে Kindle-এ বইটি চলে আসবে।',
    invalid: 'সঠিক Kindle ঠিকানা দিন (…@kindle.com)।',
    limited: 'অনেকবার চেষ্টা করা হয়েছে। এক ঘণ্টা পর আবার চেষ্টা করুন।',
    failed: 'পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।',
    notConfigured: 'Kindle-এ পাঠানো এখনো চালু হয়নি।',
  },
  reader: {
    settings: 'পড়ার সেটিংস',
    theme: 'পটভূমি',
    themes: { light: 'সাদা', sepia: 'সেপিয়া', dark: 'কালো' },
    font: 'হরফ',
    fonts: { serif: 'সেরিফ', sans: 'সাধারণ' },
    size: 'অক্ষরের আকার',
    spacing: 'লাইনের ফাঁক',
    spacings: { tight: 'কম', normal: 'মাঝারি', loose: 'বেশি' },
    width: 'পাতার চওড়া',
    widths: { narrow: 'সরু', normal: 'মাঝারি', wide: 'চওড়া' },
    paragraph: 'অনুচ্ছেদ',
    paragraphs: { gap: 'ফাঁক রেখে', indent: 'ইনডেন্ট' },
    align: 'লেখা সাজানো',
    aligns: { justify: 'দুই পাশ সমান', left: 'বাম দিকে' },
    smaller: 'ছোট',
    larger: 'বড়',
    reset: 'আগের মতো',
  },
  share: {
    title: 'শেয়ার করুন',
    copy: 'লিংক কপি',
    copied: 'কপি হয়েছে',
  },
  search: {
    title: 'খুঁজুন',
    placeholder: 'লেখা, ভিডিও বা বই খুঁজুন…',
    results: '{n}টি ফলাফল',
    none: 'কিছু পাওয়া যায়নি।',
  },
  newsletter: {
    placeholder: 'আপনার ইমেইল',
    button: 'যুক্ত হোন',
    done: 'ধন্যবাদ! আপনি যুক্ত হয়েছেন।',
    already: 'এই ইমেইল আগেই যুক্ত আছে।',
    invalid: 'সঠিক ইমেইল দিন।',
  },
  contact: {
    name: 'নাম',
    email: 'ইমেইল',
    message: 'বার্তা',
    send: 'পাঠান',
    done: 'বার্তা পৌঁছেছে। ধন্যবাদ!',
    failed: 'পাঠানো যায়নি। আবার চেষ্টা করুন।',
  },
  ad: { label: 'বিজ্ঞাপন' },
  notFound: {
    title: 'পাতাটি খুঁজে পাওয়া যায়নি',
    text: 'হয়তো ঠিকানা বদলেছে, অথবা পাতাটি আর নেই।',
    home: 'প্রথম পাতায় ফিরুন',
  },
}

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }
export type UiText = Widen<typeof defaults>

/** Fills placeholders: fill('{n} মিনিটের পড়া', { n: '৫' }) → '৫ মিনিটের পড়া' */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)

/** Saved admin texts on top of the defaults; empty fields keep the default. */
export function mergeUiText<T extends Record<string, unknown>>(base: T, saved: unknown): T {
  const out: Record<string, unknown> = {}
  const source = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>
  for (const [key, value] of Object.entries(base)) {
    const custom = source[key]
    if (typeof value === 'string') {
      out[key] = typeof custom === 'string' && custom.trim() ? custom.trim() : value
    } else {
      out[key] = mergeUiText(value as Record<string, unknown>, custom)
    }
  }
  return out as T
}
