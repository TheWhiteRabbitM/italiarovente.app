// Posizione di una città nella classifica nazionale del riscaldamento, con i
// suoi vicini immediati. Serve al box "contesto di classifica" sulle pagine
// città (src/components/CityContext.tsx): dà topic authority e crea link
// interni verso le città vicine e la regione, invece di lasciare ogni pagina
// isolata. Nessun fetch: legge lo snapshot precalcolato, come il resto.

import { CITIES, type City } from "./cities";
import { getArchiveStats } from "./weather";

export type RankedCity = { slug: string; name: string; region: string; warming: number };

export type CityRanking = {
  rank: number; // 1 = si scalda più in fretta
  total: number; // città con dato disponibile
  warming: number;
  // Le città immediatamente sopra e sotto in classifica (per i link di
  // confronto). null ai due estremi.
  above: RankedCity | null;
  below: RankedCity | null;
  // Posizione dentro la propria regione (es. "2ª su 5 in Lombardia").
  regionRank: number;
  regionTotal: number;
};

let cache: RankedCity[] | null = null;

// Classifica nazionale completa, ordinata dal più caldo. Calcolata una volta.
function ranked(): RankedCity[] {
  if (cache) return cache;
  cache = CITIES.flatMap((c) => {
    const s = getArchiveStats(c);
    if (!s) return [];
    const warming = s.trend.recentNormal - s.trend.baselineMean;
    if (!Number.isFinite(warming)) return [];
    return [{ slug: c.slug, name: c.name, region: c.region, warming }];
  }).sort((a, b) => b.warming - a.warming);
  return cache;
}

export function getCityRanking(slug: string): CityRanking | null {
  const list = ranked();
  const i = list.findIndex((r) => r.slug === slug);
  if (i < 0) return null;

  const region = list[i].region;
  const inRegion = list.filter((r) => r.region === region); // già ordinata per warming
  const regionRank = inRegion.findIndex((r) => r.slug === slug) + 1;

  return {
    rank: i + 1,
    total: list.length,
    warming: list[i].warming,
    above: i > 0 ? list[i - 1] : null,
    below: i < list.length - 1 ? list[i + 1] : null,
    regionRank,
    regionTotal: inRegion.length,
  };
}

// Esposto per l'accessor nome inglese nel componente.
export type { City };
