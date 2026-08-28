import DodoPayments from "dodopayments";
import { spots } from "@/lib/spots";

export function getDodoClient() {
  const token = process.env.DODO_PAYMENTS_API_KEY;
  if (!token) {
    throw new Error("DODO_PAYMENTS_API_KEY is not set");
  }

  const environment =
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "live_mode"
      : "test_mode";

  return new DodoPayments({
    bearerToken: token,
    environment,
  });
}

/**
 * Single Pay What You Want product in Dodo (one-time payment).
 * Enable PWYW in the dashboard; checkout passes `amount` per spot in cents.
 */
export function dodoProductId(): string {
  const id = process.env.DODO_PRODUCT_ID;
  if (!id) {
    throw new Error(
      "DODO_PRODUCT_ID is not set. Create one Pay What You Want product in Dodo and paste its product ID.",
    );
  }
  return id;
}

/** USD spot price → Dodo amount (cents). */
export function spotPriceCents(priceUsd: number): number {
  return Math.round(priceUsd * 100);
}

export function findSpot(spotId: number) {
  return spots.find((s) => s.id === spotId) ?? null;
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.DODO_PAYMENTS_RETURN_URL?.replace(/\/success\/?$/, "") ||
    "http://localhost:3000"
  );
}
