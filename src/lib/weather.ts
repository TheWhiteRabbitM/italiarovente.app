// Layer dati meteo — Fonte: Open-Meteo
//  • Storico: API Archive (ERA5 / ECMWF) — dati giornalieri dal 1940 ad oggi
//  • Attuale/previsioni: API Forecast (modelli IFS/ICON)
// Nessuna API key richiesta. I dati sono in cache con revalidazione (aggiornamento
// automatico giornaliero) e taggati "weather" per la revalidazione via cron.

import { cache } from "react";
import type { City } from "./cities";
import historyData from "@/data/history.json";

const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY = "https://air-quality-api.open-meteo.com/v1/air-quality";

// Inizio dati affidabili ERA5.
export const DATA_START = "1940-01-01";

// ERA5 diventa disponibile con ~5 giorni di ritardo, ma quella versione
// iniziale (ERA5T) è preliminare: la versione finale, "ri-analizzata", arriva
// solo dopo alcuni mesi e può differire leggermente. Per non dichiarare un
// record assoluto su un dato che potrebbe ancora essere rivisto, i record
// giornalieri (non le medie annue/mensili) ignorano gli ultimi mesi.
const RECORD_CUTOFF_DAYS = 120;
function recordCutoffISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - RECORD_CUTOFF_DAYS);
  return d.toISOString().slice(0, 10);
}

export type DailyPoint = {
  date: string;
  mean: number | null;
  max: number | null;
  min: number | null;
};

export type YearlyPoint = {
  year: number;
  mean: number;
  max: number; // media delle massime
  min: number; // media delle minime
  count: number;
  hd?: number; // giorni con max >= 30° (solo città principali)
  ehd?: number; // giorni con max >= 35°
  tn?: number; // notti con min >= 20° (tropicali)
};

export type MonthlyClim = {
  month: number;
  mean: number;
  max: number;
  min: number;
};

// Media di un singolo mese di un singolo anno (non la climatologia sull'intera
// serie di MonthlyClim): serve a rispondere a "questo giugno è stato il più
// caldo mai registrato?", che richiede il valore anno per anno, non solo la
// media storica del mese.
export type MonthlySeriesPoint = {
  year: number;
  month: number; // 1-12
  mean: number;
  count: number; // giorni validi nel mese (< giorni_nel_mese se il mese è in corso o ha buchi)
};

// Afa estiva di un anno: media (giu-ago) della temperatura percepita massima e
// della secca massima, per confrontarle. Solo per le città principali (fetch a
// 4 variabili). La percepita include umidità, vento e radiazione: è un modello,
// meno solido della secca.
export type SummerApparentPoint = {
  year: number;
  feels: number; // percepita massima media estiva
  dry: number; // secca massima media estiva (stesso campione)
  count: number; // giorni estivi validi (>= 80)
};

export type Extreme = { date: string; value: number };

export type AnomalyPoint = { year: number; anomaly: number };
export type DecadePoint = {
  decade: number;
  mean: number;
  anomaly: number;
  count: number;
};

export type CityArchive = {
  precise?: boolean; // true se abbiamo max/min reali (città principali)
  yearly: YearlyPoint[];
  anomalies: AnomalyPoint[]; // scarto della media annua dalla normale 1961-1990
  decades: DecadePoint[];
  monthly: MonthlyClim[];
  // Opzionale: assente negli snapshot precalcolati con versioni precedenti
  // dello script, finché fetch-history.mjs non ha ribackfillato quella città.
  monthlySeries?: MonthlySeriesPoint[];
  // Afa estiva anno per anno. Solo città principali; assente per le altre e per
  // gli snapshot precedenti all'aggiunta di questo campo.
  summerApparent?: SummerApparentPoint[];
  recent: DailyPoint[]; // ultimi ~400 giorni
  records: {
    hottest: Extreme;
    coldest: Extreme;
    warmestYear: YearlyPoint;
    coolestYear: YearlyPoint;
    // Sequenza più lunga di giorni consecutivi con massima >= 35° (solo
    // città principali, precalcolato in fetch-history.mjs). Assente/null se
    // non ancora calcolato o nel fallback live (computeArchive) — mai una
    // stima parziale spacciata per definitiva.
    longestHeatwave?: { days: number; start: string; end: string; peak: number } | null;
    // Simmetrico, ma per la sequenza più lunga di notti di gelo consecutive
    // (minima <= 0°C).
    longestColdSnap?: { days: number; start: string; end: string; low: number } | null;
  };
  trend: {
    perYear: number; // °C/anno (pendenza regressione lineare media annua)
    perDecade: number; // °C/decennio
    // Margine ± dell'IC al 95% su perDecade (t di Student, df = n-2). Opzionale
    // perché gli snapshot precalcolati con versioni precedenti dello script non
    // lo avevano ancora: assente finché fetch-history.mjs non ha ricalcolato
    // quella città, mai una stima parziale spacciata per definitiva.
    perDecadeCi95?: number;
    totalChange: number; // °C stimati su tutta la serie (pendenza × anni)
    r2: number; // bontà di adattamento della retta (0-1)
    baselineMean: number; // normale climatica 1961-1990 (WMO)
    recentNormal: number; // normale 1991-2020
    lastFullYearMean: number;
    firstYear: number;
    lastYear: number;
  };
  startYear: number;
  lastDate: string;
};

