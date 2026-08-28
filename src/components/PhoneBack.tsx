"use client";

import { motion } from "framer-motion";
import type { Spot } from "@/lib/spots";
import { formatUsd, isSpotLocked, spotVisitUrl } from "@/lib/spots";

function stickerSizeClass(size: Spot["size"]) {
  if (size === "L") return "h-[86%] w-[86%]";
  if (size === "M") return "h-[80%] w-[80%]";
  return "h-[74%] w-[74%]";
}

function SpotCell({
  spot,
  onSelect,
}: {
  spot: Spot;
  onSelect: (spot: Spot) => void;
}) {
  const locked = isSpotLocked(spot);
  const favicon = spot.heldBy?.logo;
  const compact = spot.size === "S";
  const visitUrl = spotVisitUrl(spot);

  return (
    <button
      type="button"
      onClick={() => {
        if (visitUrl) {
          window.open(visitUrl, "_blank", "noopener,noreferrer");
          return;
        }
        onSelect(spot);
      }}
      aria-label={
        locked && spot.heldBy
          ? visitUrl
            ? `Spot ${spot.id}, ${spot.name}. Taken by ${spot.heldBy.name}. Visit their site.`
            : `Spot ${spot.id}, ${spot.name}. Taken by ${spot.heldBy.name} at ${formatUsd(spot.priceUsd)}.`
          : `Spot ${spot.id}, ${spot.name}, ${spot.dimensions}. Available for ${formatUsd(spot.priceUsd)}. Claim this spot.`
      }
      className={`group relative h-full min-h-0 w-full overflow-hidden transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
        spot.size === "L" ? "rounded-xl" : "rounded-lg"
      } ${
        locked
          ? "border border-white/20 bg-white/95 shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
          : "border border-dashed border-white/50 text-white hover:border-white/80"
      }`}
    >
      {locked && spot.heldBy ? (
        <span className="absolute inset-0 flex items-center justify-center p-1">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={128}
              height={128}
              className={`${stickerSizeClass(spot.size)} object-contain`}
            />
          ) : (
            <span
              className={`px-1 text-center font-semibold leading-tight text-ink ${
                compact ? "text-[9px] sm:text-[11px]" : "text-[10px] sm:text-[12px]"
              }`}
            >
              {spot.heldBy.name}
            </span>
          )}
        </span>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1 text-center">
          <span
            className={`font-semibold leading-none tabular-nums text-white/90 ${
              compact ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-[11px]"
            }`}
          >
            {spot.id}
          </span>
          <span
            className={`font-medium leading-none tabular-nums text-white/90 ${
              compact ? "text-[8px] sm:text-[11px]" : "text-[10px] sm:text-[13px]"
            }`}
          >
            {formatUsd(spot.priceUsd)}
          </span>
        </span>
      )}

      {locked ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-ink sm:px-3 sm:py-1 sm:text-[12px]">
            {visitUrl ? "Visit" : "Taken"}
          </span>
        </span>
      ) : null}
    </button>
  );
}

export function PhoneBack({
  spots,
  onSelect,
}: {
  spots: Spot[];
  onSelect: (spot: Spot) => void;
}) {
  return (
    <div className="relative mx-auto w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/iphone-back.png"
        alt="iPhone 17 back"
        width={1013}
        height={1553}
        decoding="async"
        fetchPriority="high"
        className="block h-auto w-full"
      />

      <div
        className="absolute grid gap-1 sm:gap-1.5"
        style={{
          left: "15.5%",
          right: "15.5%",
          top: "33%",
          bottom: "6%",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows:
            "minmax(0, 0.9fr) minmax(0, 0.95fr) minmax(0, 1fr) minmax(0, 1.2fr)",
        }}
      >
        {spots.map((spot, i) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.025, duration: 0.28 }}
            style={{ gridArea: spot.gridArea, minHeight: 0 }}
            className="h-full min-h-0"
          >
            <SpotCell spot={spot} onSelect={onSelect} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
