"use client";

import Link from "next/link";
import { fmtAnomaly, fmtTemp } from "@/lib/format";
import { useUnit } from "./UnitProvider";
import type { EobsComparison } from "@/lib/eobs";

const STR = {
  it: {
    title: "🔍 Confronto con le stazioni meteo",
    intro:
      "Tutti i numeri di questa pagina vengono dalla rianalisi ERA5 — un modello fisico che integra dati satellitari e da stazione. Qui confrontiamo lo stesso calcolo (normale 1991–2020 meno normale 1961–1990) applicato a una fonte diversa e indipendente: E-OBS, costruito solo da osservazioni dirette delle stazioni meteo europee (progetto ECA&D/Copernicus), non da un modello.",
    era5Label: "ERA5 (usato in tutto il sito)",
    eobsLabel: "E-OBS (stazioni a terra)",
    warmingLabel: "riscaldamento",
    agreeNote: (era5: string, eobs: string) => (
      <>
        Le due fonti concordano sul fatto che il riscaldamento sia reale: {era5} secondo ERA5, {eobs} secondo E-OBS.
      </>
    ),
    diffNote:
      "Non aspettarti che i due numeri coincidano esattamente: sono calcolati con metodi diversi (modello vs osservazioni dirette), risoluzioni diverse e reti di stazioni diverse — una differenza di qualche decimo di grado è normale, non un errore. Quello che conta è che nessuna delle due fonti smentisce l'altra sulla direzione del cambiamento.",
    coverageNote: (baseYears: number, recentYears: number) =>
      `Normale E-OBS 1961–1990 calcolata su ${baseYears} anni disponibili, normale 1991–2020 su ${recentYears}.`,
    attributionLabel: "Fonte E-OBS",
    moreInfo: "Perché due fonti possono dare numeri leggermente diversi →",
  },
  en: {
    title: "🔍 Cross-check with weather stations",
    intro:
      "Every number on this page comes from the ERA5 reanalysis — a physical model that blends satellite and station data. Here we apply the exact same calculation (1991–2020 normal minus 1961–1990 normal) to a different, independent source: E-OBS, built solely from direct European weather-station observations (ECA&D/Copernicus project), not a model.",
    era5Label: "ERA5 (used throughout the site)",
    eobsLabel: "E-OBS (ground stations)",
    warmingLabel: "warming",
    agreeNote: (era5: string, eobs: string) => (
      <>
        Both sources agree the warming is real: {era5} according to ERA5, {eobs} according to E-OBS.
      </>
    ),
    diffNote:
      "Don't expect the two numbers to match exactly: they're computed with different methods (model vs. direct observations), different resolutions, and different station networks — a difference of a few tenths of a degree is normal, not an error. What matters is that neither source contradicts the other on the direction of change.",
    coverageNote: (baseYears: number, recentYears: number) =>
      `E-OBS 1961–1990 normal computed on ${baseYears} available years, 1991–2020 normal on ${recentYears}.`,
    attributionLabel: "E-OBS source",
    moreInfo: "Why can two sources give slightly different numbers? →",
  },
} as const;

export function EobsCrossCheck({
  eobs,
  era5Warming,
  lang = "it",
}: {
  eobs: EobsComparison;
  era5Warming: number;
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  const t = STR[lang];

  return (
    <section className="m3-card rise p-5 sm:p-6 mb-6">
      <h3 className="text-xl font-extrabold tracking-tight">{t.title}</h3>
      <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{t.intro}</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl bg-surface-container-high p-4">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
            {t.era5Label}
          </div>
          <div className="text-xl font-extrabold tracking-tight" style={{ color: "var(--primary)" }}>
            {fmtAnomaly(era5Warming, 2, unit, { locale: lang })}
          </div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">{t.warmingLabel}</div>
        </div>
        <div className="rounded-2xl bg-surface-container-high p-4">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
            {t.eobsLabel}
          </div>
          <div className="text-xl font-extrabold tracking-tight" style={{ color: "var(--secondary)" }}>
            {fmtAnomaly(eobs.warming, 2, unit, { locale: lang })}
          </div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">{t.warmingLabel}</div>
        </div>
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed mt-4">
        {t.agreeNote(fmtAnomaly(era5Warming, 2, unit, { locale: lang }), fmtAnomaly(eobs.warming, 2, unit, { locale: lang }))}
      </p>
      <p className="text-xs text-on-surface-variant leading-relaxed mt-2">{t.diffNote}</p>

      <div className="text-xs text-on-surface-variant mt-4 pt-3 border-t border-[var(--outline-variant)] space-y-1">
        <p>
          {t.coverageNote(eobs.baselineYears, eobs.recentYears)} · E-OBS{" "}
          {fmtTemp(eobs.baselineMean, 1, unit)} → {fmtTemp(eobs.recentNormal, 1, unit)}
        </p>
        <p>
          <strong>{t.attributionLabel}:</strong> {eobs.attribution[lang]}
        </p>
        <p>
          <Link
            href={lang === "en" ? "/en/disclaimer" : "/disclaimer"}
            className="text-secondary font-semibold hover:underline"
          >
            {t.moreInfo}
          </Link>
        </p>
      </div>
    </section>
  );
}
