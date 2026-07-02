"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dayLookupRange } from "@/lib/dayweather";

const STR = {
  it: {
    title: "🕰️ Che tempo faceva il…?",
    hint: "Scegli una data qualsiasi — dal 1940 a pochi giorni fa — e scopri che tempo faceva: il giorno del matrimonio, un compleanno, un ricordo.",
    label: "Data",
    cta: "Scopri",
  },
  en: {
    title: "🕰️ What was the weather on…?",
    hint: "Pick any date — from 1940 to a few days ago — and see what the weather was like: a wedding day, a birthday, a memory.",
    label: "Date",
    cta: "Look up",
  },
} as const;

export function DayLookup({ slug, lang = "it" }: { slug: string; lang?: "it" | "en" }) {
  const t = STR[lang];
  const router = useRouter();
  const { min, max } = dayLookupRange();
  const [date, setDate] = useState("");

  return (
    <section className="m3-card rise p-5">
      <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.title}</h2>
      <p className="text-sm text-on-surface-variant mb-4">{t.hint}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!date || date < min || date > max) return;
          const prefix = lang === "en" ? "/en" : "";
          router.push(`${prefix}/citta/${slug}/giorno/${date}`);
        }}
        className="flex flex-wrap gap-2 items-center"
      >
        <input
          type="date"
          value={date}
          min={min}
          max={max}
          required
          aria-label={t.label}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 min-w-[10rem] rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-4 py-2.5 font-medium text-on-surface"
        />
        <button
          type="submit"
          disabled={!date}
          className="m3-chip bg-primary text-on-primary px-5 disabled:opacity-50 shrink-0"
        >
          {t.cta}
        </button>
      </form>
    </section>
  );
}
