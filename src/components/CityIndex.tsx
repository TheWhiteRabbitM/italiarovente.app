"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtAnomaly, anomalyColor, readableTextOn } from "@/lib/format";
import { useUnit } from "./UnitProvider";

export type CityIndexItem = {
  slug: string;
  name: string;
  region: string;
  zone: string;
  warming: number | null;
  perDecade: number | null;
  main: boolean;
};

const ZONES = ["Nord", "Centro", "Sud", "Isole"] as const;

const ZONE_LABELS = {
  it: { Nord: "Nord", Centro: "Centro", Sud: "Sud", Isole: "Isole" },
  en: { Nord: "North", Centro: "Central", Sud: "South", Isole: "Islands" },
} as const;

const STR = {
  it: {
    placeholder: "🔎 Cerca la tua città o regione…",
    all: "Tutte",
    cityCountSuffix: (n: number) => `${n} città`,
    resultCount: (n: number) => `${n} città trovat${n === 1 ? "a" : "e"}`,
    empty: (q: string) => `Nessuna città trovata per "${q}".`,
  },
  en: {
    placeholder: "🔎 Search your city or region…",
    all: "All",
    cityCountSuffix: (n: number) => `${n} ${n === 1 ? "city" : "cities"}`,
    resultCount: (n: number) => `${n} ${n === 1 ? "city" : "cities"} found`,
    empty: (q: string) => `No city found for "${q}".`,
  },
} as const;

function CityCardItem({ c, lang }: { c: CityIndexItem; lang: "it" | "en" }) {
  const { unit } = useUnit();
  const col = c.warming != null ? anomalyColor(c.warming, 1.5) : "var(--outline)";
  return (
    <Link
      href={`${lang === "en" ? "/en" : ""}/citta/${c.slug}`}
      className="m3-card m3-card-interactive p-3 flex items-center gap-3 group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
        style={{ background: col, color: c.warming != null ? readableTextOn(col) : "#241b16" }}
      >
        {c.warming != null ? fmtAnomaly(c.warming, 1, unit, { showUnit: false, locale: lang }) : "–"}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors">
          {c.name}
          {c.main && <span className="ml-1 text-[10px]">⭐</span>}
        </div>
        <div className="text-xs text-on-surface-variant truncate">{c.region}</div>
      </div>
    </Link>
  );
}

export function CityIndex({
  cities,
  lang = "it",
}: {
  cities: CityIndexItem[];
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<string>("");

  const byName = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name, "it")),
    [cities],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return byName.filter(
      (c) =>
        (!zone || c.zone === zone) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.region.toLowerCase().includes(needle)),
    );
  }, [byName, q, zone]);

  const grouped = !q.trim() && !zone;

  return (
    <div>
      {/* Controlli */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-5 py-3 font-semibold text-on-surface placeholder:text-on-surface-variant"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setZone("")}
            className={`m3-chip ${!zone ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"}`}
          >
            {t.all}
          </button>
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z === zone ? "" : z)}
              className={`m3-chip ${zone === z ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"}`}
            >
              {ZONE_LABELS[lang][z]}
            </button>
          ))}
        </div>
      </div>

      {grouped ? (
        // Raggruppate per zona, alfabetiche
        <div className="space-y-8">
          {ZONES.map((z) => {
            const list = byName.filter((c) => c.zone === z);
            if (!list.length) return null;
            return (
              <div key={z}>
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-xl font-extrabold tracking-tight">{ZONE_LABELS[lang][z]}</h2>
                  <span className="text-sm text-on-surface-variant">
                    {t.cityCountSuffix(list.length)}
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((c) => (
                    <CityCardItem key={c.slug} c={c} lang={lang} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Risultati filtrati (lista piatta)
        <>
          <p className="text-sm text-on-surface-variant mb-3">
            {t.resultCount(filtered.length)}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CityCardItem key={c.slug} c={c} lang={lang} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-on-surface-variant py-12">
              {t.empty(q)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
