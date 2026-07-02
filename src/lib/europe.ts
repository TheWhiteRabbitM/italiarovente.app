// Dataset europeo statico (src/data/europe.json, generato UNA TANTUM da
// scripts/fetch-europe.mjs) per la pagina di confronto Italia vs Europa.
// Il file parte VUOTO ({}) finché lo script non viene eseguito: tutto il
// codice a valle deve quindi reggere l'assenza di dati senza rompersi.

import europeData from "@/data/europe.json";

export type EuroCity = {
  slug: string;
  nameIt: string; // "Londra"
  nameEn: string; // "London"
  country: string; // bandiera emoji, es. "🇬🇧"
  yearly: { y: number; m: number }[]; // medie annue (solo anni completi), ~1940–2025
  baseline: number | null; // normale 1961–1990
  recentNormal: number | null; // normale 1991–2020
};

// `as` necessario: il JSON committato inizia come {} e TypeScript ne
// inferirebbe il tipo vuoto. La guardia runtime filtra le voci incomplete
// (fetch parziali o file ancora vuoto) così la UI vede solo città valide.
export const EURO_CITIES: EuroCity[] = Object.values(
  europeData as Record<string, EuroCity>,
).filter(
  (c) =>
    Array.isArray(c?.yearly) &&
    c.yearly.length > 0 &&
    c.baseline != null &&
    c.recentNormal != null,
);

export function euroName(c: EuroCity, lang: "it" | "en" = "it"): string {
  return lang === "en" ? c.nameEn : c.nameIt;
}

// Stesso metodo "a due trentenni" (1991–2020 vs 1961–1990) usato ovunque sul
// sito: è ciò che rende il confronto con le città italiane scientificamente
// corretto. Le voci in EURO_CITIES hanno entrambe le normali non nulle
// (garantito dal filtro sopra), quindi il fallback a 0 non scatta mai.
export function euroWarming(c: EuroCity): number {
  return (c.recentNormal ?? 0) - (c.baseline ?? 0);
}
