import type { Spot, SpotHolder } from "@/lib/spots";
import { spots as baseSpots } from "@/lib/spots";
import { getDb } from "@/lib/db";

export type SpotClaim = SpotHolder & {
  email?: string;
  paymentId?: string;
  claimedAt?: string;
};

type ClaimRow = {
  spot_id: number;
  name: string;
  logo: string | null;
  url: string | null;
  email: string | null;
  payment_id: string | null;
  claimed_at: string;
};

function rowToClaim(row: ClaimRow): SpotClaim {
  return {
    name: row.name,
    logo: row.logo ?? undefined,
    url: row.url ?? undefined,
    email: row.email ?? undefined,
    paymentId: row.payment_id ?? undefined,
    claimedAt: row.claimed_at,
  };
}

export async function getClaim(spotId: number): Promise<SpotClaim | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db
    .prepare("SELECT * FROM claims WHERE spot_id = ?")
    .bind(spotId)
    .first<ClaimRow>();
  return row ? rowToClaim(row) : null;
}

export async function setClaim(spotId: number, claim: SpotClaim) {
  const db = getDb();
  if (!db) return false;

  const claimedAt = claim.claimedAt ?? new Date().toISOString();
  // First paid claim wins - never overwrite an existing holder.
  const result = await db
    .prepare(
      `INSERT INTO claims (spot_id, name, logo, url, email, payment_id, claimed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(spot_id) DO NOTHING`,
    )
    .bind(
      spotId,
      claim.name,
      claim.logo ?? null,
      claim.url ?? null,
      claim.email ?? null,
      claim.paymentId ?? null,
      claimedAt,
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function getSpotsWithClaims(): Promise<Spot[]> {
  const db = getDb();
  if (!db) return baseSpots;

  try {
    const { results: claimRows } = await db
      .prepare("SELECT * FROM claims")
      .all<ClaimRow>();

    const claimsById = new Map(
      (claimRows ?? []).map((row) => [row.spot_id, rowToClaim(row)] as const),
    );

    return baseSpots.map((spot) => {
      const claim = claimsById.get(spot.id);
      if (claim) {
        return {
          ...spot,
          heldBy: {
            name: claim.name,
            logo: claim.logo,
            url: claim.url,
          },
        };
      }

      return spot;
    });
  } catch {
    return baseSpots;
  }
}

export async function isSpotAvailable(spotId: number) {
  const spot = baseSpots.find((s) => s.id === spotId);
  if (!spot) return false;
  return !(await getClaim(spotId));
}
