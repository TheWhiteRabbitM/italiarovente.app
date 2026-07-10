// Lettura dell'archivio giornaliero della temperatura del mare
// (src/data/sea-history.json, generato al build da scripts/fetch-sea.mjs).
//
// LIMITE DA RISPETTARE SEMPRE: la serie inizia il 2022-11-24. Tre anni sono
// abbastanza per record assoluti *della serie*, per la stagionalità e per
// confrontare lo stesso giorno di anni diversi. NON sono abbastanza per una
// tendenza climatica: una regressione su 3 anni misura soprattutto il rumore
// interannuale. Qui dentro non esiste, di proposito, nessuna funzione che
// calcoli una pendenza — e non va aggiunta. Per il trend servono i dati
// dell'aria (ERA5, dal 1940), non questi.

import seaData from "@/data/sea-history.json";

export type SeaSeries = {
  start: string; // YYYY-MM-DD del primo elemento degli array
  mean: (number | null)[];
  max: (number | null)[];
  min: (number | null)[];
};

export type SeaHistoryMeta = {
  generatedAt: string;
  source: string;
  seriesStart: string;
  lastDate: string;
  commit: string | null;
  sha256?: string;
  note: string;
};

export type SeaDay = { date: string; mean: number; max: number; min: number };

const RAW = seaData as unknown as Record<string, SeaSeries | SeaHistoryMeta>;

export function getSeaHistoryMeta(): SeaHistoryMeta | null {
  const m = (RAW as Record<string, unknown>)._meta;
  return (m as SeaHistoryMeta) ?? null;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function seriesOf(slug: string): SeaSeries | null {
  const s = RAW[slug];
  if (!s || !("start" in s)) return null;
  return s;
}

// Giorni con dato completo (media, max e min presenti), dal più vecchio al più
// recente. I buchi della serie restano fuori invece di essere interpolati.
export function getSeaDays(slug: string): SeaDay[] {
  const s = seriesOf(slug);
  if (!s) return [];
  const out: SeaDay[] = [];
  for (let i = 0; i < s.mean.length; i++) {
    const mean = s.mean[i];
    const max = s.max[i];
    const min = s.min[i];
    if (mean == null || max == null || min == null) continue;
    out.push({ date: addDays(s.start, i), mean, max, min });
  }
  return out;
}

export type SeaStats = {
  slug: string;
  days: number;
  first: string;
  last: string;
  latest: SeaDay;
  // Estremi DELLA SERIE (dal 2022-11-24), non record storici assoluti: prima
  // di quella data semplicemente non abbiamo misure.
  warmest: SeaDay;
  coldest: SeaDay;
  // Lo stesso giorno del calendario negli anni precedenti: 2-3 valori, elencati
  // uno per uno. Con così pochi anni una "media storica del giorno" sarebbe un
  // numero fragile spacciato per normale climatica.
  sameDayPreviousYears: { year: number; mean: number }[];
};

export function getSeaStats(slug: string): SeaStats | null {
  const days = getSeaDays(slug);
  if (days.length < 30) return null;

  const latest = days[days.length - 1];
  let warmest = days[0];
  let coldest = days[0];
  for (const d of days) {
    if (d.max > warmest.max) warmest = d;
    if (d.min < coldest.min) coldest = d;
  }

  const mmdd = latest.date.slice(5);
  const latestYear = Number(latest.date.slice(0, 4));
  const sameDayPreviousYears = days
    .filter((d) => d.date.slice(5) === mmdd && Number(d.date.slice(0, 4)) < latestYear)
    .map((d) => ({ year: Number(d.date.slice(0, 4)), mean: d.mean }))
    .sort((a, b) => b.year - a.year);

  return {
    slug,
    days: days.length,
    first: days[0].date,
    last: latest.date,
    latest,
    warmest,
    coldest,
    sameDayPreviousYears,
  };
}

// Ultimi N giorni di media, per una sparkline. Restituisce solo i valori: la
// sparkline non ha assi, le date non servirebbero a nulla.
export function getSeaRecentMeans(slug: string, days = 365): number[] {
  const all = getSeaDays(slug);
  return all.slice(-days).map((d) => d.mean);
}
