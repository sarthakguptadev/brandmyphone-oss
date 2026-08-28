"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/Nav";
import { PhonePreviewSection } from "@/components/PhonePreviewSection";
import { ClaimModal } from "@/components/ClaimModal";
import { VisitCounter } from "@/components/VisitCounter";
import {
  APPLECARE_USD,
  ESTIMATED_DODO_FEES_USD,
  GOAL_USD,
  IPHONE_17_USD,
  MIN_SPOT_PRICE_USD,
  MAX_SPOT_PRICE_USD,
  SPOT_COUNT,
  SPOT_PRICE_TIERS_USD,
  formatUsd,
  isSpotLocked,
  raisedUsd,
  spotVisitUrl,
  spots as defaultSpots,
  takenCount,
  type Spot,
} from "@/lib/spots";
import { siteConfig } from "@/lib/site-config";

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const faqs: { q: string; a: string }[] = [
  {
    q: "Is this real?",
    a: "Completely. The iPhone is real (well, imminent), the stickers are real vinyl, and I will travel with it and work with it in public spaces. The only fictional thing is the idea that a phone back isn't premium ad inventory.",
  },
  {
    q: "Why this iPhone?",
    a: "In short: I need a new daily driver + I'm building for iOS = iPhone 17. I've been indie hacking for a year and a half, limited by an old phone that struggles with camera, battery and demos. I'd like to finally ship and film on the same device everyone expects.",
  },
  {
    q: "What do I actually get?",
    a: "Your site favicon goes on the phone the moment you pay - live on this page. When the iPhone arrives, I also print it as a die-cut vinyl sticker for the real device. Your brand shows up in cafés, coworking, events, and some of what I post. No guaranteed impressions or ROI.",
  },
  {
    q: "How does payment work?",
    a: `No auction and no deposit race. ${SPOT_COUNT} sticker spots from ${formatUsd(MIN_SPOT_PRICE_USD)} to ${formatUsd(MAX_SPOT_PRICE_USD)} (includes Dodo payment fees). Enter your site URL, pay by card on Dodo Payments, and your favicon lands on the spot immediately.`,
  },
  {
    q: "Can any brand join?",
    a: "Almost. No gambling, crypto pump-and-dumps, adult content, or anything I'd be embarrassed to explain to a barista. I keep final say on what goes on the phone.",
  },
  {
    q: "Why not just buy the iPhone?",
    a: "I've been needing one for months. MRR is climbing but I'm still short of buying it outright. If this flops, I'll keep waiting - but you won't be on it then.",
  },
];

const specs: { label: string; value: string }[] = [
  {
    label: "Chip",
    value: "A19 - 6-core CPU, 5-core GPU, 16-core Neural Engine",
  },
  {
    label: "Display",
    value: '6.3" Super Retina XDR, ProMotion 120Hz, Ceramic Shield 2',
  },
  { label: "Storage", value: "256 GB" },
  { label: "Camera", value: "Dual 48MP Fusion + Ultra Wide, 18MP Front" },
  { label: "Battery", value: "All-day · up to 30 hours video playback" },
  { label: "Color", value: "Black" },
];

