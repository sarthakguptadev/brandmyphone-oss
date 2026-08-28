import { getKv, kvGetText, kvPutText } from "@/lib/kv";

export type VisitStats = {
  /** $pageviews in the last 5 hours */
  recent: number;
  /** Lifetime $pageviews */
  total: number;
  updatedAt: string | null;
};

const RECENT_KEY = "visits:recent";
const TOTAL_KEY = "visits:total";
const UPDATED_KEY = "visits:updatedAt";

const FALLBACK: VisitStats = {
  recent: 0,
  total: 0,
  updatedAt: null,
};

export async function getVisitStats(): Promise<VisitStats> {
  if (!getKv()) return FALLBACK;

  try {
    const [recent, total, updatedAt] = await Promise.all([
      kvGetText(RECENT_KEY),
      kvGetText(TOTAL_KEY),
      kvGetText(UPDATED_KEY),
    ]);

    return {
      recent: Number(recent ?? 0),
      total: Number(total ?? 0),
      updatedAt: updatedAt ?? null,
    };
  } catch {
    return FALLBACK;
  }
}

/** Cache PostHog pageview counts into Cloudflare KV. */
export async function setVisitStats(recent: number, total: number) {
  if (!getKv()) throw new Error("Cloudflare KV is not configured");

  const updatedAt = new Date().toISOString();
  await Promise.all([
    kvPutText(RECENT_KEY, String(Math.max(0, Math.round(recent)))),
    kvPutText(TOTAL_KEY, String(Math.max(0, Math.round(total)))),
    kvPutText(UPDATED_KEY, updatedAt),
  ]);

  return { recent, total, updatedAt } satisfies VisitStats;
}
