"use client";

import { usePathname } from "next/navigation";

export default function Loading() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const label = lang === "en" ? "Italia Rovente · loading data…" : "Italia Rovente · carico i dati…";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-28 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="text-5xl animate-[pulseGlow_1.6s_ease-in-out_infinite]">🔥</div>
      </div>
      <div className="relative h-2.5 w-60 max-w-[70vw] rounded-full overflow-hidden bg-surface-container-high">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg,#2166ac,#4393c3,#92c5de,#f7f7f7,#fddbc7,#f4a582,#d6604d,#b2182b)",
          }}
        />
        <div className="absolute inset-0 shimmer" />
      </div>
      <p className="text-sm font-bold text-on-surface-variant tracking-wide">
        {label}
      </p>
    </div>
  );
}
