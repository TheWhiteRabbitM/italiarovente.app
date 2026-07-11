"use client";

import { useEffect, useState } from "react";

type Counter = { confirm: number; deny: number; hot: number; cold: number };
const ZONES = ["Nord", "Centro", "Sud", "Isole"] as const;

// Etichette DISPLAY per zona: le chiavi dati (Nord/Centro/Sud/Isole) restano
// invariate — sono identificatori usati altrove (filtri, API) — qui si
// traduce solo il testo mostrato.
const ZONE_LABEL: Record<(typeof ZONES)[number], { it: string; en: string }> = {
  Nord: { it: "Nord", en: "North" },
  Centro: { it: "Centro", en: "Central" },
  Sud: { it: "Sud", en: "South" },
  Isole: { it: "Isole", en: "Islands" },
};

const STR = {
  it: {
    title: "Il termometro del pubblico",
    subtitle: "voti in tempo reale per zona d'Italia",
    loading: "Caricamento…",
    counts: (cTot: number, fTot: number) =>
      `${cTot} voti sulla temperatura · ${fTot} sulla sensazione`,
    note: "Solo i voti espressi da una pagina città: quelli dalla homepage (senza città) non hanno una zona e restano fuori da questa ripartizione.",
    feeling: "Sensazione",
    correctTemp: "Temperatura corretta",
    yes: (pct: number) => `${pct}% sì`,
    noData: "—",
    totalVotes: (n: number) => `${n} ${n === 1 ? "voto" : "voti"} in zona`,
  },
  en: {
    title: "The public thermometer",
    subtitle: "real-time votes by Italian region",
    loading: "Loading…",
    counts: (cTot: number, fTot: number) =>
      `${cTot} votes on temperature · ${fTot} on how it feels`,
    note: "Only votes cast from a city page: those from the homepage (no city) have no region and stay out of this breakdown.",
    feeling: "How it feels",
    correctTemp: "Temperature accurate",
    yes: (pct: number) => `${pct}% yes`,
    noData: "—",
    totalVotes: (n: number) => `${n} ${n === 1 ? "vote" : "votes"} here`,
  },
} as const;

export function ZoneStats({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [byZone, setByZone] = useState<Record<string, Counter> | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((s) => setByZone(s.byZone ?? {}))
      .catch(() => {});
  }, []);

  // I conteggi dell'intestazione sommano SOLO le zone, non il total globale:
  // quest'ultimo include i voti nazionali (senza città → senza zona), che qui
  // non hanno una colonna. Sommare le zone rende l'intestazione coerente con
  // ciò che le card mostrano davvero.
  const zoneSum = ZONES.reduce(
    (acc, z) => {
      const c = byZone?.[z];
      if (c) {
        acc.feel += c.hot + c.cold;
        acc.conf += c.confirm + c.deny;
      }
      return acc;
    },
    { feel: 0, conf: 0 },
  );

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t.title}
        </h2>
        <span className="text-xs text-on-surface-variant">
          {t.subtitle}
        </span>
      </div>
      <p className="text-sm text-on-surface-variant mb-1">
        {byZone ? t.counts(zoneSum.conf, zoneSum.feel) : t.loading}
      </p>
      <p className="text-xs text-on-surface-variant mb-5">{t.note}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ZONES.map((z) => {
          const c = byZone?.[z] ?? { confirm: 0, deny: 0, hot: 0, cold: 0 };
          const feel = c.hot + c.cold;
          const conf = c.confirm + c.deny;
          // null = nessun voto: mostra "—" invece di un 50/50 o 0% inventato.
          const hotPct = feel ? Math.round((c.hot / feel) * 100) : null;
          const confPct = conf ? Math.round((c.confirm / conf) * 100) : null;
          return (
            <div key={z} className="rounded-2xl bg-surface-container-high p-4">
              <div className="font-extrabold mb-2">{ZONE_LABEL[z][lang]}</div>
              <div className="text-xs font-semibold text-on-surface-variant mb-1">
                {t.feeling}
              </div>
              {hotPct !== null ? (
                <>
                  <div className="flex h-5 rounded-full overflow-hidden bg-surface-container mb-1">
                    <div style={{ width: `${hotPct}%`, background: "#f97316" }} />
                    <div className="flex-1" style={{ background: "#0891b2" }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span style={{ color: "#f97316" }}>🥵 {hotPct}%</span>
                    <span style={{ color: "#0891b2" }}>{100 - hotPct}% 🥶</span>
                  </div>
                </>
              ) : (
                <div className="text-lg font-extrabold text-on-surface-variant">{t.noData}</div>
              )}
              <div className="text-xs font-semibold text-on-surface-variant mt-3">
                {t.correctTemp}
              </div>
              <div
                className="text-lg font-extrabold"
                style={confPct === null ? undefined : { color: confPct >= 50 ? "#2563eb" : "#ef4444" }}
              >
                {confPct !== null ? t.yes(confPct) : t.noData}
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {t.totalVotes(feel + conf)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
