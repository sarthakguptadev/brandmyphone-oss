# Cloudflare deployment

This template deploys directly with the locally authenticated Wrangler CLI.
There is intentionally no GitHub Actions workflow.

## One-command setup

```bash
npm install
npm run launch
```

The launcher signs the user in through `wrangler login` if necessary, writes
the public project configuration, and calls `npm run deploy`.

`npm run deploy` performs these steps:

1. `wrangler d1 create … --update-config` creates the D1 database if the `DB`
   binding is absent.
2. `wrangler kv namespace create … --update-config` creates production and
   preview KV namespaces if their `KV` binding is absent.
3. `next build` creates static assets in `out/`.
4. D1 migrations are applied.
5. `wrangler deploy` uploads the Worker and static assets.

The launcher adds Dodo/PostHog/cron values as Worker secrets immediately after
deployment. Secrets are passed through standard input to `wrangler secret put`;
they are not committed or written to a local configuration file.

## URLs and domains

For the default workers.dev path, Wrangler reports the deployed URL. The
launcher captures it, writes it into the public site configuration, and runs a
second deployment so metadata and payment return URLs are correct.

For a custom domain, enter only its hostname (for example `sponsors.example.com`)
in the launcher. The domain must already be in the selected Cloudflare account.
The template writes a Wrangler `custom_domain` route and disables workers.dev.

## Optional integrations

| Secret | Used for |
| --- | --- |
| `DODO_PAYMENTS_API_KEY` | Create checkout sessions. |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Verify Dodo webhooks. |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` or `live_mode`. |
| `DODO_PRODUCT_ID` | Dodo Pay What You Want product. |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` / `POSTHOG_HOST` | Refresh visit counters. |
| `CRON_SECRET` | Protect `GET /api/cron/visits`. |

`NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are public build-time
values. The launcher supplies them to `next build`; never treat them as secrets.

After the first deploy, configure Dodo to send webhooks to:

```text
https://YOUR-SITE/api/webhooks/dodo
```

## Production checklist

Before switching `DODO_PAYMENTS_ENVIRONMENT` to `live_mode`:

- Set `DODO_PAYMENTS_WEBHOOK_KEY`. Without it, webhook verification fails
  closed and paid claims will never be recorded.
- Set `CRON_SECRET` to a long random value if you plan to trigger
  `GET /api/cron/visits` manually. The deployed Worker rejects the endpoint
  entirely while the secret is unset; the scheduled cron trigger does not
  need it.
- Point the Dodo webhook at `https://YOUR-SITE/api/webhooks/dodo` and send a
  test event from the Dodo dashboard.
- Run one `test_mode` purchase end to end and confirm the favicon appears on
  the phone before going live.
- Note that `POST /api/checkout` is unauthenticated and not rate limited at
  the application level. Consider a Cloudflare WAF rate-limiting rule on
  `/api/checkout` to stop bots from creating unlimited checkout sessions.

## Runtime topology

```text
Browser ── static assets ───────────────────────────┐
        ├─ /api/spots, /api/checkout, /webhooks/dodo ├─ Worker ─ D1
        ├─ /api/visits                               ├─ Worker ─ KV
        └─ PostHog browser SDK                        └─ PostHog
```
