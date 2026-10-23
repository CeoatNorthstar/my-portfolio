# naol.me — Setup & Deployment

React (CRA) frontend + Cloudflare Pages Functions backend on the Pages project
**`naol`** (Git-connected: every push to `main` deploys to naol.me).

- **D1** `sentinel-blog` (binding `DB`): posts, papers, comments, likes, favorites, messages
- **R2** `sentinel-media` (binding `MEDIA`): photos, videos, attachments, paper PDFs
- **Admin auth:** `ADMIN_TOKEN` secret (and/or Cloudflare Access)

---

## 0. Wrangler
```bash
npm install -g wrangler
wrangler login
```
(`npx wrangler ...` also works from this repo; it's a devDependency.)

## 1. Database schema
Schema lives in `migrations/` and is applied with D1 migrations:
```bash
npm run db:migrate          # production (remote)
npm run db:migrate:local    # local dev database
```
Add a new numbered `.sql` file for any schema change; never edit an applied one.

## 2. Secrets (never committed)
```bash
echo "<long random string>" | npx wrangler pages secret put ADMIN_TOKEN --project-name naol
```
`STRIPE_SECRET_KEY` is already set for when donations return.

## 3. Deploy
Push to `main`. (Manual alternative: `npm run deploy`.)

---

## Local development
```bash
npm install
cp .dev.vars.example .dev.vars   # first time; enables the admin without a token
npm run db:migrate:local         # first time
npm run cf:dev                   # build + serve on http://localhost:8788
```
`npm start` runs the frontend alone (no API).

`scripts/copy-pdfjs.js` runs before `start`/`build` and copies pdf.js into
`public/vendor/pdfjs` (gitignored). The reader and the paper uploader load it
from there on demand, so it never weighs down the main bundle.

---

## How it fits together
- **Home** (`/`, `/about`, `/contact`, `/donate`): the business card. Photo, name and
  role stay put; the area beside the photo changes.
- **Panels** (`/blog`, `/papers`): open beside the card, close with X, or fill the
  page with `?full=1` (Back to home in the top left).
- **Post** (`/blog/:slug`): article, sources, likes, saves, anonymous comments
  (newest page loads when you scroll to them; older ones load on request).
  Links to other posts/papers get a hover preview.
- **Paper** (`/papers/:slug`): title, author, date, abstract, Sources dropdown,
  and the in-page PDF reader (half page, expandable, highlights kept per browser).
  The newest paper is labelled **New** for 7 days.
- **Console** (`/admin`, or `eda.naol.me`): write posts (photos, video, YouTube,
  files, sources, keywords, link-to-my-writing and auto-link), upload papers
  (title, abstract, keywords and references are read from the PDF and stay
  editable), moderate comments, read messages.
- **API:** `functions/api/**`. Admin routes under `functions/api/admin/**`.