export type CityForecast = {
  current: {
    temp: number | null;
    code: number | null;
    wind: number | null;
    humidity: number | null;
    uvMax: number | null; // indice UV massimo previsto per oggi
    time: string;
  };
  days: {
    date: string;
    max: number | null;
    min: number | null;
    mean: number | null;
    code: number | null;
    precip: number | null; // mm di pioggia in quel giorno
    isForecast: boolean;
  }[];
  spark: { date: string; mean: number | null }[]; // ultimi 30 giorni
  drought: {
    dryDays: number; // giorni consecutivi senza pioggia significativa (fino a oggi)
    rain30d: number; // mm totali negli ultimi 30 giorni
  };
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Lo storico è diviso in due fetch (vedi getArchive): lo storico "profondo" è
// cachato 30 giorni, la coda recente 12h. Stale-while-revalidate di default in
// ISR -> un 429 in fase di refresh non rompe mai la pagina già generata.

// --- Fetch con limite di concorrenza + retry/backoff (anti rate-limit 429) ---
const MAX_CONCURRENT = 5;
let active = 0;
const waiters: (() => void)[] = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise<void>((res) => waiters.push(res));
}
function release(): void {
  const next = waiters.shift();
  if (next) next();
  else active--;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function omFetch(
  url: string,
  tags: string[],
  rev: number,
): Promise<Response> {
  await acquire();
  try {
    let res: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(url, { next: { revalidate: rev, tags } });
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        const wait =
          ra > 0
            ? Math.min(30000, ra * 1000)
            : Math.min(8000, 1000 * 2 ** attempt) + Math.random() * 400;
        await sleep(wait);
        continue;
      }
      return res; // errori non recuperabili: gestiti dal chiamante
    }
    return res as Response;
  } finally {
    release();
  }
}

// ---------------------------------------------------------------------------
// PREVISIONI + DATI ATTUALI
// ---------------------------------------------------------------------------
export const getForecast = cache(async (city: City): Promise<CityForecast> => {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily:
      "temperature_2m_max,temperature_2m_min,temperature_2m_mean,weather_code,precipitation_sum,uv_index_max",
    timezone: "Europe/Rome",
    past_days: "31",
    forecast_days: "7",
  });

  const res = await omFetch(`${FORECAST}?${params}`, ["forecast"], 60 * 30);
  if (!res.ok) throw new Error(`Forecast ${city.name}: ${res.status}`);
  const j = await res.json();

  const today = todayISO();
  const times: string[] = j.daily.time;
  const days = times.map((date: string, i: number) => ({
    date,
    max: j.daily.temperature_2m_max[i],
    min: j.daily.temperature_2m_min[i],
    mean: j.daily.temperature_2m_mean[i],
    code: j.daily.weather_code[i],
    precip: j.daily.precipitation_sum?.[i] ?? null,
    isForecast: date > today,
  }));

  const spark = days
    .filter((d: { date: string }) => d.date <= today)
    .slice(-30)
    .map((d: { date: string; mean: number | null }) => ({
      date: d.date,
      mean: d.mean,
    }));

  // Siccità: giorni consecutivi senza pioggia significativa (>=1mm), contando
  // a ritroso da oggi; e piovosità totale negli ultimi 30 giorni.
  const pastDays = days.filter((d: { date: string }) => d.date <= today);
  let dryDays = 0;
  for (let i = pastDays.length - 1; i >= 0; i--) {
    const p = pastDays[i].precip;
    if (p != null && p >= 1) break;
    dryDays++;
  }
  const rain30d = pastDays
    .slice(-30)
    .reduce((s: number, d: { precip: number | null }) => s + (d.precip ?? 0), 0);

  // Indice UV massimo di oggi (dalla serie daily; null se assente).
  const todayIdx = times.indexOf(today);
  const uvRaw = todayIdx >= 0 ? j.daily.uv_index_max?.[todayIdx] : null;
  const uvMax = typeof uvRaw === "number" && Number.isFinite(uvRaw) ? uvRaw : null;

  return {
    current: {
      temp: j.current.temperature_2m,
      code: j.current.weather_code,
      wind: j.current.wind_speed_10m,
      humidity: j.current.relative_humidity_2m,
      uvMax,
      time: j.current.time,
    },
    days,
    spark,
    drought: { dryDays, rain30d: Math.round(rain30d * 10) / 10 },
  };
});

