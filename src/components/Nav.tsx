"use client";

import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

export function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-hairline/70 bg-white/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a
          href="#"
          className="relative z-10 flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-ink"
        >
          <Image
            src="/logo-phone.svg"
            alt=""
            width={22}
            height={33}
            className="h-7 w-auto"
            priority
          />
          {siteConfig.name}
        </a>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="pointer-events-auto flex items-center gap-7 text-[13px] text-ink-2">
            <a href="#spots" className="transition-colors hover:text-ink">
              Available spots
            </a>
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#specs" className="transition-colors hover:text-ink">
              The phone
            </a>
            <a href="#faq" className="transition-colors hover:text-ink">
              FAQ
            </a>
          </div>
        </div>

        <a
          href="#spots"
          className="relative z-10 rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          Get a spot
        </a>
      </div>
    </nav>
  );
}
