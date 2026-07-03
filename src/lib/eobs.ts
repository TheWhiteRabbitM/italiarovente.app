// Layer dati E-OBS (Copernicus Climate Data Store) — cross-check indipendente
// da stazione, contro l'ERA5 (rianalisi) già usato da src/lib/weather.ts.
//
// STATO: licenza confermata da ECA&D (eca@knmi.nl, 2026-07-03) — uso non
// commerciale consentito a tre condizioni: progetto non commerciale, dati
// E-OBS grezzi mai ridistribuiti (solo medie annue), attribuzione presente
// (vedi EOBS_ATTRIBUTION in scripts/fetch-cds.mjs). src/data/eobs.json è
// generato da scripts/fetch-cds.mjs via un job Copernicus CDS schedulato
// mensilmente (.github/workflows/eobs-refresh.yml).

import eobsData from "@/data/eobs.json";

export type EobsMeta = {
  generatedAt: string | null;
  source: string;
  commit: string | null;
  status: "pending-license-clarification" | "confirmed";
  licenseConfirmedBy?: string;
  licenseConditions?: string[];
  attribution?: { it: string; en: string };
};

// Aggregato per-anno per una città, nello stesso spirito di YearlyPoint in
// weather.ts ma limitato a ciò che E-OBS offre come cross-check (media
// annua) — non un sostituto dell'intero CityArchive.
export type EobsYearlyPoint = {
  year: number;
  mean: number;
  count: number;
};

export type EobsCityData = {
  yearly: EobsYearlyPoint[];
} | null;

export type EobsDataset = {
  _meta: EobsMeta;
  [citySlug: string]: EobsCityData | EobsMeta;
};

const DATA = eobsData as unknown as Record<string, EobsCityData> & { _meta: EobsMeta };

// Fallback statico nel caso (non atteso in produzione) in cui _meta.attribution
// manchi nello snapshot — la citazione richiesta da ECA&D non deve mai sparire
// silenziosamente dalla UI.
const FALLBACK_ATTRIBUTION = {
  it: "Dati E-OBS: progetto UERRA (EU-FP6) e Copernicus Climate Change Service; fornitori dei dati: rete ECA&D (ecad.eu). Fonte: Cornes, R., G. van der Schrier, E.J.M. van den Besselaar, and P.D. Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation Datasets.",
  en: "E-OBS data: EU-FP6 project UERRA and the Copernicus Climate Change Service; data providers: the ECA&D project (ecad.eu). Source: Cornes, R., G. van der Schrier, E.J.M. van den Besselaar, and P.D. Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation Datasets.",
};

export type EobsComparison = {
  baselineMean: number; // normale 1961-1990, da E-OBS
  recentNormal: number; // normale 1991-2020, da E-OBS
  warming: number; // recentNormal - baselineMean
  baselineYears: number; // anni validi effettivamente disponibili nel periodo 1961-1990
  recentYears: number; // idem per 1991-2020
  attribution: { it: string; en: string };
};

const round = (v: number) => Math.round(v * 100) / 100;

/**
 * Confronto E-OBS per una città: stesso metodo "due normali trentennali"
 * usato ovunque sul sito per ERA5 (1991-2020 meno 1961-1990), applicato ai
 * dati E-OBS — stessa formula, fonte diversa. Ritorna `null` se la città non
 * è tra le 12 principali coperte da E-OBS, o se manca copertura sufficiente
 * in uno dei due periodi (mai una stima parziale spacciata per definitiva).
 */
export function getEobsComparison(citySlug: string): EobsComparison | null {
  const city = DATA[citySlug];
  if (!city || !city.yearly?.length) return null;

  const base = city.yearly.filter((y) => y.year >= 1961 && y.year <= 1990);
  const recent = city.yearly.filter((y) => y.year >= 1991 && y.year <= 2020);
  if (base.length < 20 || recent.length < 20) return null; // copertura insufficiente per una normale attendibile

  const baselineMean = round(base.reduce((s, y) => s + y.mean, 0) / base.length);
  const recentNormal = round(recent.reduce((s, y) => s + y.mean, 0) / recent.length);

  return {
    baselineMean,
    recentNormal,
    warming: round(recentNormal - baselineMean),
    baselineYears: base.length,
    recentYears: recent.length,
    attribution: DATA._meta?.attribution ?? FALLBACK_ATTRIBUTION,
  };
}
