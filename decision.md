# Nonsenseland Website: Decisions

Last updated: 2026-11-08

This file records what has been decided, what is still open, and what is needed from the owner.

## Status (2026-11-06)

**Phase 1 is built and running locally** (code in `site/`, how to run it in `site/README.md`).
Everything below works and was tested in the browser:
- homepage sections (from the admin), video slider with filters, article slider, free books, published books, ads, newsletter
- video pages (the Facebook/YouTube player loads only after pressing play)
- the reader for articles and books: white/sepia/dark, 2 fonts, size, line spacing, width, progress bar, chapter list, ← → keys, remembers the place, “যেখানে থেমেছিলেন” button
- EPUB and Word import to chapters, with warnings for missing Heading 1 and Bijoy text
- EPUB download; Send to Kindle (switches on once email is set up)
- paid/members chapter locking (tested: sample chapters open, the rest locked, no text leaks)
- search (Bangla), topics, About page with contact form, sitemap, robots, draft preview
- phone layout, dark mode, admin panel

**Phase 2 is built (2026-11-08), running locally:**
- reader accounts: email + password, Google, forgot/reset password, `/account` page
- reading place shared across devices; the newer of browser and server wins
- bookmarks on articles, books and chapters
- likes on খুচরো আলাপ (signed-in readers; totals visible to everyone)
- saved Kindle address, filled in automatically
- newsletter written in the admin (test copy, then send to all), with one-click unsubscribe
- readers can delete their own account (confirmed by typing their email); swipe between chapters; Messenger share on phones

Needs from the owner before these work live: **Google sign-in** needs a Google Cloud OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect `https://nonsenseland.com/auth/google/callback`); until then the button is hidden. **Password-reset emails and newsletters** need Resend (free plan: 100 emails/day, 3,000/month, so a list above 100 subscribers needs a paid plan or sending over several days).

Security decisions: staff accounts can never sign in through Google. A Google sign-in on an address never proven by email replaces that account's password, so someone who registered another person's address loses access. Email verification at sign-up is not required (a reader can read at once).

**Security checks on GitHub (2026-11-08):** Dependabot alerts and security updates, secret scanning and CodeQL are on. Remaining package warnings come from inside Payload (happy-dom via its rich-text package, drizzle-kit, deepmerge); they need a Payload update, not a forced fix.

**Left for launch (phase 1):**
1. Real content: replace the **নমুনা** (sample) videos, articles and placeholder covers; upload the two EPUBs.
2. Owner reviews all Bangla interface text (`site/src/i18n/bn.ts`) and the About page.
3. Deployment to Cloudflare. Needs from the owner: domain, Cloudflare account, Neon (database) account, Resend (email) account. Then: R2 storage, Turnstile keys, email DNS records (SPF/DKIM), a cron trigger for scheduled publishing, backups, uptime alert.
4. Privacy Policy and Terms pages (draft to be written, owner approves).

**Database and live setup (decided 2026-11-12):**
1. **Neon Postgres, Free plan** (Singapore, Postgres 17), connected through Cloudflare **Hyperdrive**. Postgres chosen over Cloudflare D1/SQLite for the long run: concurrent writes (sales, likes), richer features, and a standard export to move anywhere. The connection details are in `site/.env.production.local` (never committed).
2. **Cloudflare caches every public page**, refreshed when something is published, so visitors rarely wake the database. After 5 idle minutes Neon sleeps; the next database request waits about half a second.
3. **Scheduled tasks run hourly**, not every minute (every minute would keep Neon awake all month and use up the free 100 compute-hours). Scheduled posts go live within the hour; **newsletters start sending as soon as you press send**, and the hourly run only finishes anything left over.
4. **Watch Neon → Usage weekly in the first month.** Above about 80 compute-hours a month, upgrade to the Launch plan (pay as you go, no minimum; about $5–19 a month at expected traffic).
5. **Our own daily database backup to R2**, in addition to Neon's built-in recovery.
6. To check on the test site: whether Hyperdrive's open connections stop Neon from sleeping.

**Email:** Resend, domain nonsenseland.com (Tokyo region), records added through Cloudflare. Add DMARC (`_dmarc` TXT `v=DMARC1; p=none;`) for better delivery.

