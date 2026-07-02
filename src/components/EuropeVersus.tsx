"use client";

import { useMemo, useState } from "react";
import { AnomalyCompareChart } from "./charts";
import { fmtAnomaly, fmtTemp } from "@/lib/format";
import { useUnit } from "./UnitProvider";
import { cityDisplayName } from "@/lib/cities";
import { euroName, type EuroCity } from "@/lib/europe";

// Dataset appiattito passabile al client (stessa forma di LifeCity in
// src/lib/lifetime.ts): la pagina server lo costruisce da getLifetimeData().
export type VersusItCity = {
  slug: string;
  name: string;
  baseline: number;
  recentNormal: number;
  years: { y: number; m: number }[];
};

const STR = {
  it: {
    title: "Testa a testa Italia–Europa ⚔️",
    subtitle:
      "Scegli una città italiana e una capitale europea: stesso dataset ERA5 e stesso metodo (normale 1991–2020 vs 1961–1990) per entrambe.",
    vs: "vs",
    winnerWarmed: "🔥 si è scaldata di più",
    winnerCooled: "❄️ si è raffreddata meno",
    locale: "it" as const,
  },
  en: {
    title: "Italy–Europe head to head ⚔️",
    subtitle:
      "Pick an Italian city and a European capital: same ERA5 dataset and same method (1991–2020 normal vs 1961–1990) for both.",
    vs: "vs",
    winnerWarmed: "🔥 warmed more",
    winnerCooled: "❄️ cooled less",
    locale: "en" as const,
  },
} as const;

export function EuropeVersus({
  itCities,
  euroCities,
  lang = "it",
}: {
  itCities: VersusItCity[];
  euroCities: EuroCity[];
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const { unit } = useUnit();

  // "italia" (media nazionale sintetica) resta come prima voce; le altre
  // città in ordine alfabetico italiano, come nel resto del sito.
  const itList = useMemo(() => {
    const withData = itCities.filter((c) => c.years.length);
    const italia = withData.filter((c) => c.slug === "italia");
    const rest = withData
      .filter((c) => c.slug !== "italia")
      .sort((a, b) => a.name.localeCompare(b.name, "it"));
    return [...italia, ...rest];
  }, [itCities]);
  const euroList = useMemo(
    () =>
      [...euroCities].sort((a, b) =>
        euroName(a, lang).localeCompare(euroName(b, lang), lang),
      ),
    [euroCities, lang],
  );

  const [itSlug, setItSlug] = useState("roma");
  const [euSlug, setEuSlug] = useState("parigi");

  // Dati europei ancora assenti (europe.json vuoto): niente da confrontare,
  // la pagina mostra già la sua card di fallback al posto di questa sezione.
  if (!itList.length || !euroList.length) return null;

  const it = itList.find((c) => c.slug === itSlug) ?? itList[0];
  const eu = euroList.find((c) => c.slug === euSlug) ?? euroList[0];

  // Stesso metodo "a due trentenni" di CityVersus: mai una media degli
  // ultimi anni, che darebbe un numero diverso dal resto del sito.
  const itWarming = it.recentNormal - it.baseline;
  const euBaseline = eu.baseline ?? 0;
  const euRecent = eu.recentNormal ?? 0;
  const euWarming = euRecent - euBaseline;

  const itName = cityDisplayName(it.slug, it.name, lang);
  const euName = euroName(eu, lang);

  const series = [
    {
      name: `${itName} 🇮🇹`,
      data: it.years.map((y) => ({ year: y.y, anomaly: y.m - it.baseline })),
    },
    {
      name: `${euName} ${eu.country}`,
      data: eu.yearly.map((y) => ({ year: y.y, anomaly: y.m - euBaseline })),
    },
  ];

  const itWins = itWarming >= euWarming;
  const winnerWarming = itWins ? itWarming : euWarming;
  // Token del tema, non hex fissi: leggibili in entrambi i temi (come in
  // CityVersus.tsx).
  const winnerColor = winnerWarming >= 0 ? "var(--primary)" : "var(--secondary)";
  const winnerBadge = winnerWarming >= 0 ? t.winnerWarmed : t.winnerCooled;

  const cards = [
    { key: "it", flag: "🇮🇹", name: itName, warming: itWarming, from: it.baseline, to: it.recentNormal, winner: itWins },
    { key: "eu", flag: eu.country, name: euName, warming: euWarming, from: euBaseline, to: euRecent, winner: !itWins },
  ];

  const selectCls =
    "w-full rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-4 py-2.5 font-bold text-on-surface cursor-pointer";

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.title}</h2>
      <p className="text-sm text-on-surface-variant mb-4">{t.subtitle}</p>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <select
          value={it.slug}
          onChange={(e) => setItSlug(e.target.value)}
          className={selectCls}
        >
          {itList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {cityDisplayName(c.slug, c.name, lang)}
            </option>
          ))}
        </select>
        <span className="font-extrabold text-on-surface-variant">{t.vs}</span>
        <select
          value={eu.slug}
          onChange={(e) => setEuSlug(e.target.value)}
          className={selectCls}
        >
          {euroList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {euroName(c, lang)} {c.country}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl bg-surface-container-high p-4 relative overflow-hidden"
            style={c.winner ? { outline: `2px solid ${winnerColor}` } : undefined}
          >
            <div className="font-extrabold">
              {c.name} {c.flag}
            </div>
            <div
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: c.warming >= 0 ? "var(--primary)" : "var(--secondary)" }}
            >
              {fmtAnomaly(c.warming, 1, unit, { locale: t.locale })}
            </div>
            <div className="text-xs text-on-surface-variant">
              {/* Normali assolute: fmtTemp (cToF), mai deltaCtoF */}
              1961–1990 {fmtTemp(c.from, 1, unit)} → 1991–2020 {fmtTemp(c.to, 1, unit)}
            </div>
            {c.winner && (
              <div className="text-xs font-bold mt-1" style={{ color: winnerColor }}>
                {winnerBadge}
              </div>
            )}
          </div>
        ))}
      </div>

      <AnomalyCompareChart series={series} lang={lang} />
    </section>
  );
}
