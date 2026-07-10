// "Bollettino mensile": risponde alle stesse domande dei comunicati Copernicus
// ("giugno più caldo mai registrato"), ma calcolate da noi e solo per l'Italia.
// Usa monthlySeries (media di ogni singolo anno-mese), distinta dalla
// climatologia in MonthlyClim (media dell'intera serie), perché il ranking
// richiede il valore anno per anno.
//
// Baseline: la normale 1961-1990 dello STESSO mese (non la media dell'intera
// serie), coerente con il resto del sito — warming stripes, Verdetto, anomalie
// annue usano tutti quel trentennio come riferimento.
import { CITIES, cityName, type City } from "./cities";
import { getArchiveStats } from "./weather";
import type { MonthlySeriesPoint } from "./weather";

// Giorni minimi nel mese perché la sua media sia considerata abbastanza
// completa (mai un mese ancora in corso spacciato per concluso — stessa
// cautela della recap mensile in api/refresh).
const MIN_DAYS = 24;
// Sotto questa soglia di anni storici per lo stesso mese, un "record" non
// avrebbe abbastanza campione per essere onesto: meglio non affermarlo.
const MIN_YEARS_FOR_RANK = 15;
// Anni minimi dentro il trentennio 1961-1990 perché la normale di quel mese
// sia rappresentativa.
const MIN_BASELINE_YEARS = 20;

export const BASELINE_FROM = 1961;
export const BASELINE_TO = 1990;

export type MonthlyHighlight = {
  year: number;
  month: number; // 1-12
  value: number;
  normal: number; // normale 1961-1990 dello stesso mese
  anomaly: number;
  rank: number; // 1 = il più estremo (caldo o freddo) mai registrato per quel mese
  total: number;
  sinceYear: number;
  direction: "hot" | "cold";
  // Quante unità hanno prodotto `value`: giorni validi per una città, città
  // per la serie nazionale. Serve a dichiarare in pagina su cosa poggia il numero.
  contributors: number;
};

export type MonthYearPoint = { year: number; mean: number; anomaly: number };

export type CityMonthRow = {
  slug: string;
  name: string;
  mean: number;
  anomaly: number;
  rank: number;
  total: number;
};

export type MonthlyBulletin = {
  national: MonthlyHighlight;
  // Tutti gli anni per lo stesso mese di calendario, in ordine cronologico:
  // la serie dietro alle "strisce" e alla classifica.
  series: MonthYearPoint[];
  cities: CityMonthRow[];
};

export function ordinalIt(n: number): string {
  return `${n}°`;
}
export function ordinalEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

type Pt = { year: number; month: number; mean: number; count: number };

// Normale 1961-1990 di un dato mese di calendario. null se il trentennio non
// ha abbastanza anni validi: senza baseline non pubblichiamo un'anomalia.
export function monthNormal(series: Pt[], month: number, minDays = MIN_DAYS): number | null {
  const base = series.filter(
    (s) => s.month === month && s.count >= minDays && s.year >= BASELINE_FROM && s.year <= BASELINE_TO,
  );
  if (base.length < MIN_BASELINE_YEARS) return null;
  return base.reduce((s, x) => s + x.mean, 0) / base.length;
}

// L'ultimo anno-mese abbastanza completo presente nella serie: mai il mese in
// corso se ancora a metà.
function latestComplete(series: Pt[], minDays: number): Pt | null {
  const complete = series.filter((s) => s.count >= minDays);
  if (!complete.length) return null;
  return complete.reduce((a, b) => (b.year * 100 + b.month > a.year * 100 + a.month ? b : a));
}

// Le medie per città nello snapshot hanno 2 decimali: la media nazionale che
// se ne ricava non è difendibile oltre quella precisione. Quindi pubblichiamo
// 2 decimali e classifichiamo SU QUEL VALORE, non sul float grezzo. Due mesi
// che mostrano la stessa anomalia condividono il posto (2°, 2°, 4°): dire che
// uno precede l'altro per 0,003°C sarebbe una differenza inventata
// dall'arrotondamento a monte, e a schermo sembrerebbe un ordine arbitrario.
export const PUBLISHED_DECIMALS = 2;
export function publishedAnomaly(a: number): number {
  const f = 10 ** PUBLISHED_DECIMALS;
  return Math.round(a * f) / f;
}

// Posto in classifica "dal più caldo", a pari merito (competition ranking):
// quanti mesi sono strettamente più caldi di questo, più uno.
export function hotRank(anomalies: number[], target: number): number {
  const t = publishedAnomaly(target);
  return 1 + anomalies.filter((a) => publishedAnomaly(a) > t).length;
}

// Rango dell'anno `year` fra tutti gli anni dello stesso mese. Sceglie la
// direzione (caldo/freddo) più notevole delle due: 2° più caldo su 87 è una
// notizia, 86° più freddo su 87 è lo stesso fatto detto peggio.
function rankOf(values: { year: number; anomaly: number }[], year: number) {
  if (values.length < MIN_YEARS_FOR_RANK) return null;
  const target = values.find((v) => v.year === year);
  if (!target) return null;
  const anomalies = values.map((v) => v.anomaly);
  const t = publishedAnomaly(target.anomaly);
  const hot = 1 + anomalies.filter((a) => publishedAnomaly(a) > t).length;
  const cold = 1 + anomalies.filter((a) => publishedAnomaly(a) < t).length;
  return hot <= cold
    ? { rank: hot, total: values.length, direction: "hot" as const }
    : { rank: cold, total: values.length, direction: "cold" as const };
}

