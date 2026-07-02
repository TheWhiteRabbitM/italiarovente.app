"use client";

import { useEffect, useState } from "react";

// Contatore visite visibile. Conta una volta per sessione del browser.
export function VisitCounter({
  compact = false,
  lang = "it",
}: {
  compact?: boolean;
  lang?: "it" | "en";
}) {
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const counted = sessionStorage.getItem("mi_visited");
        if (!counted) {
          sessionStorage.setItem("mi_visited", "1");
          const r = await fetch("/api/visit", { method: "POST" });
          const j = await r.json();
          if (!cancelled) setVisits(j.visits ?? null);
        } else {
          const r = await fetch("/api/stats");
          const j = await r.json();
          if (!cancelled) setVisits(j.visits ?? null);
        }
      } catch {
        /* ignora */
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const text = visits === null ? "—" : visits.toLocaleString(lang === "en" ? "en-US" : "it-IT");
  const title = lang === "en" ? "Total visits" : "Visite totali";
  const label = lang === "en" ? "visits" : "visite";

  if (compact) {
    return (
      <span
        className="m3-chip bg-surface-container-high text-on-surface text-xs tabular-nums"
        title={title}
      >
        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
        👁 {text}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 m3-chip bg-tertiary-container text-on-tertiary-container">
      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
      <span className="font-bold tabular-nums">{text}</span>
      <span className="text-xs font-semibold opacity-80">{label}</span>
    </div>
  );
}
