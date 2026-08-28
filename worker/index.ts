/// <reference types="@cloudflare/workers-types" />

import { setDb } from "../src/lib/db";
import { setKv } from "../src/lib/kv";
import { handleApiRequest, runVisitSync } from "../src/server/handlers";

/** Worker secrets / vars + D1 (storage) + KV (analytics cache) */
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  KV: KVNamespace;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  DODO_PAYMENTS_API_KEY?: string;
  DODO_PAYMENTS_WEBHOOK_KEY?: string;
  DODO_PAYMENTS_ENVIRONMENT?: string;
  DODO_PRODUCT_ID?: string;
  POSTHOG_PERSONAL_API_KEY?: string;
  POSTHOG_PROJECT_ID?: string;
  POSTHOG_HOST?: string;
  CRON_SECRET?: string;
}

function applyEnv(env: Env) {
  setDb(env.DB);
  setKv(env.KV);
  for (const [key, value] of Object.entries(env)) {
    if (key === "ASSETS" || key === "DB" || key === "KV") continue;
    if (typeof value === "string" && value.length > 0) {
      process.env[key] = value;
    }
  }
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    applyEnv(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    applyEnv(env);
    ctx.waitUntil(
      runVisitSync().catch((err) => {
        console.error("[cron/visits]", err);
      }),
    );
  },
};

export default worker;
