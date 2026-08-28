"use client";

import { useCallback, useEffect, useState } from "react";
import type { VisitStats } from "@/lib/visits";

const POLL_MS = 30_000;

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function VisitCounter() {
  const [stats, setStats] = useState<VisitStats | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/visits", { cache: "no-store" });
      if (!res.ok) return;
      setStats((await res.json()) as VisitStats);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const initialId = window.setTimeout(() => void refresh(), 0);
    const id = window.setInterval(refresh, POLL_MS);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(id);
    };
  }, [refresh]);

  const recent = stats?.recent ?? 0;
  const total = stats?.total ?? 0;
  const ready = stats !== null;

  return (
    <span className="flex flex-wrap items-center justify-center gap-2 text-[13px] text-ink-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-apple-green opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-apple-green" />
      </span>
      <span className={ready ? undefined : "opacity-50"}>
        {formatCount(recent)} visited in the last 5 hrs
      </span>
      <span className="text-hairline">·</span>
      <span className={ready ? undefined : "opacity-50"}>
        {formatCount(total)} total
      </span>
    </span>
  );
}