export function HomePage() {
  const [spots, setSpots] = useState<Spot[]>(defaultSpots);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/spots", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const payload = data as { spots?: Spot[] } | null;
        if (payload?.spots) setSpots(payload.spots);
      })
      .catch(() => {});
  }, []);

  const sold = raisedUsd(spots);
  const taken = takenCount(spots);
  const progress = Math.min(100, Math.round((sold / GOAL_USD) * 100));

  const sorted = [...spots].sort((a, b) => {
    const aTaken = isSpotLocked(a) ? 1 : 0;
    const bTaken = isSpotLocked(b) ? 1 : 0;
    if (aTaken !== bTaken) return aTaken - bTaken;
    if (a.priceUsd !== b.priceUsd) return a.priceUsd - b.priceUsd;
    return a.id - b.id;
  });

  return (
    <div className="min-h-screen bg-white text-ink">
      <Nav />

      <header className="mx-auto max-w-5xl px-6 pb-16 pt-12 text-center md:pt-16">
        <motion.div {...fade} transition={{ duration: 0.45 }}>
          <VisitCounter />
        </motion.div>

        <motion.h1
          {...fade}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-5 text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.06em]"
        >
          Your brand, on my iPhone.
        </motion.h1>

        <motion.p
          {...fade}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-4 max-w-[62ch] text-[13px] leading-relaxed text-ink-2 sm:text-[16px]"
        >
          Your logo travels with me on an 18yo founder&apos;s daily driver: the
          iPhone&nbsp;17.
        </motion.p>

        <motion.div
          {...fade}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-8 max-w-[17rem] sm:max-w-sm"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-semibold tabular-nums text-green sm:text-2xl">
              {formatUsd(sold)}
              <span className="ml-1.5 text-[13px] font-normal text-ink-2 sm:ml-2 sm:text-sm">
                sold
              </span>
            </span>
            <span className="text-[13px] tabular-nums text-ink-2 sm:text-sm">
              {formatUsd(GOAL_USD)} total
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Spots sold"
            className="mt-2 h-2 overflow-hidden rounded-full bg-hairline/60 ring-1 ring-inset ring-black/[0.06]"
          >
            <motion.div
              className="h-full rounded-full bg-apple-green"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="relative mx-auto mt-12 w-full md:mt-14"
        >
          <PhonePreviewSection
            spots={spots}
            onSelect={setSelected}
          />
        </motion.div>

        <div className="mt-14">
          <motion.p
            {...fade}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="mx-auto max-w-[95ch] text-[clamp(1rem,1.7vw,1.2rem)] leading-relaxed text-ink"
          >
            I&apos;m putting brands on the back of my iPhone&nbsp;17 - the one
            surface everyone sees.
          </motion.p>
          <motion.p
            {...fade}
            transition={{ duration: 0.45, delay: 0.45 }}
            className="mx-auto mt-4 max-w-[95ch] text-[clamp(1rem,1.7vw,1.2rem)] leading-relaxed text-ink-2"
          >
            Cafés, coworking spaces, events… get your brand in the outside world.
          </motion.p>
        </div>

        <motion.div
          {...fade}
          transition={{ duration: 0.45, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#spots"
            className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Get a spot
          </a>
          <a
            href="#how"
            className="text-[15px] font-medium text-blue hover:underline"
          >
            How it works&nbsp;›
          </a>
        </motion.div>
      </header>

      <section className="bg-ink py-24 text-white md:py-36">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-[clamp(1.75rem,5vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.025em]">
            Everyone recognises the apple.{" "}
            <span className="text-white/55">
              Show your logo right next to it.
            </span>
          </h2>
          <div className="mt-14 flex justify-center">
            <a
              href="#spots"
              aria-label="See available spots"
              className="rounded-full p-2 text-white/45 transition-colors hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                fill="none"
                className="h-8 w-8"
              >
                <path
                  d="M6 9.75L12 15.75L18 9.75"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section id="spots" className="scroll-mt-20 bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-ink-2">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-apple-green opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-apple-green" />
              </span>
              Live listing - {taken} of {spots.length} sticker spots taken
            </span>
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.015em] md:text-4xl">
            The spots, fixed price.
          </h2>
          <p className="mt-3 max-w-[60ch] text-ink-2">
            No bidding. {SPOT_COUNT} stickers from{" "}
            {formatUsd(MIN_SPOT_PRICE_USD)} to {formatUsd(MAX_SPOT_PRICE_USD)} -
            claim an open spot and it&apos;s yours.
          </p>
          <p className="mt-2 max-w-[60ch] text-[13px] text-ink-2">
            {SPOT_PRICE_TIERS_USD.map((p) => formatUsd(p)).join(" · ")}.
          </p>

          <ul className="mt-8 space-y-3 sm:hidden">
            {sorted.map((spot) => (
              <li
                key={spot.id}
                className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] text-ink-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-hairline/80 text-[11px] font-semibold tabular-nums">
                        {spot.id}
                      </span>
                      {spot.dimensions}
                    </p>
                    <p className="mt-1 truncate font-medium">{spot.name}</p>
                  </div>
                  <span className="shrink-0 text-right font-semibold tabular-nums">
                    {formatUsd(spot.priceUsd)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline/60 pt-3">
                  {spot.heldBy ? (
                    <span className="inline-flex min-w-0 items-center gap-2.5">
                      {spot.heldBy.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={spot.heldBy.logo}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-0.5 shadow-sm ring-1 ring-hairline/60"
                        />
                      ) : null}
                      <span className="font-medium">{spot.heldBy.name}</span>
                    </span>
                  ) : (
                    <span className="text-[14px] text-ink-2">Available</span>
                  )}
                  {spotVisitUrl(spot) ? (
                    <a
                      href={spotVisitUrl(spot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full border border-ink/20 px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-white"
                    >
                      Visit
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelected(spot)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                        isSpotLocked(spot)
                          ? "border border-ink/20 text-ink-2"
                          : "bg-ink text-white hover:opacity-85"
                      }`}
                    >
                      {spot.heldBy ? "Taken" : "Claim"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-hairline text-[12px] text-ink-2">
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Spot
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Dimensions
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium">
                      Held by
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-right font-medium"
                    >
                      Price
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((spot) => (
                    <tr
                      key={spot.id}
                      className="border-b border-hairline/60 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-hairline/80 text-[12px] font-semibold tabular-nums text-ink-2">
                          {spot.id}
                        </span>
                        <span className="font-medium">{spot.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[12px] text-ink-2">
                        {spot.dimensions}
                      </td>
                      <td className="px-5 py-4">
                        {spot.heldBy ? (
                          <span className="inline-flex items-center gap-2.5">
                            {spot.heldBy.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={spot.heldBy.logo}
                                alt=""
                                width={32}
                                height={32}
                                className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-0.5 shadow-sm ring-1 ring-hairline/60"
                              />
                            ) : null}
                            <span className="font-medium">{spot.heldBy.name}</span>
                          </span>
                        ) : (
                          <span className="text-ink-2">Available</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`tabular-nums ${
                            spot.heldBy ? "font-semibold" : "text-ink-2"
                          }`}
                        >
                          {formatUsd(spot.priceUsd)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {spotVisitUrl(spot) ? (
                          <a
                            href={spotVisitUrl(spot)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-ink/20 px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-white"
                          >
                            Visit
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelected(spot)}
                            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                              isSpotLocked(spot)
                                ? "border border-ink/20 text-ink-2"
                                : "bg-ink text-white hover:opacity-85"
                            }`}
                          >
                            {spot.heldBy ? "Taken" : "Claim"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how"
        className="mx-auto max-w-4xl scroll-mt-20 px-6 py-16 md:py-24"
      >
        <h2 className="text-3xl font-semibold tracking-[-0.015em] md:text-4xl">
          How it works
        </h2>
        <ol className="mt-10 space-y-10">
          {[
            {
              t: "Pick your price tier",
              d: `${SPOT_COUNT} spots from ${formatUsd(MIN_SPOT_PRICE_USD)} to ${formatUsd(MAX_SPOT_PRICE_USD)} - smaller stickers up top, larger premium spots at the bottom.`,
            },
            {
              t: "Claim it at the listed price",
              d: "Enter your site URL, pay the fixed price on checkout - your favicon lands on the spot right after payment.",
            },
            {
              t: "Your sticker rides along",
              d: "It shows on this page immediately. On the real iPhone, I print it as die-cut vinyl so your brand travels with me.",
            },
          ].map((step, i) => (
            <li key={step.t} className="flex gap-6">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{step.t}</h3>
                <p className="mt-1.5 max-w-[58ch] leading-relaxed text-ink-2">
                  {step.d}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="specs" className="scroll-mt-20 bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.015em] md:text-4xl">
            The phone.
          </h2>
          <p className="mt-3 max-w-[60ch] text-ink-2">
            iPhone&nbsp;17, 256&nbsp;GB, Black + AppleCare+ - the daily driver
            your sticker goes on.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col justify-between gap-2 border-b border-hairline px-5 py-5 sm:flex-row sm:items-baseline sm:px-8">
              <h3 className="text-xl font-semibold tracking-[-0.015em]">
                iPhone 17 + AppleCare+
              </h3>
              <p className="text-[13px] text-ink-2 sm:text-base">
                {formatUsd(GOAL_USD)} total
              </p>
            </div>
            <dl className="divide-y divide-hairline/70">
              <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:px-8">
                <dt className="text-[13px] font-medium text-ink-2">Phone</dt>
                <dd className="flex flex-col gap-0.5 text-[15px] leading-relaxed sm:flex-row sm:items-baseline sm:justify-between">
                  <span>iPhone 17, 256&nbsp;GB, Black</span>
                  <span className="tabular-nums text-ink-2">
                    {formatUsd(IPHONE_17_USD)}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:px-8">
                <dt className="text-[13px] font-medium text-ink-2">
                  AppleCare+
                </dt>
                <dd className="flex flex-col gap-0.5 text-[15px] leading-relaxed sm:flex-row sm:items-baseline sm:justify-between">
                  <span>2-year coverage (India)</span>
                  <span className="tabular-nums text-ink-2">
                    {formatUsd(APPLECARE_USD)}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:px-8">
                <dt className="text-[13px] font-medium text-ink-2">
                  Payment fees
                </dt>
                <dd className="flex flex-col gap-0.5 text-[15px] leading-relaxed sm:flex-row sm:items-baseline sm:justify-between">
                  <span>Dodo - 4% + $0.40 per spot (est.)</span>
                  <span className="tabular-nums text-ink-2">
                    {formatUsd(ESTIMATED_DODO_FEES_USD)}
                  </span>
                </dd>
              </div>
              {specs.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:px-8"
                >
                  <dt className="text-[13px] font-medium text-ink-2">
                    {row.label}
                  </dt>
                  <dd className="text-[15px] leading-relaxed">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
            Based on Apple&apos;s listed India prices for the phone and
            AppleCare+, converted to USD. Sticker tiers are set so sellout
            (~{formatUsd(GOAL_USD)}) covers that after Dodo&apos;s 4% + $0.40
            per-transaction fee.{" "}
            <a
              href="https://www.apple.com/in/shop/buy-iphone/iphone-17"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:underline"
            >
              Check the price at Apple India
            </a>
            .
          </p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.015em] md:text-4xl">
            Questions & Answers
          </h2>
          <div className="mt-8 divide-y divide-hairline/70">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-medium tracking-[-0.01em] transition-colors hover:text-ink-2"
                  >
                    {item.q}
                    <span
                      aria-hidden
                      className={`text-ink-2 transition-transform ${open ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                  {open && (
                    <p className="pb-5 text-[15px] leading-relaxed text-ink-2">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <Image
              src="/sarthak.jpg"
              alt={siteConfig.owner.name}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full border border-hairline object-cover"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">
                Hey, I&apos;m {siteConfig.owner.name} 👋
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                Solo founder, indie hacking for a year and a half. I build in
                public, ship SaaS and mobile apps. This is my iPhone&nbsp;17 -
                brands on the back, logo in hand. Questions, or want a spot?{" "}
                {siteConfig.owner.xUrl ? (
                  <>
                    <a
                      href={siteConfig.owner.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue hover:underline"
                    >
                      Find me on X
                    </a>{" "}
                    or{" "}
                  </>
                ) : null}
                {siteConfig.owner.email ? (
                  <a
                    href={`mailto:${siteConfig.owner.email}`}
                    className="text-blue hover:underline"
                  >
                    email me
                  </a>
                ) : (
                  "email me"
                )}
                .
              </p>
            </div>
          </div>
          <div className="mt-10 border-t border-hairline pt-6 text-[13px] text-ink-2">
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2/70">
              <a href="#spots" className="transition-colors hover:text-ink-2">
                Spots
              </a>
              <a href="#faq" className="transition-colors hover:text-ink-2">
                FAQ
              </a>
            </nav>
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-ink-2">
            {siteConfig.name} is not affiliated with, endorsed by, or sponsored by
            Apple&nbsp;Inc. iPhone is a trademark of Apple&nbsp;Inc.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-2">
            Powered by the{" "}
            <a
              href="https://brandmyphone.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:underline"
            >
              BrandMyPhone.tech
            </a>{" "}
            boilerplate by{" "}
            <a
              href="https://x.com/sarthakguptadev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:underline"
            >
              Sarthak Gupta
            </a>
            . Deploy your own in one click.
          </p>
        </div>
      </footer>

      <ClaimModal
        key={selected?.id ?? "closed"}
        spot={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
