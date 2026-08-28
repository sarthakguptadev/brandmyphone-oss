#!/usr/bin/env bash
# Configure and deploy directly to the signed-in Cloudflare account.
# No GitHub repository, CI workflow, API token, or secret file is required.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

step() {
  echo
  echo "==> $1"
}

ask() {
  local label="$1"
  local fallback="${2:-}"
  local reply
  if [[ -n "$fallback" ]]; then
    read -r -p "$label [$fallback]: " reply
    printf '%s' "${reply:-$fallback}"
  else
    read -r -p "$label: " reply
    printf '%s' "$reply"
  fi
}

ask_secret() {
  local label="$1"
  local reply
  read -r -s -p "$label: " reply
  printf '\n' >&2
  printf '%s' "$reply"
}

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "skip $name (empty)"
    return
  fi
  printf '%s' "$value" | npx wrangler secret put "$name"
}

step "1/6 Checking your tools"
for command in node npm npx; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

echo "✓ Node $(node --version), npm $(npm --version)"
if ! npx wrangler --version >/dev/null 2>&1; then
  echo "Wrangler could not be started. Run npm install, then try again." >&2
  exit 1
fi
echo "✓ Wrangler is available"

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "✓ GitHub CLI is installed and signed in (optional)"
  else
    echo "• GitHub CLI is installed but not signed in (optional; not needed to deploy)"
  fi
else
  echo "• GitHub CLI is not installed (optional; not needed to deploy)"
fi

step "2/6 Tell us about your site"
echo "Phone Sticker Sponsorship launcher"
echo "This script deploys straight to your Cloudflare account—no GitHub workflow."

PROJECT="$(ask 'Worker name (lowercase letters, numbers, dashes)' 'phone-sticker-sponsorship')"
DISPLAY_NAME="$(ask 'Public site name' 'Phone Sticker Sponsorship')"
TAGLINE="$(ask 'Short tagline' 'Let your brand travel')"
OWNER_NAME="$(ask 'Your name' 'The maker')"
OWNER_EMAIL="$(ask 'Contact email' 'hello@example.com')"
OWNER_X="$(ask 'X profile URL (optional)' '')"
CUSTOM_DOMAIN="$(ask 'Custom domain already on Cloudflare (optional, no https://)' '')"

step "3/6 Optional integrations"
echo "Press Enter to skip any integration. Secrets are never written to disk."
DODO_API_KEY="$(ask_secret 'Dodo Payments API key')"
DODO_WEBHOOK_KEY="$(ask_secret 'Dodo Payments webhook key')"
DODO_ENVIRONMENT="$(ask 'Dodo environment: test_mode or live_mode' 'test_mode')"
DODO_PRODUCT_ID="$(ask 'Dodo Pay-What-You-Want product ID' '')"
POSTHOG_KEY="$(ask_secret 'PostHog project API key')"
POSTHOG_HOST="$(ask 'PostHog host' 'https://us.i.posthog.com')"
POSTHOG_PERSONAL_API_KEY="$(ask_secret 'PostHog personal API key (for server-side counters)')"
POSTHOG_PROJECT_ID="$(ask 'PostHog project ID' '')"
CRON_SECRET="$(ask_secret 'Cron secret (optional; protects /api/cron/visits)')"

step "4/6 Check Cloudflare sign-in"
if npx wrangler whoami --json >/dev/null 2>&1; then
  echo "✓ Wrangler is already signed in to Cloudflare"
else
  echo "You are not signed in. Opening Cloudflare sign-in now…"
  npx wrangler login
  if ! npx wrangler whoami --json >/dev/null 2>&1; then
    echo "Cloudflare sign-in did not finish. Run npx wrangler login and retry." >&2
    exit 1
  fi
  echo "✓ Cloudflare sign-in complete"
fi

# A workers.dev URL is discovered from the first Wrangler deploy below. The
# placeholder allows the initial static build to complete without asking users
# to find their account subdomain themselves.
configure_site() {
  local url="$1"
  local args=(
    --project "$PROJECT"
    --site-url "$url"
    --display-name "$DISPLAY_NAME"
    --tagline "$TAGLINE"
    --owner "$OWNER_NAME"
    --email "$OWNER_EMAIL"
    --x "$OWNER_X"
  )
  if [[ -n "$CUSTOM_DOMAIN" ]]; then
    args+=(--domain "$CUSTOM_DOMAIN")
  fi
  node scripts/configure-template.mjs "${args[@]}"
}

SITE_URL="https://${CUSTOM_DOMAIN:-${PROJECT}.workers.dev}"
step "5/6 Configure and provision Cloudflare"
echo "Writing public site settings, then creating D1 and KV if they do not exist…"
configure_site "$SITE_URL"

deploy_site() {
  NEXT_PUBLIC_POSTHOG_KEY="$POSTHOG_KEY" \
    NEXT_PUBLIC_POSTHOG_HOST="$POSTHOG_HOST" \
    npm run deploy
}

DEPLOY_LOG="$(mktemp)"
step "6/6 Build and deploy"
echo "Building the site, applying D1 migrations, and deploying with Wrangler…"
if ! deploy_site 2>&1 | tee "$DEPLOY_LOG"; then
  rm -f "$DEPLOY_LOG"
  exit 1
fi

if [[ -z "$CUSTOM_DOMAIN" ]]; then
  DEPLOYED_URL="$(node scripts/extract-workers-url.mjs "$DEPLOY_LOG")"
  if [[ -z "$DEPLOYED_URL" ]]; then
    rm -f "$DEPLOY_LOG"
    echo "Deployment succeeded but its workers.dev URL could not be read." >&2
    echo "Set --site-url manually with npm run configure, then run npm run deploy." >&2
    exit 1
  fi
  SITE_URL="$DEPLOYED_URL"
  configure_site "$SITE_URL"
fi
rm -f "$DEPLOY_LOG"

set_secret NEXT_PUBLIC_SITE_URL "$SITE_URL"
set_secret DODO_PAYMENTS_API_KEY "$DODO_API_KEY"
set_secret DODO_PAYMENTS_WEBHOOK_KEY "$DODO_WEBHOOK_KEY"
set_secret DODO_PAYMENTS_ENVIRONMENT "$DODO_ENVIRONMENT"
set_secret DODO_PRODUCT_ID "$DODO_PRODUCT_ID"
set_secret POSTHOG_PERSONAL_API_KEY "$POSTHOG_PERSONAL_API_KEY"
set_secret POSTHOG_PROJECT_ID "$POSTHOG_PROJECT_ID"
set_secret POSTHOG_HOST "$POSTHOG_HOST"
set_secret NEXT_PUBLIC_POSTHOG_HOST "$POSTHOG_HOST"
set_secret CRON_SECRET "$CRON_SECRET"

if [[ -z "$CUSTOM_DOMAIN" ]]; then
  echo "Deploying once more with the discovered site URL…"
  deploy_site
fi

echo
echo "Live: $SITE_URL"
echo "Set your Dodo webhook to: $SITE_URL/api/webhooks/dodo"
