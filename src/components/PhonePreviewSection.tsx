"use client";

import { PhoneBack } from "@/components/PhoneBack";
import type { Spot } from "@/lib/spots";
import {
  formatUsd,
  MAX_SPOT_PRICE_USD,
  MIN_SPOT_PRICE_USD,
} from "@/lib/spots";

export function PhonePreviewSection({
  spots,
  onSelect,
}: {
  spots: Spot[];
  onSelect: (spot: Spot) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[300px] sm:max-w-[360px]">
      <PhoneBack spots={spots} onSelect={onSelect} />

      <p className="mt-7 text-center text-[12px] text-ink-2">
        Tap any open spot - prices from {formatUsd(MIN_SPOT_PRICE_USD)} to{" "}
        {formatUsd(MAX_SPOT_PRICE_USD)}.
      </p>
    </div>
  );
}
