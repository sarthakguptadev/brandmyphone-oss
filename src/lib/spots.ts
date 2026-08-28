export type SpotSize = "S" | "M" | "L";

export type SpotHolder = {
  name: string;
  logo?: string;
  url?: string;
};

export type Spot = {
  id: number;
  name: string;
  size: SpotSize;
  dimensions: string;
  priceUsd: number;
  /** CSS grid-area on a 4-column overlay */
  gridArea: string;
  heldBy?: SpotHolder;
};

export function isSpotLocked(spot: Spot) {
  return Boolean(spot.heldBy);
}

/**
 * Tiered stickers (cheap → pricey), ordered on the phone top→bottom.
 * Gross total ≈ $1,225 so net after Dodo fees covers ~$1,171 phone+AppleCare.
 */

/** India retail reference (INR) - shown converted to USD */
export const USD_INR_RATE = 83.5;
export const IPHONE_17_INR = 82_900;
export const APPLECARE_INR = 14_900;

function inrToUsd(inr: number) {
  return Math.round(inr / USD_INR_RATE);
}

/** iPhone 17 256GB + AppleCare+ (India retail → USD) */
export const IPHONE_17_USD = inrToUsd(IPHONE_17_INR);
export const APPLECARE_USD = inrToUsd(APPLECARE_INR);
export const SUBTOTAL_USD = IPHONE_17_USD + APPLECARE_USD;

/** Dodo cards/wallets: 4% + $0.40 per transaction */
export const DODO_FEE_RATE = 0.04;
export const DODO_FEE_FIXED_USD = 0.4;

const dimsBySize: Record<SpotSize, string> = {
  S: "1.2 × 1.2 cm",
  M: "1.8 × 1.8 cm",
  L: "2.6 × 2.6 cm",
};

type SpotDraft = Omit<Spot, "priceUsd" | "dimensions"> & {
  priceUsd: number;
};

/**
 * 4-column funnel:
 * R1: $25 $25 $25 $50
 * R2: $50 $50 $75 $75
 * R3: $100 $100 $125 $150
 * R4: $175 (span 2) · $200 (span 2)
 */
const spotDrafts: SpotDraft[] = [
  {
    id: 1,
    name: "Top · far left",
    size: "S",
    priceUsd: 25,
    gridArea: "1 / 1 / 2 / 2",
  },
  {
    id: 2,
    name: "Top · left",
    size: "S",
    priceUsd: 25,
    gridArea: "1 / 2 / 2 / 3",
  },
  {
    id: 3,
    name: "Top · right",
    size: "S",
    priceUsd: 25,
    gridArea: "1 / 3 / 2 / 4",
  },
  {
    id: 4,
    name: "Top · far right",
    size: "S",
    priceUsd: 50,
    gridArea: "1 / 4 / 2 / 5",
  },
  {
    id: 5,
    name: "Upper · far left",
    size: "S",
    priceUsd: 50,
    gridArea: "2 / 1 / 3 / 2",
  },
  {
    id: 6,
    name: "Upper · left",
    size: "S",
    priceUsd: 50,
    gridArea: "2 / 2 / 3 / 3",
  },
  {
    id: 7,
    name: "Upper · right",
    size: "M",
    priceUsd: 75,
    gridArea: "2 / 3 / 3 / 4",
  },
  {
    id: 8,
    name: "Upper · far right",
    size: "M",
    priceUsd: 75,
    gridArea: "2 / 4 / 3 / 5",
  },
  {
    id: 9,
    name: "Mid · far left",
    size: "M",
    priceUsd: 100,
    gridArea: "3 / 1 / 4 / 2",
  },
  {
    id: 10,
    name: "Mid · left",
    size: "M",
    priceUsd: 100,
    gridArea: "3 / 2 / 4 / 3",
  },
  {
    id: 11,
    name: "Mid · right",
    size: "M",
    priceUsd: 125,
    gridArea: "3 / 3 / 4 / 4",
  },
  {
    id: 12,
    name: "Mid · far right",
    size: "M",
    priceUsd: 150,
    gridArea: "3 / 4 / 4 / 5",
  },
  {
    id: 13,
    name: "Bottom · left",
    size: "L",
    priceUsd: 175,
    gridArea: "4 / 1 / 5 / 3",
  },
  {
    id: 14,
    name: "Bottom · right",
    size: "L",
    priceUsd: 200,
    gridArea: "4 / 3 / 5 / 5",
  },
];

export const spots: Spot[] = spotDrafts.map((draft) => ({
  ...draft,
  dimensions: dimsBySize[draft.size],
}));

export const SPOT_COUNT = spots.length;

export const GOAL_USD = spots.reduce((n, s) => n + s.priceUsd, 0);

export const MIN_SPOT_PRICE_USD = Math.min(...spots.map((s) => s.priceUsd));
export const MAX_SPOT_PRICE_USD = Math.max(...spots.map((s) => s.priceUsd));

/** Distinct sticker prices, ascending (for UI copy). */
export const SPOT_PRICE_TIERS_USD = [
  ...new Set(spots.map((s) => s.priceUsd)),
].sort((a, b) => a - b);

export function dodoFeeUsd(grossUsd: number) {
  return Math.round(grossUsd * DODO_FEE_RATE + DODO_FEE_FIXED_USD);
}

export const ESTIMATED_DODO_FEES_USD = spots.reduce(
  (n, s) => n + dodoFeeUsd(s.priceUsd),
  0,
);

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function raisedUsd(list: Spot[] = spots) {
  return list.filter((s) => s.heldBy).reduce((n, s) => n + s.priceUsd, 0);
}

export function takenCount(list: Spot[] = spots) {
  return list.filter((s) => s.heldBy).length;
}

/** Absolute URL for a claimed spot's site, if present. */
export function spotVisitUrl(spot: Spot): string | undefined {
  const raw = spot.heldBy?.url?.trim();
  if (!raw) return undefined;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
