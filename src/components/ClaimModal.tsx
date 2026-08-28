"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Spot } from "@/lib/spots";
import { formatUsd, isSpotLocked, spotVisitUrl } from "@/lib/spots";

export function ClaimModal({
  spot,
  onClose,
}: {
  spot: Spot | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const urlField = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spot) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    urlField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [spot, onClose]);

  if (!spot) return null;

  const taken = isSpotLocked(spot);
  const visitUrl = spotVisitUrl(spot);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!spot || loading) return;

    const form = new FormData(e.currentTarget);
    const url = String(form.get("url") ?? "").trim();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId: spot.id, url }),
      });

      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start checkout");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-ink-2">
              Spot {spot.id} · {spot.dimensions}
            </p>
            <h2
              id={titleId}
              className="mt-1 text-xl font-semibold tracking-[-0.02em]"
            >
              {spot.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {taken ? (
          <div className="mt-6 space-y-4">
            {spot.heldBy?.logo ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spot.heldBy.logo}
                  alt=""
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl bg-white object-contain p-3 shadow-sm ring-1 ring-hairline/60"
                />
              </div>
            ) : null}
            <p className="text-[15px] leading-relaxed text-ink-2">
              This spot is already taken by{" "}
              <span className="font-medium text-ink">{spot.heldBy?.name}</span>{" "}
              for {formatUsd(spot.priceUsd)}. Pick another open zone on the
              phone.
            </p>
            <div className="flex flex-col gap-2">
              {visitUrl ? (
                <a
                  href={visitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full bg-ink px-6 py-3 text-center text-[15px] font-medium text-white transition-opacity hover:opacity-85"
                >
                  Visit {spot.heldBy?.name}
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className={`w-full rounded-full px-6 py-3 text-[15px] font-medium transition-opacity hover:opacity-85 ${
                  visitUrl
                    ? "border border-ink/20 text-ink"
                    : "bg-ink text-white"
                }`}
              >
                Browse other spots
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <p className="text-[15px] leading-relaxed text-ink-2">
              Fixed price for this spot - no auction. Drop your site URL and
              pay - your favicon is applied as soon as payment clears.
            </p>

            <div className="rounded-2xl bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-2">Price</span>
                <span className="text-2xl font-semibold leading-none tabular-nums">
                  {formatUsd(spot.priceUsd)}
                </span>
              </div>
            </div>

            <input
              ref={urlField}
              required
              type="url"
              name="url"
              placeholder="https://yoursite.com"
              disabled={loading}
              className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-[15px] outline-none transition-shadow placeholder:text-ink-2/70 focus:border-blue focus:ring-4 focus:ring-blue/15 disabled:opacity-60"
            />

            {error ? (
              <p className="text-center text-[13px] text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink px-6 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:opacity-70"
            >
              {loading
                ? "Redirecting to checkout…"
                : `Pay ${formatUsd(spot.priceUsd)} - claim this spot`}
            </button>
            <p className="text-center text-[12px] leading-relaxed text-ink-2">
              Secure checkout via Dodo Payments.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
