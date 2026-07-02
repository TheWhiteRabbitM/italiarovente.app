"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { LifetimeData } from "@/lib/lifetime";
import { AnomalyCompareChart } from "./charts";
import { ShareButtons } from "./ShareButtons";
import { fmtAnomaly } from "@/lib/format";
import { useUnit } from "./UnitProvider";
import { getCity, cityName as cityNameOf } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";

const ZONES_IT = ["Nord", "Centro", "Sud", "Isole"] as const;
const ZONES_EN = ["North", "Central", "South", "Islands"] as const;

const STR = {
  it: {
    title: "Testa a testa ⚔️",
    subtitle:
      "Scegli due città e confronta come è cambiata la temperatura (normale 1991–2020 vs 1961–1990) — in più o in meno.",
    vs: "vs",
    recordYear: (y: number) => `anno record: ${y}`,
    winnerWarmed: "🔥 si è scaldata di più",
    winnerCooled: "❄️ si è raffreddata meno",
    challenge: "🔥 Sfida un amico",
    shareText: (name: string, warming: string) =>
      `${name} ${warming} dal 1961–1990. La tua città ha fatto meglio o peggio? Confrontala su Italia Rovente`,
    zones: ZONES_IT,
    zoneLabels: ZONES_IT,
    locale: "it" as const,
  },
  en: {
    title: "Head to head ⚔️",
    subtitle:
      "Pick two cities and compare how their temperature has changed (1991–2020 normal vs 1961–1990) — up or down.",
    vs: "vs",
    recordYear: (y: number) => `record year: ${y}`,
    winnerWarmed: "🔥 warmed more",
    winnerCooled: "❄️ cooled less",
    challenge: "🔥 Challenge a friend",
    shareText: (name: string, warming: string) =>
      `${name} ${warming} since 1961–1990. Did your city do better or worse? Compare it on Italia Rovente`,
    zones: ZONES_IT,
    zoneLabels: ZONES_EN,
    locale: "en" as const,
  },
} as const;

export function CityVersus({
  data,
  lang = "it",
}: {
  data: LifetimeData;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const { unit } = useUnit();
  // LifeCity porta solo slug/name (dataset appiattito per il client): il
  // nome inglese, quando esiste, va risolto tramite la City completa
  // (src/data/cities.json) via slug — stesso esonimo usato ovunque sul sito.
  const displayName = (c: { slug: string; name: string }) => {
    const full = getCity(c.slug);
    return full ? cityNameOf(full, lang) : c.name;
  };
  const cities = useMemo(
    () =>
      data.cities
        .filter((c) => c.slug !== "italia" && c.years.length)
        .sort((a, b) => a.name.localeCompare(b.name, "it")),
    [data],
  );
  // Un link "?vs=roma" precarica Roma come città A — è il meccanismo dietro
  // "Sfida un amico": chi riceve il link vede subito il confronto e sceglie
  // solo la propria città.
  const searchParams = useSearchParams();
  const preset = searchParams.get("vs");
  const [aSlug, setA] = useState(() =>
    preset && cities.some((c) => c.slug === preset) ? preset : "roma",
  );
  const [bSlug, setB] = useState("milano");

  const a = cities.find((c) => c.slug === aSlug) ?? cities[0];
  const b = cities.find((c) => c.slug === bSlug) ?? cities[1];

  const stat = (c: (typeof cities)[number]) => {
    const anoms = c.years.map((y) => ({ year: y.y, anomaly: y.m - c.baseline }));
    // Stesso metodo "a due trentenni" (1991-2020 vs 1961-1990) usato ovunque
    // sul sito: mai una media degli ultimi anni, che darebbe un numero
    // diverso da quello mostrato sulla pagina della stessa città.
    const warming = c.recentNormal - c.baseline;
    const warmestYear = [...c.years].sort((x, y) => y.m - x.m)[0]?.y;
    return { anoms, warming, warmestYear };
  };
  const sa = stat(a);
  const sb = stat(b);
  const series = [
    { name: displayName(a), data: sa.anoms },
    { name: displayName(b), data: sb.anoms },
  ];
  const winner = sa.warming >= sb.warming ? a : b;
  const winnerWarming = winner.slug === a.slug ? sa.warming : sb.warming;
  // Token del tema, non hex fissi: leggibili in entrambi i temi (i rossi/blu
  // "da grafico" non hanno contrasto garantito su sfondo scuro).
  const winnerColor = winnerWarming >= 0 ? "var(--primary)" : "var(--secondary)";
  const winnerBadge = winnerWarming >= 0 ? t.winnerWarmed : t.winnerCooled;

  const Select = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-4 py-2.5 font-bold text-on-surface cursor-pointer"
    >
      {t.zones.map((z, zi) => {
        const list = cities.filter((c) => c.zone === z);
        if (!list.length) return null;
        return (
          <optgroup key={z} label={t.zoneLabels[zi]}>
            {list.map((c) => (
              <option key={c.slug} value={c.slug}>
                {displayName(c)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-1">
        {t.title}
      </h2>
      <p className="text-sm text-on-surface-variant mb-4">
        {t.subtitle}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <Select value={aSlug} onChange={setA} />
        <span className="font-extrabold text-on-surface-variant">{t.vs}</span>
        <Select value={bSlug} onChange={setB} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { c: a, s: sa },
          { c: b, s: sb },
        ].map(({ c, s }) => (
          <div
            key={c.slug}
            className="rounded-2xl bg-surface-container-high p-4 relative overflow-hidden"
            style={winner.slug === c.slug ? { outline: `2px solid ${winnerColor}` } : undefined}
          >
            <div className="font-extrabold">{displayName(c)}</div>
            <div
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: s.warming >= 0 ? "var(--primary)" : "var(--secondary)" }}
            >
              {fmtAnomaly(s.warming, 1, unit, { locale: t.locale })}
            </div>
            <div className="text-xs text-on-surface-variant">
              {t.recordYear(s.warmestYear)}
            </div>
            {winner.slug === c.slug && (
              <div className="text-xs font-bold mt-1" style={{ color: winnerColor }}>
                {winnerBadge}
              </div>
            )}
          </div>
        ))}
      </div>

      <AnomalyCompareChart series={series} lang={lang} />

      <div className="mt-5 pt-5 border-t border-[var(--outline-variant)]">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3 text-center">
          {t.challenge}
        </p>
        <ShareButtons
          url={`${SITE_URL}/confronto?vs=${a.slug}`}
          text={t.shareText(displayName(a), fmtAnomaly(sa.warming, 1, unit, { locale: t.locale }))}
          storyUrl={`/condividi/${a.slug}/story${lang === "en" ? "?lang=en" : ""}`}
          downloadName={`italia-rovente-${a.slug}.png`}
          lang={lang}
        />
      </div>
    </section>
  );
}
