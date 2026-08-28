type HogQLResult = {
  results?: unknown[][];
  error?: string;
};

function posthogHost() {
  return (
    process.env.POSTHOG_HOST?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ||
    "https://us.i.posthog.com"
  );
}

async function runHogQL(query: string, name: string): Promise<number> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error("POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY are required");
  }

  const res = await fetch(
    `${posthogHost()}/api/projects/${projectId}/query/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
        name,
        // Relative windows use now() - without this, PostHog can keep serving a
        // cached empty result from the first sync.
        refresh: "force_blocking",
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog query failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as HogQLResult;
  if (data.error) throw new Error(data.error);

  const value = data.results?.[0]?.[0];
  return typeof value === "number" ? value : Number(value ?? 0);
}

/** $pageview events in the last 5 hours. */
export async function fetchRecentPageviews() {
  return runHogQL(
    `SELECT count()
     FROM events
     WHERE timestamp >= now() - INTERVAL 5 HOUR
       AND event = '$pageview'`,
    "phone_sticker_pageviews_5h",
  );
}

/** All-time $pageview events. */
export async function fetchTotalPageviews() {
  return runHogQL(
    `SELECT count()
     FROM events
     WHERE event = '$pageview'`,
    "phone_sticker_pageviews_lifetime",
  );
}

export async function syncVisitorsFromPostHog() {
  const [recentRaw, totalRaw] = await Promise.all([
    fetchRecentPageviews(),
    fetchTotalPageviews(),
  ]);
  // A lifetime total must always include the five-hour window.
  const recent = Math.max(0, recentRaw);
  const total = Math.max(totalRaw, recent);
  return { recent, total };
}