// ---------------------------------------------------------------------------
// QUALITÀ DELL'ARIA + POLLINI (API Air Quality di Open-Meteo, CAMS)
// Dato "nice to have": non deve MAI rompere la pagina -> null su qualsiasi
// errore (fetch fallito, risposta malformata, ecc.).
// ---------------------------------------------------------------------------
export type CityAirQuality = {
  aqi: number | null; // European AQI (0-100+)
  pm25: number | null; // µg/m³
  pm10: number | null; // µg/m³
  // Solo specie con concentrazione significativa (>10 grani/m³), desc, max 3.
  pollen: { key: string; value: number }[];
};

const POLLEN_SPECIES = [
  "alder",
  "birch",
  "grass",
  "mugwort",
  "olive",
  "ragweed",
] as const;

export const getAirQuality = cache(
  async (city: City): Promise<CityAirQuality | null> => {
    try {
      const params = new URLSearchParams({
        latitude: String(city.lat),
        longitude: String(city.lon),
        current:
          "european_aqi,pm2_5,pm10,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen",
        timezone: "Europe/Rome",
      });
      const res = await omFetch(`${AIR_QUALITY}?${params}`, ["air"], 60 * 60 * 2);
      if (!res.ok) return null;
      const j = await res.json();
      const c = j?.current;
      if (!c) return null;

      const num = (v: unknown): number | null =>
        typeof v === "number" && Number.isFinite(v) ? v : null;

      const pollen: { key: string; value: number }[] = [];
      for (const key of POLLEN_SPECIES) {
        const value = num(c[`${key}_pollen`]);
        if (value !== null && value > 10) pollen.push({ key, value });
      }
      pollen.sort((a, b) => b.value - a.value);

      return {
        aqi: num(c.european_aqi),
        pm25: num(c.pm2_5),
        pm10: num(c.pm10),
        pollen: pollen.slice(0, 3),
      };
    } catch {
      return null;
    }
  },
);

// ---------------------------------------------------------------------------
// STORICO (1940 -> oggi) con aggregazioni
// ---------------------------------------------------------------------------
type RawDaily = {
  time: string[];
  mean: (number | null)[];
  tmax: (number | null)[];
  tmin: (number | null)[];
};

async function fetchArchiveRange(
  city: City,
  start: string,
  end: string,
  rev: number,
): Promise<RawDaily> {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    start_date: start,
    end_date: end,
    daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Rome",
  });
  const res = await omFetch(`${ARCHIVE}?${params}`, ["weather"], rev);
  if (!res.ok) throw new Error(`Archive ${city.name} ${start}: ${res.status}`);
  const j = await res.json();
  return {
    time: j.daily.time,
    mean: j.daily.temperature_2m_mean,
    tmax: j.daily.temperature_2m_max,
    tmin: j.daily.temperature_2m_min,
  };
}

