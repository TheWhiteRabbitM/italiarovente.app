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

const DATA = eobsData as unknown as EobsDataset;

/**
 * Ritorna i dati E-OBS di cross-check per una città, se disponibili.
 *
 * Oggi ritorna sempre `null`: non esiste ancora nessun dato E-OBS reale (vedi
 * lo stato "pending-license-clarification" in `_meta`), e questa funzione non
 * è ancora richiamata da nessuna pagina/componente. Quando i dati saranno
 * disponibili, questa funzione andrà aggiornata per leggere effettivamente
 * `DATA[citySlug]` — l'implementazione attuale è un puro stub.
 */
export function getEobsComparison(citySlug: string): EobsCityData {
  void citySlug;
  void DATA;
  return null;
}
