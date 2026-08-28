"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { findSpot } from "@/lib/dodo";
import { formatUsd } from "@/lib/spots";
import { siteConfig } from "@/lib/site-config";

function SuccessContent() {
  const searchParams = useSearchParams();
  const spotId = Number(searchParams.get("spot"));
  const spot = Number.isFinite(spotId) ? findSpot(spotId) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[13px] font-medium text-apple-green">Payment received</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink">
        You&apos;re on the phone.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        {spot
          ? `Spot ${spot.id} (${spot.name}) is yours for ${formatUsd(spot.priceUsd)}. `
          : null}
        Your site favicon should appear on the live spots within a few
        seconds after payment confirms.
      </p>
      <Link
        href="/#spots"
        className="mt-8 rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-85"
      >
        Back to {siteConfig.name}
      </Link>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
          <p className="text-[13px] text-ink-2">Loading…</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