async function computeArchive(city: City): Promise<CityArchive> {
  const year = new Date().getUTCFullYear();
  // Confine fisso: lo storico "profondo" (1940 -> fine di 2 anni fa) NON cambia
  // mai -> cache 30 giorni. La coda recente è leggera -> cache 12h (refresh giornaliero).
  const histEnd = `${year - 2}-12-31`;
  const recentStart = `${year - 2}-01-01`;

  const [hist, rec] = await Promise.all([
    fetchArchiveRange(city, DATA_START, histEnd, 60 * 60 * 24 * 30),
    fetchArchiveRange(city, recentStart, todayISO(), 60 * 60 * 12),
  ]);

  // Unione con dedup per data (la coda recente sovrascrive lo storico nell'anno di overlap).
  const byDate = new Map<string, { m: number | null; mx: number | null; mn: number | null }>();
  for (let i = 0; i < hist.time.length; i++) {
    byDate.set(hist.time[i], { m: hist.mean[i], mx: hist.tmax[i], mn: hist.tmin[i] });
  }
  for (let i = 0; i < rec.time.length; i++) {
    byDate.set(rec.time[i], { m: rec.mean[i], mx: rec.tmax[i], mn: rec.tmin[i] });
  }
  const time = [...byDate.keys()].sort();
  const mean = time.map((d) => byDate.get(d)!.m);
  const tmax = time.map((d) => byDate.get(d)!.mx);
  const tmin = time.map((d) => byDate.get(d)!.mn);

  // Accumulatori
  const yearAgg = new Map<
    number,
    { sm: number; sMax: number; sMin: number; n: number }
  >();
  const monthAgg = new Map<
    number,
    { sm: number; sMax: number; sMin: number; n: number }
  >();
  // Come monthAgg, ma per singolo anno-mese (non l'intera serie): serve a
  // confrontare "questo giugno" con tutti i giugni passati, non solo con la
  // media storica di giugno.
  const monthYearAgg = new Map<string, { sm: number; n: number; year: number; month: number }>();
  // baseline 1961-1990 (normale climatica WMO) e normale recente 1991-2020
  let baseSum = 0;
  let baseN = 0;
  let recSum = 0;
  let recN = 0;

  let hottest: Extreme = { date: "", value: -Infinity };
  let coldest: Extreme = { date: "", value: Infinity };
  const recordCutoff = recordCutoffISO();

  const recent: DailyPoint[] = [];
  const recentCutoffIdx = Math.max(0, time.length - 400);

  for (let i = 0; i < time.length; i++) {
    const date = time[i];
    const m = mean[i];
    const mx = tmax[i];
    const mn = tmin[i];
    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(5, 7), 10);

    if (m !== null && m !== undefined) {
      const ya = yearAgg.get(year) ?? { sm: 0, sMax: 0, sMin: 0, n: 0 };
      ya.sm += m;
      ya.sMax += mx ?? m;
      ya.sMin += mn ?? m;
      ya.n += 1;
      yearAgg.set(year, ya);

      const ma = monthAgg.get(month) ?? { sm: 0, sMax: 0, sMin: 0, n: 0 };
      ma.sm += m;
      ma.sMax += mx ?? m;
      ma.sMin += mn ?? m;
      ma.n += 1;
      monthAgg.set(month, ma);

      const myKey = `${year}-${month}`;
      const mya = monthYearAgg.get(myKey) ?? { sm: 0, n: 0, year, month };
      mya.sm += m;
      mya.n += 1;
      monthYearAgg.set(myKey, mya);

      if (year >= 1961 && year <= 1990) {
        baseSum += m;
        baseN += 1;
      }
      if (year >= 1991 && year <= 2020) {
        recSum += m;
        recN += 1;
      }
    }
    if (mx !== null && mx !== undefined && mx > hottest.value && date <= recordCutoff) {
      hottest = { date, value: mx };
    }
    if (mn !== null && mn !== undefined && mn < coldest.value && date <= recordCutoff) {
      coldest = { date, value: mn };
    }
    if (i >= recentCutoffIdx) {
      recent.push({ date, mean: m, max: mx, min: mn });
    }
  }

  const yearly: YearlyPoint[] = [...yearAgg.entries()]
    .map(([year, a]) => ({
      year,
      mean: a.sm / a.n,
      max: a.sMax / a.n,
      min: a.sMin / a.n,
      count: a.n,
    }))
    // escludi l'anno in corso se incompleto, dalle statistiche di trend (ma tienilo nel grafico)
    .sort((a, b) => a.year - b.year);

  const monthly: MonthlyClim[] = [...monthAgg.entries()]
    .map(([month, a]) => ({
      month,
      mean: a.sm / a.n,
      max: a.sMax / a.n,
      min: a.sMin / a.n,
    }))
    .sort((a, b) => a.month - b.month);

  const monthlySeries: MonthlySeriesPoint[] = [...monthYearAgg.values()]
    .map((a) => ({ year: a.year, month: a.month, mean: a.sm / a.n, count: a.n }))
    .sort((a, b) => a.year - b.year || a.month - b.month);

  // Solo anni completi (>= 360 giorni) per record annuali e trend
  const fullYears = yearly.filter((y) => y.count >= 360);
  const warmestYear = fullYears.reduce(
    (acc, y) => (y.mean > acc.mean ? y : acc),
    fullYears[0],
  );
  const coolestYear = fullYears.reduce(
    (acc, y) => (y.mean < acc.mean ? y : acc),
    fullYears[0],
  );

  const baselineMean = baseN > 0 ? baseSum / baseN : NaN;
  const recentNormal = recN > 0 ? recSum / recN : NaN;

  // Anomalie annue rispetto alla normale 1961-1990 (tutti gli anni, anche l'ultimo parziale)
  const anomalies: AnomalyPoint[] = yearly.map((y) => ({
    year: y.year,
    anomaly: y.mean - baselineMean,
  }));

  // Medie decennali (solo anni completi)
  const decAgg = new Map<number, { s: number; n: number }>();
  for (const y of fullYears) {
    const dec = Math.floor(y.year / 10) * 10;
    const e = decAgg.get(dec) ?? { s: 0, n: 0 };
    e.s += y.mean;
    e.n += 1;
    decAgg.set(dec, e);
  }
  const decades: DecadePoint[] = [...decAgg.entries()]
    .map(([decade, e]) => ({
      decade,
      mean: e.s / e.n,
      anomaly: e.s / e.n - baselineMean,
      count: e.n,
    }))
    .sort((a, b) => a.decade - b.decade);

  // Regressione lineare media annua (solo anni completi) -> trend e R²
  const reg = linreg(fullYears.map((y) => [y.year, y.mean]));
  const firstY = fullYears[0];
  const lastY = fullYears[fullYears.length - 1];

  return {
    precise: true,
    yearly,
    anomalies,
    decades,
    monthly,
    monthlySeries,
    recent,
    records: { hottest, coldest, warmestYear, coolestYear },
    trend: {
      perYear: reg.slope,
      perDecade: reg.slope * 10,
      perDecadeCi95: reg.ciMargin * 10,
      totalChange: reg.slope * (lastY.year - firstY.year),
      r2: reg.r2,
      baselineMean,
      recentNormal,
      lastFullYearMean: lastY.mean,
      firstYear: firstY.year,
      lastYear: lastY.year,
    },
    startYear: yearly[0]?.year ?? 1940,
    lastDate: time[time.length - 1],
  };
}