**Hosting stays Cloudflare Workers at $5/month (decided 2026-11-06).** The `sharp` image library used locally does not run on Workers, so at deployment: (1) automatic title-card thumbnails are drawn in the admin's browser when a video is saved, then uploaded; (2) image sizes come from Cloudflare Image Resizing (free allowance of 5,000 unique images/month); (3) YouTube thumbnails are fetched by the server as now. No extra hosting cost. Free servers were rejected: Oracle Always Free reclaims idle machines, Render free sleeps (~50 s first load), Vercel Hobby forbids commercial use.

**Article headers from the template (2026-11-07).** Articles (ফিচার and other লেখা) get their header made on save: the uploaded photo in a rounded white frame with an orange frame behind, the category, the three text lines and the icon (without a photo: the video-style card with the caricature). A finished header uploaded by hand always wins. Replaced automatic images are removed only when neither the published nor the latest draft version uses them.

**Design templates (2026-11-06).** Video title card: cream background, a short orange dash with the category, the headline big in orange, a dark second line, a small muted line, the icon bottom-left, and the caricature on its orange waves (cut from the Facebook cover) on the right; the lines can be set per video under "Title card text", otherwise the title is split by itself. Book card in খুচরো আলাপ: a poster template (book standing on the brand's orange waves, small outlined circles, "— নতুন বই", the icon) in three colourways chosen per card: orange, dark, cream.

**Automatic video thumbnails:** a video saved without a thumbnail gets YouTube's own thumbnail (YouTube links) or a title card (see Design templates; caricature scene `site/src/assets/caricature-scene.png`, taken from the Facebook cover). An uploaded thumbnail always wins. Facebook's own video frames need the Facebook Graph API (Page token) — not set up yet.

**Code repository:** https://github.com/uchsash/nonsenseland (public). Not in git: `.env` (secrets), uploaded images and book files, `free-books/`, licensed fonts.

**Quality checks (all passing):** ESLint (0 problems), TypeScript, production build, and 42 automated tests (`npm run test:int`), including access-rule tests: visitors cannot read users, subscribers, messages, Kindle logs, orders, chapter text or book files; cannot create accounts or change settings; cannot see drafts.

**Hydration warning (fixed 2026-11-06):** caused by the ColorZilla browser extension adding an attribute to `<body>`; the site now ignores extension-added body attributes. Reader, theme and “continue reading” now read browser storage in the hydration-safe way.

---

## 1. Decided

### Design principle: minimal look, strong features
The owner always prefers a **minimal** site. Every design decision follows this:
- Lots of white space, one accent colour (the logo orange), at most 2 fonts.
- No decoration for its own sake: no gradients, heavy shadows, badges, or busy cards.
- Show less per screen: short card text, clear headings, few buttons.
- Features stay powerful but **quiet**. Reader settings sit behind one "Aa" button, filters are simple text chips, and admin-only controls never appear on the public site.
- Sections and ads can be switched off, so the homepage can be made even simpler at any time.

### Product
- **Language:** the whole site is in Bangla (menus, buttons, dates, numbers).
- **Audience:** mostly mobile readers in Bangladesh, so the site must be light and fast.
- **Sections:** intro, video slider (with category filter), feature/article slider, free book library + reader, published books (buy links), ad/promo slots.
- **Videos:** on Facebook for now (must be set to Public). Switch to YouTube later by changing links only.
- **Book files:** the owner provides Word + EPUB for each book. Word goes into the on-site reader as chapters, and EPUB is used for download and Kindle.
- **Send to Kindle:** the site emails the EPUB directly to the reader's `@kindle.com` address. Free books only.
- **Login (phase 2):** email + password and Google.
- **Paid books (phase 3):** read on site only, with a few free sample chapters. Never downloadable.
- **Admin controls everything:** logo, icon, favicon, intro, banners, ads, menu, homepage section order, offers, pages.
- **Every article and video needs a thumbnail** (required field). YouTube thumbnails can be fetched automatically; Facebook ones are uploaded.

### Printed books: buy links + direct selling
- Each printed book has **any number of buy links** (Rokomari, Wafilife, the publisher's page, etc.), each with store name, URL and an optional price, in an order the admin sets.
- **Direct selling from the site is planned (phase 3)**, using the same cart and orders as ebooks:
  - own price and sale price, stock count, on/off per book
  - **cash on delivery first**, with online payment (SSLCommerz/bKash) added alongside
  - delivery charge inside Dhaka / outside Dhaka, set in admin
  - order status: received, confirmed, shipped, delivered, cancelled, with an SMS/email at each step
  - courier booking through Pathao / Steadfast / RedX later, manual at first
  - signed copies (optional extra)
- The owner must buy stock from the publishers to resell. That is a business arrangement, not a technical one.

### Categories
**Videos:** ননসেন্স-আলাপ · বইপ্যাঁচাল · একগুচ্ছ বই

**Articles:** ফিচার · গল্প · বইপ্যাঁচাল · পাঁচমিশালি

**Topics (বিষয়):** instead of sub-categories, every article and video can get one or more **topics** (e.g. বিজ্ঞান, অর্থনীতি, ইতিহাস, মহাকাশ).
- A topic works across all categories, so a ফিচার and a বইপ্যাঁচাল on physics both appear under বিজ্ঞান.
- Each topic gets its own page (e.g. `/topic/science`) and can be used as a filter.
- Topics are created freely in admin, so nothing needs deciding now.
- The category model also supports an optional parent category, so real sub-categories can be added later without changing the core.

### Bangla text
- All Bangla copy written for the site (intro, About, buttons, empty states, error messages) is a **draft for the owner to correct**.
- Every piece of visible text is editable: content in admin, and interface text (buttons, labels) in one Bangla text file.
- Gemini's AI Studio wording is not reused.

### Free books for the library (first two)
| Book | Type | Status |
|---|---|---|
| আ ডেড জ্বিন ইন কায়রো | উপন্যাসিকা (translation) | Ready, already free on the Facebook page |
| কাহো | গল্প (translation) | Ready, already free on the Facebook page |

The owner will send the EPUBs when the reader is ready to test.

### Domain
- **Bought: nonsenseland.com** (Cloudflare Registrar, 2026-11-07). Workers Paid ($5/month) is bought only at deployment.
- Not needed to start building. Development and testing run on a free Cloudflare test address (`*.workers.dev`).
- **Needed before launch**, because these depend on it:
  - sending email (Kindle, password reset) from the site's own address
  - Google login setup
  - bKash API callback address
  - Facebook share previews and Google indexing
- Buy it on Cloudflare Registrar when the site is close to launch, or earlier to reserve the name.

### Logo files
- `Nonsenseland_Icon.svg`: icon, all shapes, ready for web.
- `Nonsenseland_Logo_Outlined.svg`: **full logo for the website.** The tagline was converted to outlines using the original Neometric Alt Medium font file, and it matches the PNG exactly. It no longer depends on any font.
- `Nonsenseland_Icon & Logo.svg` / `.ai`: originals, kept unchanged. (Their tagline is live text, so they are not used on the web.)

### Published books to show (print, with buy links)
Only books written or translated by the owner, not the ones he edited.

| Book | Role |
|---|---|
| বিজ্ঞানবিশের খসড়া খাতা | লেখক |
| ডেড জ্বিন ইউনিভার্স | অনুবাদক |
| অ্যান্টিম্যাটার | অনুবাদক |
| রসায়ন: সহজ পাঠ | অনুবাদক |
| সিক্স ইজি পিসেস | অনুবাদক |
| অ্যাস্ট্রোফিজিকস ফর পিপল ইন আ হারি | অনুবাদক |
| দ্য ক্যারেক্টার অব ফিজিক্যাল ল | অনুবাদক |
| ফ্ল্যাটল্যান্ড | অনুবাদক |
| হোমারের পদরেখা ধরে | অনুবাদক |

Source: https://www.rokomari.com/book/author/70009/uchsash-tousif

### Technology (proposed, waiting for approval)
| Part | Choice |
|---|---|
| Website + admin panel | Next.js + Payload CMS (one codebase) |
| Database | PostgreSQL (Neon) |
| Files (covers, EPUB, images) | Cloudflare R2 |
| Hosting | Cloudflare Workers, paid plan ($5/month per account, shared by all sites) |
| Domain | Cloudflare Registrar (sold at cost) |
| Email | Resend, sending from the site's own domain |
| Spam protection | Cloudflare Turnstile |
| Analytics | Cloudflare Web Analytics |
| Payments (phase 3) | bKash Personal Retail Account first (see section 4); SSLCommerz/cards later |

### Fonts
- Bangla text uses free web fonts: Hind Siliguri for menus and headings, Noto Serif Bengali for reading.
- Neometric and Product Sans are not licensed for web use. The logo is shown as an image, not as typed text.

### Reader features
- Background themes: white, sepia, dark (3–4 total; more can be added later)
- Fonts: 2–3 Bangla fonts (serif for reading, sans for clean look)
- Text size, line spacing, column width
- Chapter list, progress bar, previous/next chapter (buttons, swipe, arrow keys)
- Remembers the reader's place (in the browser now; across devices after login)
- Settings are remembered per reader
- The same reader is used for articles (লেখা) and books

### Site-wide features
- **Search** across articles, videos and books, working in Bangla
- **Share buttons** (Facebook, Messenger, WhatsApp, copy link), with an automatic share image for each page
- **Drafts, preview and scheduled publishing** for articles, videos and books
- **Site dark mode** that follows the phone's setting, with a manual switch
- **Contact form** (spam-protected) and a friendly Bangla 404 page
- **Newsletter sign-up** (subscribers stored now; sending emails comes later)
- **Image alt text** on every image, for accessibility and Google
- **Author field** on articles, so guest writers can be added later

---

## 2. How books get into the reader

Done entirely in the admin panel; no developer needed.

1. Create the book (title, cover, description, access: free/paid).
2. Upload the **EPUB** (preferred source) or the **Word file**.
3. The site converts it automatically:
   - splits it into chapters (EPUB is already split; Word splits at every **Heading 1**)
   - keeps bold, italics, quotes, footnotes and tables
   - moves images to file storage
4. **Preview screen:** a list of chapters with titles and word counts. The admin can rename, merge, split, reorder or delete chapters, and fix text, before publishing.
5. Publish. The same EPUB is used for download and Kindle.

**Re-uploading** a corrected file replaces the text but keeps chapter links and readers' saved positions where chapter titles match.

**Why EPUB first:** it is already divided into chapters and cleanly formatted. Using it for the reader too means the reader, the download and Kindle always show the same version.

**Rules for files:**
- Bangla must be **Unicode** (e.g. Kalpurush, Nikosh, SolaimanLipi), **not Bijoy/SutonnyMJ**. Bijoy text turns into garbage on the web, so convert it to Unicode first.
- Word files: use **Heading 1** for chapter titles and Heading 2 for sub-sections, not just bold large text.
- Insert images as real images, not as floating shapes or text boxes.

---

## 3. Ads and promo slots

One system handles both the owner's own book promos and, later, Google ads.

**Ad slots** are fixed places on the site:
- homepage, between sections
- inside articles, after paragraph N
- after an article ends
- the sidebar on wide screens
- book pages
- the reader: off by default and never shown in paid books

**Each slot has a mode the admin can switch:**
- **Off:** nothing shows, and the space collapses.
- **House ad:** the owner's own banner (image + link + start/end date). Several banners can rotate in one slot.
- **Google AdSense:** later, once the site is approved.
- **Custom code:** for other ad networks or sponsors.

**There is also one master switch that turns every ad on the site off.**

- Each slot keeps a fixed size so the page doesn't jump while loading.
- Before turning on AdSense, the site needs:
  - Google approval
  - a Privacy Policy
  - enough original content
  - a cookie-consent banner for visitors from Europe and the UK

---

## 4. Payments: starting with bKash

### Account: bKash Personal Retail Account (PRA)
Checked on bKash's official page (2026-11-06): https://www.bkash.com/en/page/personal-retail-account

- Made for micro and small retail and f-commerce businesses. **No trade licence needed.**
- **Documents:**
  - NID
  - a mobile number registered to that NID that has **never had a bKash account**
  - proof of SIM ownership
  - nominee's NID, if applicable
- **The NID must not already be used for a bKash business account** (agent or merchant). A personal bKash account on the same NID is fine.
- Self-registration at https://account.bkash.com/ (no customer care visit needed).
- **Can receive payment by QR, the bKash Payment Gateway, or typed account number.**
- **Limits:** receive up to ৳30,000 per transaction, ৳30,000 per day and ৳5,00,000 per month. That is plenty for book sales.
- **Fees:**
  - receiving payments from customers: free (bKash calls this a promotional offer, valid until further notice)
  - sending money to a customer (for refunds): ৳5
  - cash-out: free up to ৳5,000 for the first 3 months; charges apply otherwise
- Statements are available in the bKash Merchant App.

### Website integration (developer side)
- bKash developer portal: https://developer.bka.sh/
- **Products listed there:**
  - **Tokenized Checkout** (with or without a saved agreement): the customer enters their bKash number, OTP and PIN on bKash's secure page
  - Auth & Capture
  - Refund
  - Query/Search Transaction
  - Instant Payment Notification (IPN)
- API credentials (app key, app secret, username, password) and sandbox access are issued by bKash during merchant onboarding.
- **Not yet confirmed:** whether a **PRA** gets its own API credentials for website checkout. The PRA page says it can receive through the Payment Gateway, but not how a PRA gets connected. **Ask bKash (16247 or the merchant support email) before phase 3.**

### bKash API notes (read from developer.bka.sh on 2026-11-09)

**Use Tokenized Checkout without agreement.** One payment at a time; the customer enters wallet number, OTP and PIN on bKash's own page, so the site never sees them. Agreements (saved wallets) can come later.

**Flow**
1. Server gets a token: Grant Token, with `username` and `password` headers and `app_key`, `app_secret` in the body.
2. Create Payment: `amount`, `currency` BDT, `intent` sale, `payerReference`, `merchantInvoiceNumber` (unique per attempt), `callbackURL`. Returns `paymentId` and `bKashURL`.
3. Redirect the customer to `bKashURL` exactly as returned.
4. bKash returns the customer to the success, failure or cancelled callback.
5. On success only: Execute Payment with the `paymentId`. **The callback alone proves nothing.**
6. Mark the order paid only when Execute says `Completed` (or Query Payment does), and the amount and invoice match the order.
7. If Execute gets no answer in 30 seconds: never assume failure and never call Execute again. Call Query Payment. `Completed` = paid. `Initiated` = start again with a new Create Payment.

**Sandbox endpoints** (base `https://tokenized.sandbox.bka.sh/v2/tokenized-checkout`): `/auth/grant-token`, `/payment/create`, `/payment/execute`, `/query/payment`, `/refund/payment/transaction`. Requests carry `Authorization: Bearer <id_token>` and `X-App-Key`.

**Rules that shape the code**
- Token lasts 60 minutes; refresh at minute 50–55; refresh token lasts 30 days. **Grant/Refresh more than twice an hour is an error and blocks refresh for an hour**, so the token must be stored in the database and shared, not fetched per request (Cloudflare Workers do not share memory).
- App secret and refresh token stay on the server only.
- A `paymentId` lasts 24 hours and can be executed once, whatever the result.
- All APIs time out at 30 seconds. Show customers `errorMessageEn`, not the code.
- Duplicate protection on our side, so a retry cannot charge twice. Code 2029 = duplicate; 2062 / 2068 = already completed (check status, do not charge again).
- Refunds: up to 60 days, up to 10 partial refunds per transaction, duplicates blocked for 10 minutes. On timeout, call Refund Status before retrying.
- IPN (optional, later): bKash support registers our listener URL. It confirms a one-time subscription, sends only successful transactions, and every message must have its signature verified.

**Not found in the public docs; ask bKash**
1. Can a **Personal Retail Account** get Tokenized Checkout credentials, or does it need a merchant account? (Unconfirmed since 2026-11-06, and the deciding question.)
2. How to get sandbox credentials and official test wallets. (Third-party guides list test wallets with OTP 123456 and PIN 12121; unverified.)
3. The **live base URL** for the v2 API. (Third-party packages show host `tokenized.pay.bka.sh` for an older version; unverified.)
4. The exact callback parameters. (Older integrations receive `paymentID` and `status`; to confirm in sandbox.)
5. Any charge per payment for gateway use on a PRA, and whether the ৳30,000 per day limit applies to gateway payments.
6. What bKash reviews before go-live (site, Terms, refund policy, demo).

**Needed to implement:** the four credentials for sandbox and again for live (`username`, `password`, `app_key`, `app_secret`), HTTPS on nonsenseland.com, published Terms and refund policy, and sandbox access. Until credentials arrive the flow can be built and tested against a local stand-in for bKash.

### bKash research update (2026-11-09)

**Official bKash pages (read directly)**
- The PRA page says customers can pay a PRA through the bKash Payment Gateway. The Online Business page sends sellers without a trade licence to the PRA.
- The Online Business page has a sign-up form for online sellers, with "Do you have a valid trade license?" as a yes/no question and a website URL field: https://www.bkash.com/en/business/online-business
- bKash publishes no per-payment rate for merchants, and PRA receiving is free as a promotional offer.
- PRA opening also asks for a screenshot of the `*16001#` SMS listing the numbers registered on the NID.

**Still unconfirmed: can a PRA get API credentials?** bKash's own pages imply yes without explaining how. bKash's sample WooCommerce plugin asks for a Merchant Wallet, and third-party (mostly vendor) guides say the API needs a merchant account. Only bKash can settle this.

**Onboarding path, from a bKash-format guide (mirror dated 2024-11-14; may have changed)**
1. Integration start: Developer Portal, Merchant Integration Portal (`pgw-integration.bkash.com`), demo link and sandbox credentials are provided.
2. Build against sandbox.
3. Validate Create and Execute responses in the Merchant Integration Portal.
4. Production onboarding: live credentials are issued in the portal.
5. Confirm readiness with production credentials.
6. UAT and go-live: technical UAT checks the backend's security; business UAT checks the customer journey.

The portal did not open from this computer (name lookup failed here, though it resolves through public DNS). Try it from another network.

**Test data, same guide (unverified):** PIN 12121, OTP 123456. Normal wallets 01770618575, 01929918378, 01770618576, 01877722345, 01619777282, 01619777283. Failure cases: 01823074817 (insufficient balance), 01823074818 (debit block). Demo: https://merchantdemo.sandbox.bka.sh/

**Do not use the shared sandbox credentials published on blogs and GitHub.** They are not ours, may stop working at any time, and bKash issues its own at onboarding.

**Details to confirm in sandbox**
- Live base URL: third-party packages use `https://tokenized.pay.bka.sh/v2`; the host exists, but bKash's docs do not state it. Keep it a setting, because bKash may issue another URL.
- Callback fields: the official agreement sample shows `status` and `signature`; community samples for payments show `paymentID` and `status`. bKash does not explain `signature`, so payment is confirmed only through Execute or Query.
- Refresh token life: 30 days in current docs, 28 in the 2024 guide.

**Build decision:** write a small client of our own (a few endpoints) instead of a library. `bkash-js` does support Cloudflare Workers but is a very small project, and a payment path should not depend on it.

**If a PRA cannot get API access:** keep manual TrxID on the PRA; apply for a merchant account (trade licence); or use an aggregator such as SSLCommerz, aamarPay or shurjoPay, which do not need your own bKash merchant account but have their own agreement and fees.

### How the site handles it (so nothing core changes later)
The checkout uses **interchangeable payment methods**, each switchable on/off in admin:
1. **bKash automatic (API):** used once credentials are issued. The order is marked paid automatically and refunds are possible from admin.
2. **bKash manual:** the customer pays the PRA number (QR or "Payment") and enters the **TrxID**. The admin checks it in the bKash app and approves, and the order then unlocks. This works from day one with no API.
3. **Cash on delivery:** for printed books.
4. **Later:** Nagad, cards via SSLCommerz, etc. are added as more methods without changing orders.

---

## 5. Running the site safely

- **Code in a private GitHub repository:** full history, and any developer can pick it up later.
- **Two copies of the site:**
  - a **test site** (e.g. `test.yourdomain.com`) where changes are checked first
  - the **live site**
- **Daily automatic database backups**, plus file storage backups.
- **Admin security:** strong password + two-step login for the admin account.
- **Uptime alert:** a free monitor emails the owner if the site goes down.
- **Updates:** software updates every few months (security fixes), done on the test site first.
- **Admin guide:** a short Bangla/English guide on how to add articles, videos, books, ads and offers.

---

## 6. Phases

1. **Launch:**
   - homepage sections, video slider, feature slider, books row, published books
   - ad/promo slots (house ads)
   - the reader
   - EPUB download + Kindle email
   - full admin with Word import
   - SEO, analytics, legal pages
2. **Accounts:**
   - email + password and Google login
   - reading progress across devices, saved Kindle address, bookmarks
   - newsletter
3. **Selling:**
   - paid ebooks and **direct sale of printed books** (one shared cart)
   - cash on delivery + payment gateway, delivery charges, stock, order tracking
   - coupons and offers, orders and receipts
   - Google AdSense if wanted
4. **Later:** YouTube switch, highlights/notes, installable phone app, more admin roles.

The data model for users, orders, offers and ad slots is created in phase 1, so later phases add features without changing the core.

---

## 7. About page

Editable in admin like every other page. Planned content:
- Who is behind Nonsenseland: a short bio of উচ্ছ্বাস তৌসিফ (writer, translator, science writer)
- What Nonsenseland is: "Talk. Anything and Everything.", plus videos, writing and books
- Photo and/or the sketch caricature
- Highlights: published books (linked to the books section), work at বিজ্ঞানচিন্তা
- Links: Facebook, Instagram, email; YouTube later
- Contact form

---

## 8. Open items: needed from the owner

- [ ] **Approve the plan and technology** above.
- [x] **Logo files:** SVGs received.
- [x] **Logo tagline:** converted to outlines (`Nonsenseland_Logo_Outlined.svg`).
- [x] **First free books:** আ ডেড জ্বিন ইন কায়রো and কাহো (EPUBs to be sent when needed).
- [ ] **Book rights (future books):** list further books that can be free online. Only include books the owner holds the rights to, or has written permission for. Published translations get cover + description + sample chapter + buy link.
- [x] **Domain:** nonsenseland.com, bought 2026-11-07 at Cloudflare Registrar.
- [x] **Categories:** decided (see "Categories").
- [ ] **Topics:** a first list of topics (বিজ্ঞান, অর্থনীতি…). Optional; can be added any time.
- [ ] **Bangla review:** correct the site's Bangla text once the first version is up.
- [ ] **Book files:** EPUB (preferred) or Word for each free book, final versions, in Unicode Bangla.
- [ ] **Direct print sales:** decide whether to stock books (bought from publishers) and which courier to use.
- [ ] **Kindle test:** send one Bangla EPUB to a real Kindle and check that যুক্তাক্ষর display correctly.
- [ ] **bKash PRA (before phase 3):** open the account (NID + a fresh SIM never used for bKash), then ask bKash whether a PRA can get Payment Gateway API credentials for a website.
- [ ] **Existing Facebook writing:** yes, some posts move to the site. Pick which ones (link + category).
- [ ] **About page content:** bio text and photo (outline in section 7).
- [x] **Launch content:** enough videos already on the Facebook page.

---

## 9. Notes and warnings

- **Selling online (phase 3):** a trade licence is not needed to start with a bKash PRA. Still publish clear delivery times and a refund policy, since customers and payment providers expect them.

- Facebook videos must be Public to play on the site.
- Print-book prices are set by Rokomari, so "offers" on print books are badges/banners only. Real discounts apply only to ebooks sold on the site.
- Paid books are never downloadable or sent to Kindle.
- Web addresses use English words (e.g. `/features/antimatter-review`) because Bangla addresses become unreadable when shared.

## Fonts (2026-11-14)

- Reading: Kalpurush (default) and Li Subha Letterpress, chosen by the reader in reading settings. Signatures: Li Mainak Signature, from the editor's ¶ menu → Signature.
- The font files sit in `site/public/fonts/` and are **not in git** (the repository is public). Originals: `Fonts for Website/` (also ignored).
- Licence: the Lipighor licences bought (desktop) do **not** allow web use: webfont use needs a separate Lipighor webfont licence (admin@lipighor.com). Kalpurush is free for personal use; commercial use needs the designer's permission. Settle both before launch, or switch to free fonts.
- Local Postgres moved to port 15433: Windows reserved 5361–5560 after a restart, which blocked 5433.

## Cloudflare deployment (2026-11-14)

**Test site:** https://test.nonsenseland.com (Worker `nonsenseland`). nonsenseland.com itself is added after the owner approves the test site.

- **Database:** Neon (Singapore) through Hyperdrive `nonsenseland-db`. The local database was copied to Neon on 2026-11-14; **from now on content is edited on the live admin** (test.nonsenseland.com/admin). The local Docker database is only for development and is no longer in sync.
- **Files:** R2 `nonsenseland-media` (images, public), `nonsenseland-files` (EPUB/Word, private), `nonsenseland-cache` (page cache). Image sizes for new uploads are made on first view by `/img` with Cloudflare Images and kept in R2 (each size once; free allowance 5,000/month).
- **Title cards / article headers:** drawn in the admin's browser (canvas) with a live preview, sent with the save. Workers cannot run sharp.
- **Book import:** linkedom instead of jsdom (runs on Workers).
- **Jobs:** hourly Cron Trigger (`worker.ts`) runs scheduled publishing; newsletters run immediately.
- **Secrets** (Worker): PAYLOAD_SECRET (new for live), RESEND_API_KEY, EMAIL_FROM, KINDLE_FROM, CONTACT_TO, CRON_SECRET, TURNSTILE_SECRET_KEY. Copies in `site/.env.production.local` (never committed). Public build values in `site/.env.production`.
- **Deploy:** `npm run cf:build` then `npm run cf:deploy` (needs Windows Developer Mode for symlinks).
- **Schema changes:** `npx payload migrate:create <name>` locally, then run it on Neon: `DATABASE_URL=<DATABASE_URL_DIRECT> NODE_ENV=production npx payload migrate`.
- **Backups of the live site:** `npm run backup:live` (Neon dump + R2 files mirrored in `G:\Nonsenseland Backups\live-files` + live.env).
- **Accounts:** the live database's only account is the temporary test admin (password in `.env.production.local`). The owner creates their own admin, then that account is removed.
- **Bundle size:** 9.0 MB of the 10 MB Worker limit (compressed). Watch it when adding libraries.
- **Watch:** an occasional "This socket has been closed" log after a page (pages still load; database connections are closed after each use).
- Local Postgres moved to port 15433 (Windows reserved 5433).

## Analytics (2026-11-14)

- **Choice:** Cloudflare Web Analytics, shown inside the admin (Admin → Analytics).
  - It's free, uses no cookies (so no consent banner) and the site already runs on Cloudflare.
  - Google Analytics was rejected: it needs cookies and a consent banner, and showing it in the admin needs a Google service account.
  - Counting views in our own database was rejected: a database write on every page view would keep Neon awake and cost money.
- **What the Analytics page shows:**
  - Visitors: page views, visits, views per day, most-read pages, referrers, countries, devices.
  - The site's own numbers: reader accounts, newsletter subscribers, messages, Kindle sends, books being read, most-liked খুচরো আলাপ.
- **Setup:**
  1. Cloudflare → Analytics & Logs → Web Analytics → Add a site → the site's host name. Choose the manual JS snippet.
  2. The snippet's token is public and goes in `.env.production` as `NEXT_PUBLIC_CF_BEACON_TOKEN`. The site tag goes in `wrangler.jsonc` vars as `CF_WEB_ANALYTICS_SITE_TAG`, and `CF_ACCOUNT_ID` goes there too.
  3. Create an API token: My Profile → API Tokens → Custom → Account · Account Analytics · Read. Then run `npx wrangler secret put CF_ANALYTICS_TOKEN`; the owner runs this themselves.

## Caching (2026-11-14)

- **Problem:** cached pages (home, books) stayed stale after an admin save, because `revalidatePath` does nothing on Cloudflare without a tag cache.
- **Fix:** a D1 tag cache was added (D1 database `nonsenseland-tags`, binding `NEXT_TAG_CACHE_D1`). Its usage stays within the Workers Paid allowance.
- **Fix:** page addresses now show only published documents, except in admin preview. Before this, a draft could be opened by its address.
