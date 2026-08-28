# BrandMyPhone — Phone Sticker Ads

The open-source boilerplate behind
[BrandMyPhone.tech](https://brandmyphone.tech), by
[Sarthak Gupta](https://x.com/sarthakguptadev).

[![Buy a spot on BrandMyPhone.tech](https://img.shields.io/badge/Buy%20a%20spot%20on%20BrandMyPhone.tech-0a84ff?style=for-the-badge&logo=apple&logoColor=white)](https://brandmyphone.tech)
[![Follow @sarthakguptadev on X](https://img.shields.io/badge/Follow%20%40sarthakguptadev-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/intent/follow?screen_name=sarthakguptadev)

A self-hostable storefront for selling sponsor sticker spots on the back of
a phone. Visitors pick one of 14 fixed-price spots, pay by card, and their
site's favicon appears on the live phone render seconds after the payment
confirms. The owner then prints the favicons as die-cut vinyl stickers for
the real device.

**See it live:** [brandmyphone.tech](https://brandmyphone.tech) is the
original running in production — the fastest way to see what you'd be
deploying, or to put your own brand on the original phone.

Built as a static Next.js site served by a single Cloudflare Worker, with
Dodo Payments for checkout, D1 for claim storage, KV for visit counters, and
PostHog for analytics. Runs entirely on Cloudflare's free tier plus payment
fees.

## Features

- 14 tiered sticker spots ($25–$200) laid out on an interactive phone render,
  with live "held by" state, favicons, and links to each sponsor's site.
- Card checkout through Dodo Payments; a spot is claimed by a signed webhook
  the moment the payment succeeds. First paid claim wins, never overwritten.
- Favicons are fetched automatically from the buyer's site URL, so sponsors
  need to enter exactly one field to buy a spot.
- Live funding progress bar and visit counters (last 5 hours + lifetime)
  synced from PostHog into KV by a cron trigger every 5 minutes.
- One-command interactive deployment (`npm run launch`) that provisions D1
  and KV, deploys the Worker, and stores secrets — no GitHub or CI required.
- Fully rebrandable: name, tagline, owner, prices, spot layout, and page copy
  are all plain config or data files.

## How a purchase works

1. A visitor clicks an open spot and enters their site URL.
2. `POST /api/checkout` validates the URL, confirms the spot is still open,
   and creates a Dodo checkout session with the spot ID and brand in its
   metadata. The visitor is redirected to Dodo's hosted payment page.
3. Dodo calls `POST /api/webhooks/dodo` when the payment succeeds. The Worker
   verifies the webhook signature, then inserts the claim into D1
   (`ON CONFLICT DO NOTHING`, so a spot can never be resold).
4. The homepage polls `GET /api/spots` and renders the new favicon on the
   phone.

## Architecture

```text
Browser ── static assets (Next.js export in out/) ──┐
        ├─ /api/spots, /api/checkout ───────────────┤
        ├─ /api/webhooks/dodo  ◄── Dodo Payments ───┼── Cloudflare Worker ── D1 (claims)
        ├─ /api/visits, /api/cron/visits ───────────┤        │
        └─ PostHog browser SDK                      └────────┴── KV (visit counters)
                                                              ▲
                       cron (*/5 min) ── PostHog HogQL query ─┘
```

The Next.js app is exported as fully static HTML (`output: "export"`), so
there is no Node server. The Worker (`worker/index.ts`) serves the static
assets and routes everything under `/api/` to plain request handlers in
`src/server/handlers.ts`.

## Tech stack

Next.js 16 (static export), React 19, Tailwind CSS 4, Framer Motion,
Cloudflare Workers + D1 + KV + cron triggers, Dodo Payments, PostHog, and
Wrangler for deployment.

## Quick start

Prerequisites: Node 24+, npm, and a Cloudflare account.

```bash
npm install
npm run dev        # local development at http://localhost:3000
```

Without any configuration the site runs with placeholder branding, no
payments, and zeroed counters — enough to develop the UI.

## Deploy to Cloudflare

Without cloning anything first, one line clones the repo, installs
dependencies, and starts the launch wizard:

```bash
curl -fsSL https://raw.githubusercontent.com/sarthakguptadev/brandmyphone-oss/main/install.sh | bash
```

Or from an existing clone:

```bash
npm install
npm run launch
```

The interactive launcher checks your tools, signs in with `wrangler login`,
asks for branding and optional integration keys, provisions D1/KV, deploys,
and stores secrets with `wrangler secret put`. Secrets are piped through
stdin and never written to disk. On a remote machine, sign in first with
`npx wrangler login --device`.

For manual, non-interactive deployment and custom domains, see
[DEPLOY.md](DEPLOY.md).

## Configuration

Public build-time values (safe to expose; embedded into the static bundle):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used in metadata and checkout return URLs. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key for the browser SDK. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host. |

Worker secrets (set with `wrangler secret put`, never committed):

| Secret | Purpose |
| --- | --- |
| `DODO_PAYMENTS_API_KEY` | Creates checkout sessions. |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Verifies webhook signatures. Payments cannot claim spots without it. |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` (default) or `live_mode`. |
| `DODO_PRODUCT_ID` | A single Pay What You Want product; each spot passes its own amount. |
| `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST` | Server-side HogQL queries for visit counters. |
| `CRON_SECRET` | Bearer token for manually triggering `GET /api/cron/visits`. |

Public project identity (worker name, site URL, display name, owner) lives in
`boilerplate.config.json`, `wrangler.jsonc`, and `src/lib/site-config.ts`,
all written by `npm run configure` or the launcher.

## HTTP API

| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/spots` | GET | none | All spots with public claim info (name, logo, url). |
| `/api/visits` | GET | none | Cached visit counters from KV. |
| `/api/checkout` | POST | none | `{ spotId, url }` → Dodo checkout URL. |
| `/api/webhooks/dodo` | POST | webhook signature | Marks a spot claimed after payment. |
| `/api/cron/visits` | GET | `Bearer CRON_SECRET` | Manually refresh visit counters. |

The Worker's cron trigger runs the same visit sync every 5 minutes, so the
HTTP cron endpoint is optional.

## Data model

D1 schema (`migrations/0001_init.sql`): a `claims` table keyed by `spot_id`
holds the sponsor name, logo, URL, payment ID, and claim time. Buyer email
and payment IDs are stored for the owner's records only and are never
returned by any API endpoint.

## Customization

- `src/lib/site-config.ts` — name, tagline, site URL, owner contact.
- `src/lib/spots.ts` — spot count, sizes, positions, prices, funding goal.
- `src/components/HomePage.tsx` — page copy, FAQs, and device details.
- `public/` — phone imagery, owner photo, favicon, and Open Graph image.

## Project structure

```text
src/app/            Next.js pages (home, /success)
src/components/     UI: phone render, spot table, claim modal, counters
src/lib/            Spots data, D1/KV access, Dodo + PostHog clients
src/server/         API request handlers (shared by the Worker)
worker/             Cloudflare Worker entry: static assets + /api routing
migrations/         D1 SQL migrations
scripts/            Launcher, configure, provision, migrate, deploy
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run launch` | Interactive configure + deploy to Cloudflare. |
| `npm run dev` | Run Next.js locally. |
| `npm run build` | Generate the static `out/` export. |
| `npm run preview` | Build and run locally through Wrangler. |
| `npm run deploy` | Provision, build, migrate, and deploy via Wrangler. |
| `npm run configure` | Write public project settings (non-interactive). |
| `npm run cf:bootstrap` | Create missing D1/KV resources. |
| `npm run db:migrate` | Apply D1 migrations. |
| `npm run lint` | Run ESLint. |

## Security model

- No secrets live in the repository; all runtime credentials are Worker
  secrets. `NEXT_PUBLIC_*` values are the only ones embedded in the client
  bundle and are public by design.
- Spot claims are only ever written by the Dodo webhook after signature
  verification. If `DODO_PAYMENTS_WEBHOOK_KEY` is unset, verification fails
  closed and all webhook requests are rejected.
- `/api/cron/visits` requires a `CRON_SECRET` bearer token in production
  builds and rejects all requests when the secret is unset.
- Read endpoints expose only public claim fields — never emails or payment
  IDs.

See the production checklist in [DEPLOY.md](DEPLOY.md) before going live.

## License

Free to use, modify, and deploy under an
[MIT license with one extra condition](LICENSE): deployed sites must keep the
"Powered by" attribution in the footer, crediting
[Sarthak Gupta](https://x.com/sarthakguptadev) and linking to
[brandmyphone.tech](https://brandmyphone.tech). The footer component ships
with it already in place, so there is nothing to add — just don't remove it.

And if you share what you built, tagging
[@sarthakguptadev](https://x.com/sarthakguptadev) on X with a link to
[brandmyphone.tech](https://brandmyphone.tech) is hugely appreciated.

## Credits

Built by [Sarthak Gupta](https://x.com/sarthakguptadev) for
[BrandMyPhone.tech](https://brandmyphone.tech). If this boilerplate is useful
to you, grabbing a sticker spot on [the original phone](https://brandmyphone.tech)
is the best way to support it.
