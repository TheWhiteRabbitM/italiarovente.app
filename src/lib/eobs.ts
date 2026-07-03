// Layer dati E-OBS (Copernicus Climate Data Store) — cross-check indipendente
// da stazione, contro l'ERA5 (rianalisi) già usato da src/lib/weather.ts.
//
// STATO: NON ANCORA IN PRODUZIONE. La licenza E-OBS restringe l'uso a
// "non-commercial research and non-commercial education projects only"; è in
// corso una richiesta di chiarimento a ECA&D (eca@knmi.nl) sull'idoneità di
// italiarovente.app (gratuito, senza pubblicità, MIT/open source, senza
// ricavi). Finché non arriva una risposta, src/data/eobs.json contiene solo
// una struttura placeholder (tutte le città a `null`) generata da
// scripts/fetch-cds.mjs, che a sua volta si rifiuta di chiamare l'API CDS
// reale finché i suoi parametri restano marcati "UNVERIFIED".
//
// Questo modulo NON è collegato a nessuna UI: getEobsComparison() esiste solo
// perché il codice chiamante futuro abbia già una firma stabile a cui
// agganciarsi quando (e se) i dati diventeranno reali.

import eobsData from "@/data/eobs.json";

export type EobsMeta = {
  generatedAt: string | null;
  source: string;
  commit: string | null;
  status: "pending-license-clarification" | "active";
};

// Aggregato per-anno per una città, nello stesso spirito di YearlyPoint in
// weather.ts ma limitato a ciò che E-OBS offre come cross-check (media
// annua) — non un sostituto dell'intero CityArchive.
export type EobsYearlyPoint = {
  year: number;
  mean: number;
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