// ---------------------------------------------------------------------------
// SNAPSHOT STORICO PRECALCOLATO (build) + DATO RECENTE LIVE
// Lo storico 1940→ultimo anno completo è "cotto" al build in src/data/history.json
// (vedi scripts/fetch-history.mjs): aggregati piccoli, lettura istantanea, nessun
// fetch pesante a runtime. A runtime scarichiamo solo la coda recente (leggera).
// ---------------------------------------------------------------------------
export type HistorySnap = Omit<CityArchive, "recent">;
const SNAPSHOT = historyData as unknown as Record<string, HistorySnap>;

export type HistoryMeta = {
  generatedAt: string;
  source: string;
  commit: string | null;
  sha256?: string; // fingerprint SHA-256 degli aggregati per-città, per verifica indipendente
};

// Provenienza dello snapshot precalcolato: quando è stato generato e da quale
// fonte, scritta da scripts/fetch-history.mjs. Serve a chi vuole riprodurre
// esattamente questi numeri (vedi /dati).
export function getHistoryMeta(): HistoryMeta | null {
  const meta = (historyData as Record<string, unknown>)._meta;
  return (meta as HistoryMeta) ?? null;
}

async function fetchRecentDaily(city: City): Promise<DailyPoint[]> {
  const year = new Date().getUTCFullYear();
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    start_date: `${year - 1}-01-01`,
    end_date: todayISO(),
    daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min",
    timezone: "Europe/Rome",
  });
  const res = await omFetch(`${ARCHIVE}?${params}`, ["recent"], 60 * 60 * 12);
  if (!res.ok) return [];
  const j = await res.json();
  const t: string[] = j.daily.time;
  return t.map((date, i) => ({
    date,
    mean: j.daily.temperature_2m_mean[i],
    max: j.daily.temperature_2m_max[i],
    min: j.daily.temperature_2m_min[i],
  }));
}

export const getArchive = cache(async (city: City): Promise<CityArchive> => {
  const snap = SNAPSHOT[city.slug];
  if (snap && snap.yearly?.length) {
    const recent = await fetchRecentDaily(city).catch(() => []);
    return { ...snap, recent };
  }
  // Fallback (build locale senza snapshot): calcolo live completo.
  return computeArchive(city);
});

