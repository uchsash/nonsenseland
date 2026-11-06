# Nonsenseland website

Next.js + Payload CMS + PostgreSQL. The public site is in Bangla; the admin panel is at `/admin`.
Decisions and the roadmap are in [`../decision.md`](../decision.md).

## Run locally

Needs Node 24.22+ (or 26 LTS) and Docker.

```bash
docker compose up -d        # local PostgreSQL on port 5433
cp .env.example .env        # then fill PAYLOAD_SECRET and DEV_ADMIN_PASSWORD
npm install
npm run seed                # categories, the published books, sample (নমুনা) content, test admin
npm run dev                 # http://localhost:3000  and  http://localhost:3000/admin
```

Sample items are named **নমুনা** — delete them before launch (or start the production database empty).

## Where things live

| What | Where |
| --- | --- |
| Data model | `src/collections/*`, `src/globals/index.ts` |
| Interface text (Bangla labels) | `src/i18n/bn.ts` |
| Pages | `src/app/(frontend)/…` |
| Reader (themes, fonts, progress, saved place) | `src/components/Reader.tsx` |
| EPUB / Word → chapters | `src/lib/book-import.ts` |
| Send to Kindle, newsletter, contact | `src/app/(frontend)/actions.ts` |
| Styles (minimal, one accent colour) | `src/app/(frontend)/styles.css` |

## Adding a book (admin)

1. **Books → Create**: title, cover, description.
2. **EPUB & Kindle** tab: upload the EPUB.
3. **Read online** tab: tick *Readable on the site*, open *Import chapters*, tick *Import chapters when I save*.
4. Save. The import report shows the chapters found and any warnings (missing Heading 1, Bijoy text…).
5. Check the chapters under **Chapters**, then **Publish**.

## Access rules (summary)

- Chapter text and book files are **never** served by the public API; the site checks access itself.
- Downloads and Kindle only for published, **free** books with the option ticked.
- Newsletter, contact and Kindle forms go through server actions (spam check + rate limit).
