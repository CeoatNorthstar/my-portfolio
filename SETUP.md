# Sentinel Collective — Setup & Deployment

This site is a **React (CRA) frontend + Cloudflare Pages Functions backend**:
D1 (database), R2 (media storage), Cloudflare Access (admin auth), Turnstile
(anti-bot), and Stripe Embedded Checkout (donations).

---

## 0. Prerequisites
```bash
npm install
npx wrangler login
```

## 1. Create the database (D1)
```bash
npx wrangler d1 create sentinel-blog
```
Copy the printed `database_id` into **`wrangler.jsonc`** (replace
`REPLACE_WITH_D1_DATABASE_ID`). Then apply the schema:
```bash
npm run db:migrate          # remote (production)
npm run db:migrate:local    # local dev database
```

## 2. Create the media bucket (R2)
```bash
npx wrangler r2 bucket create sentinel-media
```
(The binding `MEDIA` is already configured in `wrangler.jsonc`.)

## 3. Lock down the admin with Cloudflare Access
The site is **naol.me**; the posting/admin console is **eda.naol.me** (visiting
its root redirects into `/admin`). Add `eda.naol.me` as a **custom domain on the
same Pages project**, then protect it:

Cloudflare Dashboard → **Zero Trust → Access → Applications → Add application →
Self-hosted**:
- **Application domain:** `eda.naol.me` (covers the whole console subdomain). Add a
  second entry for `naol.me` path `api/admin/*` so the admin API is gated there too.
- **Policy:** Action *Allow*, Include → *Emails* → `naol@sentinelhq.world`.
- After saving, copy the **Application Audience (AUD)** tag and your team domain
  (e.g. `yourteam.cloudflareaccess.com`).

Put these in **`wrangler.jsonc` → vars**:
```jsonc
"CF_ACCESS_TEAM_DOMAIN": "yourteam.cloudflareaccess.com",
"CF_ACCESS_AUD": "<the AUD tag>"
```
> The `/admin` UI and every `/api/admin/*` endpoint verify this JWT, so the API
> stays protected even if hit directly.

## 4. Turnstile (spam protection on comments + contact)
Dashboard → **Turnstile → Add widget**. Put the **site key** in
`wrangler.jsonc → vars.TURNSTILE_SITE_KEY`, and set the **secret** (step 6).

## 5. Stripe (embedded donations)
Already wired in `wrangler.jsonc`: publishable key, `STRIPE_PRODUCT_ID`
(`prod_Uhxz33Bkblx3Ja`), `SITE_URL=https://naol.me`, and
`DONATION_AMOUNT_CENTS=1000` ($10). Only the **secret key** remains (step 6).

> ⚠️ The old `server.js` held a different **live secret key** and was deleted —
> revoke that one in the Stripe Dashboard (it lives in git history). Also, the
> current secret key was shared in plaintext during setup; consider rotating it
> (or use a **restricted key**) once payments are confirmed working.

## 6. Secrets (never committed)
Set the secret key as an encrypted Cloudflare secret — either via the dashboard
(**Pages project → Settings → Variables and Secrets → Production → add as
*Secret***) or the CLI:
```bash
echo "<your sk_live_ key>" | npx wrangler pages secret put STRIPE_SECRET_KEY --project-name <your-pages-project>
echo "<turnstile secret>"  | npx wrangler pages secret put TURNSTILE_SECRET  --project-name <your-pages-project>
```

## 7. Deploy
```bash
npm run deploy        # builds + wrangler pages deploy
```
Or connect the GitHub repo in the Cloudflare Pages dashboard with
build command `npm run build` and output directory `build`.

---

## Local development

Frontend-only (fast UI iteration, no API):
```bash
npm start
```

Full stack (Functions + local D1/R2):
```bash
cp .dev.vars.example .dev.vars   # first time
npm run cf:dev                    # builds, then serves on http://localhost:8788
```
`.dev.vars` sets `DEV_ADMIN_BYPASS=true` so you can reach **`/admin`** locally
without Cloudflare Access, and uses Turnstile/Stripe **test** keys.

---

## How it fits together
- **Public site:** `/`, `/blog`, `/blog/:slug`, `/contact`, `/donate`
- **Admin console:** `/admin` (posts, rich TipTap editor with image/video/file
  uploads + embeds, comment moderation, contact inbox) — Access-gated.
- **"New post" banner:** appears on the homepage when the latest published post is
  newer than the visitor last saw (tracked in `localStorage`).
- **API:** `functions/api/**` (D1 + R2). Admin routes under `functions/api/admin/**`.