// Solo aggregati storici precalcolati (nessun fetch): per le pagine che
// confrontano molte città (clima, confronto) -> lettura istantanea.
export function getArchiveStats(city: City): HistorySnap | null {
  const snap = SNAPSHOT[city.slug];
  return snap && snap.yearly?.length ? snap : null;
}

// Confronto massime vs minime tra le due normali climatiche (1961–1990 e
// 1991–2020, lo stesso metodo "a due trentenni" usato per la media): spesso
// le notti (minime) si scaldano a un ritmo diverso dai giorni (massime) — un
// segnale più interessante della sola media, e verificabile solo dove
// abbiamo max/min reali (città con `precise !== false`).
export type MinMaxWarming = {
  baselineMax: number;
  recentMax: number;
  deltaMax: number;
  baselineMin: number;
  recentMin: number;
  deltaMin: number;
};

export function getMinMaxWarming(archive: HistorySnap): MinMaxWarming | null {
  if (archive.precise === false) return null;
  const full = archive.yearly.filter((y) => y.count >= 360);
  const avg = (from: number, to: number, key: "max" | "min") => {
    const ys = full.filter((y) => y.year >= from && y.year <= to);
    return ys.length ? ys.reduce((s, y) => s + y[key], 0) / ys.length : NaN;
  };
  const baselineMax = avg(1961, 1990, "max");
  const recentMax = avg(1991, 2020, "max");
  const baselineMin = avg(1961, 1990, "min");
  const recentMin = avg(1991, 2020, "min");
  if ([baselineMax, recentMax, baselineMin, recentMin].some(Number.isNaN)) return null;
  return {
    baselineMax,
    recentMax,
    deltaMax: recentMax - baselineMax,
    baselineMin,
    recentMin,
    deltaMin: recentMin - baselineMin,
  };
}

// Valori critici della t di Student per un intervallo di confidenza al 95%
// (due code), interpolati linearmente tra i gradi di libertà tabulati. Per
// df >= 120 si usa l'approssimazione alla normale standard (1.96) — scelta
// esplicita e documentata, non un arrotondamento nascosto: con le serie di
// questo sito (n ~ 80-85 anni, df ~ 78-83) la differenza rispetto a un valore
// tabulato esatto è nell'ordine del millesimo.
const T_TABLE: [number, number][] = [
  [1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571],
  [6, 2.447], [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228],
  [15, 2.131], [20, 2.086], [25, 2.060], [30, 2.042], [40, 2.021],
  [50, 2.009], [60, 2.000], [80, 1.990], [100, 1.984], [120, 1.980],
];
function tCrit95(df: number): number {
  if (df <= 0) return NaN;
  if (df >= 120) return 1.96;
  for (let i = 0; i < T_TABLE.length - 1; i++) {
    const [df1, t1] = T_TABLE[i];
    const [df2, t2] = T_TABLE[i + 1];
    if (df >= df1 && df <= df2) return t1 + ((df - df1) / (df2 - df1)) * (t2 - t1);
  }
  return 1.96;
}

export function linreg(pts: [number, number][]): {
  slope: number;
  intercept: number;
  r2: number;
  ciMargin: number; // margine ± dell'IC al 95% sulla pendenza, stessa unità di slope (°C/anno)
} {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: pts[0]?.[1] ?? 0, r2: 0, ciMargin: NaN };
  let sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0,
    syy = 0;
  for (const [x, y] of pts) {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
    syy += y * y;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { slope: 0, intercept: sy / n, r2: 0, ciMargin: NaN };
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const rNum = n * sxy - sx * sy;
  const rDen = Math.sqrt(denom * (n * syy - sy * sy));
  const r = rDen === 0 ? 0 : rNum / rDen;

  // Errore standard della pendenza: s² = varianza residua (SSE / df), Sxx =
  // somma degli scarti al quadrato di x. CI95 = t(df) * SE(slope).
  let sse = 0;
  for (const [x, y] of pts) {
    const resid = y - (intercept + slope * x);
    sse += resid * resid;
  }
  const df = n - 2;
  const sxxDev = sxx - (sx * sx) / n;
  const se = df > 0 && sxxDev > 0 ? Math.sqrt(sse / df / sxxDev) : NaN;
  const ciMargin = Number.isFinite(se) ? tCrit95(df) * se : NaN;

  return { slope, intercept, r2: r * r, ciMargin };
}
