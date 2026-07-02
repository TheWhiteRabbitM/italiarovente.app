// "Macchina del tempo" — meteo di un SINGOLO giorno (1940 → ~oggi) via
// Open-Meteo Archive API (ERA5). L'API Archive è severamente rate-limitata su
// questo progetto, quindi la cache è aggressiva: le date passate sono
// immutabili → revalidate 1 anno per le date più vecchie di ~6 mesi (oltre la
// finestra di ri-analisi ERA5T), 24h per quelle recenti. Retry leggero su 429.
//
// NB: replica volutamente in piccolo il pattern retry di src/lib/weather.ts
// (il cui omFetch non è esportato) per non toccare quel file.

import type { City } from "./cities";

const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

export type DayWeather = {
  mean: number | null;
  max: number | null;
  min: number | null;
  precip: number | null; // mm
  code: number | null; // WMO weather code
};

// ERA5T arriva con ~5-6 giorni di ritardo: il giorno più recente consultabile
// è "oggi meno 6 giorni".
const ERA5T_LAG_DAYS = 6;

// Range di date consultabili — condiviso tra pagina (validazione) e widget
// (min/max dell'<input type="date">).
export function dayLookupRange(): { min: string; max: string } {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ERA5T_LAG_DAYS);
  return { min: "1940-01-01", max: d.toISOString().slice(0, 10) };
}

// Vero solo per una data YYYY-MM-DD reale (niente 2023-02-31) e nel range.
export function isValidDayDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(date + "T00:00:00Z");
  if (Number.isNaN(t)) return false;
  if (new Date(t).toISOString().slice(0, 10) !== date) return false;
  const { min, max } = dayLookupRange();
  return date >= min && date <= max;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retry minimale anti-429/5xx (2 backoff, 3 tentativi totali).
async function fetchWithRetry(url: string, revalidate: number): Promise<Response> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { next: { revalidate, tags: ["dayweather"] } });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get("retry-after"));
      const wait =
        ra > 0
          ? Math.min(15000, ra * 1000)
          : Math.min(6000, 800 * 2 ** attempt) + Math.random() * 300;
      await sleep(wait);
      continue;
    }
    return res; // errore non recuperabile: al chiamante
  }
  return res as Response;
}

// Meteo di un singolo giorno. Ritorna null se la data non è valida/fuori range
// o se il dato non esiste; LANCIA su errore HTTP persistente (429/5xx dopo i
// retry) così la pagina non cacha mai un "404" dovuto a un rate-limit
// transitorio.
export async function getDayWeather(
  city: City,
  date: string,
): Promise<DayWeather | null> {
  if (!isValidDayDate(date)) return null;

  // Le date più vecchie di ~6 mesi sono definitive → cache 1 anno.
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 183);
  const isFinal = date < cutoff.toISOString().slice(0, 10);
  const revalidate = isFinal ? 60 * 60 * 24 * 365 : 60 * 60 * 24;

  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    start_date: date,
    end_date: date,
    daily:
      "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone: "Europe/Rome",
  });

  const res = await fetchWithRetry(`${ARCHIVE}?${params}`, revalidate);
  if (!res.ok) throw new Error(`Archive day ${city.slug} ${date}: ${res.status}`);
  const j = await res.json();
  const d = j?.daily;
  if (!d?.time?.length) return null;

  const day: DayWeather = {
    mean: d.temperature_2m_mean?.[0] ?? null,
    max: d.temperature_2m_max?.[0] ?? null,
    min: d.temperature_2m_min?.[0] ?? null,
    precip: d.precipitation_sum?.[0] ?? null,
    code: d.weather_code?.[0] ?? null,
  };
  // Nessuna temperatura → dato non (ancora) disponibile.
  if (day.mean == null && day.max == null && day.min == null) return null;
  return day;
}