function buildHighlight(series: Pt[], minDays: number): MonthlyHighlight | null {
  const latest = latestComplete(series, minDays);
  if (!latest) return null;
  const normal = monthNormal(series, latest.month, minDays);
  if (normal === null) return null;
  const sameMonth = series.filter((s) => s.month === latest.month && s.count >= minDays);
  const r = rankOf(
    sameMonth.map((s) => ({ year: s.year, anomaly: s.mean - normal })),
    latest.year,
  );
  if (!r) return null;
  return {
    year: latest.year,
    month: latest.month,
    value: latest.mean,
    normal,
    anomaly: latest.mean - normal,
    rank: r.rank,
    total: r.total,
    sinceYear: Math.min(...sameMonth.map((s) => s.year)),
    direction: r.direction,
    contributors: latest.count,
  };
}

// Ranking di una singola città: confronta il suo ultimo mese completo con
// tutti i suoi omologhi (stesso mese, anni diversi) nella sua serie storica.
export function cityMonthlyHighlight(
  monthlySeries: MonthlySeriesPoint[] | undefined,
): MonthlyHighlight | null {
  if (!monthlySeries?.length) return null;
  return buildHighlight(monthlySeries, MIN_DAYS);
}

// Serie nazionale anno-mese: media fra le città che hanno il dato per
// quell'anno-mese. Un anno-mese entra solo se coperto da almeno metà delle
// città con serie mensile disponibile — stessa convenzione di /clima e
// getLifetimeData, che dividono per il numero di città CON dati, non per le
// 107 nominali (lo snapshot si popola progressivamente, build dopo build).
let seriesCache: Pt[] | undefined;
function nationalSeries(): Pt[] {
  if (seriesCache) return seriesCache;
  const byKey = new Map<string, { s: number; n: number; year: number; month: number }>();
  let covered = 0;
  for (const c of CITIES) {
    const snap = getArchiveStats(c);
    if (!snap?.monthlySeries?.length) continue;
    covered += 1;
    for (const m of snap.monthlySeries) {
      if (m.count < MIN_DAYS) continue;
      const key = `${m.year}-${m.month}`;
      const e = byKey.get(key) ?? { s: 0, n: 0, year: m.year, month: m.month };
      e.s += m.mean;
      e.n += 1;
      byKey.set(key, e);
    }
  }
  const half = Math.ceil(covered / 2);
  seriesCache = [...byKey.values()]
    .filter((e) => e.n >= half)
    .map((e) => ({ year: e.year, month: e.month, mean: e.s / e.n, count: e.n }))
    .sort((a, b) => a.year - b.year || a.month - b.month);
  return seriesCache;
}

let nationalCache: MonthlyHighlight | null | undefined;

export function nationalMonthlyHighlight(): MonthlyHighlight | null {
  if (nationalCache !== undefined) return nationalCache;
  // count qui è il numero di CITTÀ, non di giorni: la soglia giorni è già
  // stata applicata a monte, città per città.
  nationalCache = buildHighlight(nationalSeries(), 1);
  return nationalCache;
}

let bulletinCache: MonthlyBulletin | null | undefined;

// Il bollettino completo dell'ultimo mese concluso: il dato nazionale, la
// serie storica dello stesso mese di calendario (per strisce e classifica) e
// la scomposizione città per città.
export function getMonthlyBulletin(): MonthlyBulletin | null {
  if (bulletinCache !== undefined) return bulletinCache;

  const national = nationalMonthlyHighlight();
  if (!national) {
    bulletinCache = null;
    return null;
  }
  const { month } = national;
  const nat = nationalSeries();
  const normal = national.normal;

  const series: MonthYearPoint[] = nat
    .filter((s) => s.month === month)
    .map((s) => ({ year: s.year, mean: s.mean, anomaly: s.mean - normal }))
    .sort((a, b) => a.year - b.year);

  const cities: CityMonthRow[] = [];
  for (const c of CITIES) {
    const snap = getArchiveStats(c);
    if (!snap?.monthlySeries) continue;
    const sameMonth = snap.monthlySeries.filter((m) => m.month === month && m.count >= MIN_DAYS);
    const target = sameMonth.find((m) => m.year === national.year);
    if (!target) continue;
    const cityNormal = monthNormal(snap.monthlySeries, month);
    if (cityNormal === null) continue;
    if (sameMonth.length < MIN_YEARS_FOR_RANK) continue;
    const anomalies = sameMonth.map((s) => s.mean - cityNormal);
    const anomaly = target.mean - cityNormal;
    cities.push({
      slug: c.slug,
      name: cityName(c as City, "it"),
      mean: target.mean,
      anomaly,
      // Sempre "dal più caldo", a pari merito come la classifica nazionale.
      rank: hotRank(anomalies, anomaly),
      total: sameMonth.length,
    });
  }
  cities.sort((a, b) => b.anomaly - a.anomaly);

  bulletinCache = { national, series, cities };
  return bulletinCache;
}
