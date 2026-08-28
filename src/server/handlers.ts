import {
  verifyWebhookPayload,
  handleWebhookPayload,
} from "@dodopayments/core";
import {
  getSpotsWithClaims,
  isSpotAvailable,
  setClaim,
} from "@/lib/claims";
import {
  dodoProductId,
  findSpot,
  getDodoClient,
  siteUrl,
  spotPriceCents,
} from "@/lib/dodo";
import { faviconUrlFor } from "@/lib/favicon";
import { syncVisitorsFromPostHog } from "@/lib/posthog-server";
import { parseSiteUrl } from "@/lib/site";
import { getVisitStats, setVisitStats } from "@/lib/visits";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function handleSpots(): Promise<Response> {
  const spots = await getSpotsWithClaims();
  return json(
    { spots },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleVisits(): Promise<Response> {
  const stats = await getVisitStats();
  return json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    },
  });
}

export async function handleCheckout(req: Request): Promise<Response> {
  let body: { spotId?: number; url?: string };
  try {
    body = (await req.json()) as { spotId?: number; url?: string };
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const spotId = Number(body.spotId);
  if (!spotId || !body.url?.trim()) {
    return json({ error: "spotId and url are required" }, { status: 400 });
  }

  let brand: string;
  let site: string;
  try {
    ({ brand, url: site } = parseSiteUrl(body.url));
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Invalid URL" },
      { status: 400 },
    );
  }

  const spot = findSpot(spotId);
  if (!spot) {
    return json({ error: "Spot not found" }, { status: 404 });
  }

  const available = await isSpotAvailable(spotId);
  if (!available) {
    return json({ error: "This spot is no longer available" }, { status: 409 });
  }

  let productId: string;
  try {
    productId = dodoProductId();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Product not configured";
    return json({ error: message }, { status: 500 });
  }

  const amountCents = spotPriceCents(spot.priceUsd);

  try {
    const dodo = getDodoClient();
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        { product_id: productId, quantity: 1, amount: amountCents },
      ],
      return_url: `${siteUrl()}/success?spot=${spotId}`,
      cancel_url: siteUrl(),
      minimal_address: true,
      customization: {
        show_order_details: false,
        show_on_demand_tag: false,
      },
      feature_flags: {
        allow_currency_selection: false,
        allow_discount_code: false,
        allow_phone_number_collection: false,
        allow_tax_id: false,
        redirect_immediately: true,
      },
      metadata: {
        spot_id: String(spotId),
        brand,
        brand_url: site,
      },
    });

    if (!session.checkout_url) {
      return json(
        { error: "Checkout URL missing from Dodo response" },
        { status: 502 },
      );
    }

    return json({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[checkout]", message);
    return json({ error: message }, { status: 502 });
  }
}

export async function handleDodoWebhook(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed. Use POST", { status: 405 });
  }

  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
  const body = await req.text();

  let payload: Parameters<typeof handleWebhookPayload>[0];
  try {
    payload = await verifyWebhookPayload({
      webhookKey,
      headers: {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
      },
      body,
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  await handleWebhookPayload(payload, {
    webhookKey,
    onPaymentSucceeded: async (eventPayload) => {
      const data = eventPayload.data as {
        payment_id?: string;
        metadata?: Record<string, string | null | undefined>;
      };

      const meta = data.metadata ?? {};
      const spotId = Number(meta.spot_id);
      if (!Number.isFinite(spotId) || spotId < 1) return;

      const brandUrl = meta.brand_url?.trim();
      const brandName = (meta.brand || "Brand").trim();

      await setClaim(spotId, {
        name: brandName,
        url: brandUrl,
        logo: brandUrl ? faviconUrlFor(brandUrl) : undefined,
        email: meta.email?.trim() || undefined,
        paymentId: data.payment_id,
      });
    },
  });

  return new Response(null, { status: 200 });
}

function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Sync PostHog → Cloudflare KV. Used by cron HTTP + Worker scheduled trigger. */
export async function runVisitSync() {
  const { recent, total } = await syncVisitorsFromPostHog();
  return setVisitStats(recent, total);
}

export async function handleCronVisits(req: Request): Promise<Response> {
  if (!cronAuthorized(req)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runVisitSync();
    return json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[cron/visits]", message);
    return json({ ok: false, error: message }, { status: 500 });
  }
}

export async function handleApiRequest(
  req: Request,
): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (pathname === "/api/spots" && req.method === "GET") {
    return handleSpots();
  }
  if (pathname === "/api/visits" && req.method === "GET") {
    return handleVisits();
  }
  if (pathname === "/api/checkout" && req.method === "POST") {
    return handleCheckout(req);
  }
  if (pathname === "/api/webhooks/dodo" && req.method === "POST") {
    return handleDodoWebhook(req);
  }
  if (pathname === "/api/cron/visits" && req.method === "GET") {
    return handleCronVisits(req);
  }

  return json({ error: "Not found" }, { status: 404 });
}
