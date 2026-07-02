// Dataset EUROPEO statico per la pagina di confronto Italia vs Europa
// (src/data/europe.json). Eseguito UNA TANTUM in locale, MAI al build:
// il confronto usa solo le due normali trentennali (1961-1990 vs 1991-2020)
// e la serie annua storica — dati congelati che non cambiano mai. Il file
// viene committato e letto staticamente, zero richieste API a runtime.
//
// Uso:  node scripts/fetch-europe.mjs
// Per aggiungere una capitale: aggiungila a EURO_CITIES e rilancia (le città
// già presenti nel file vengono mantenute, si scaricano solo le mancanti).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "europe.json");

const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const DATA_START = "1940-01-01";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Capitali/città europee di riferimento. nameIt/nameEn per la UI bilingue.
const EURO_CITIES = [
  { slug: "londra", nameIt: "Londra", nameEn: "London", country: "🇬🇧", lat: 51.5074, lon: -0.1278 },
  { slug: "parigi", nameIt: "Parigi", nameEn: "Paris", country: "🇫🇷", lat: 48.8566, lon: 2.3522 },
  { slug: "berlino", nameIt: "Berlino", nameEn: "Berlin", country: "🇩🇪", lat: 52.52, lon: 13.405 },
  { slug: "madrid", nameIt: "Madrid", nameEn: "Madrid", country: "🇪🇸", lat: 40.4168, lon: -3.7038 },
  { slug: "vienna", nameIt: "Vienna", nameEn: "Vienna", country: "🇦🇹", lat: 48.2082, lon: 16.3738 },
  { slug: "atene", nameIt: "Atene", nameEn: "Athens", country: "🇬🇷", lat: 37.9838, lon: 23.7275 },
  { slug: "amsterdam", nameIt: "Amsterdam", nameEn: "Amsterdam", country: "🇳🇱", lat: 52.3676, lon: 4.9041 },
  { slug: "lisbona", nameIt: "Lisbona", nameEn: "Lisbon", country: "🇵🇹", lat: 38.7223, lon: -9.1393 },
  { slug: "stoccolma", nameIt: "Stoccolma", nameEn: "Stockholm", country: "🇸🇪", lat: 59.3293, lon: 18.0686 },
  { slug: "varsavia", nameIt: "Varsavia", nameEn: "Warsaw", country: "🇵🇱", lat: 52.2297, lon: 21.0122 },
  { slug: "zurigo", nameIt: "Zurigo", nameEn: "Zurich", country: "🇨🇭", lat: 47.3769, lon: 8.5417 },
  { slug: "bruxelles", nameIt: "Bruxelles", nameEn: "Brussels", country: "🇧🇪", lat: 50.8503, lon: 4.3517 },
  { slug: "dublino", nameIt: "Dublino", nameEn: "Dublin", country: "🇮🇪", lat: 53.3498, lon: -6.2603 },
  { slug: "copenaghen", nameIt: "Copenaghen", nameEn: "Copenhagen", country: "🇩🇰", lat: 55.6761, lon: 12.5683 },
];

async function fetchDaily(city, end) {
  // Solo la media giornaliera: 1/3 del peso API, sufficiente per normali,
  // serie annua e anomalie (niente record/max/min per l'Europa).
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    start_date: DATA_START,
    end_date: end,
    daily: "temperature_2m_mean",
    timezone: "Europe/Rome",
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${ARCHIVE}?${params}`);
      if (res.ok) return res.json();
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        await sleep(ra > 0 ? Math.min(15000, ra * 1000) : Math.min(10000, 1500 * 2 ** attempt));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(Math.min(10000, 1500 * 2 ** attempt));
    }
  }
  throw new Error("rate-limited");
}

function aggregate(j) {
  const time = j.daily.time;
  const mean = j.daily.temperature_2m_mean;
  const yearAgg = new Map();
  let baseSum = 0, baseN = 0, recSum = 0, recN = 0;

  for (let i = 0; i < time.length; i++) {
    const m = mean[i];
    if (m == null) continue;
    const y = +time[i].slice(0, 4);
    const a = yearAgg.get(y) ?? { s: 0, n: 0 };
    a.s += m; a.n++;
    yearAgg.set(y, a);
    if (y >= 1961 && y <= 1990) { baseSum += m; baseN++; }
    if (y >= 1991 && y <= 2020) { recSum += m; recN++; }
  }

  const round = (v) => Math.round(v * 100) / 100;
  // Solo anni completi: coerente con il metodo del resto del sito.
  const yearly = [...yearAgg.entries()]
    .filter(([, a]) => a.n >= 360)
    .map(([y, a]) => ({ y, m: round(a.s / a.n) }))
    .sort((a, b) => a.y - b.y);

  const baseline = baseN ? round(baseSum / baseN) : null;
  const recentNormal = recN ? round(recSum / recN) : null;
  return { yearly, baseline, recentNormal };
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  let existing = {};
  try { existing = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* primo run */ }

  const out = { ...existing };
  const end = new Date().toISOString().slice(0, 10);
  for (const city of EURO_CITIES) {
    if (out[city.slug]?.yearly?.length) {
      console.log(`• ${city.slug}: già presente, salto`);
      continue;
    }
    try {
      const j = await fetchDaily(city, end);
      const agg = aggregate(j);
      out[city.slug] = {
        slug: city.slug,
        nameIt: city.nameIt,
        nameEn: city.nameEn,
        country: city.country,
        ...agg,
      };
      console.log(`✓ ${city.slug} (${agg.yearly[0]?.y}–${agg.yearly.at(-1)?.y}, +${(agg.recentNormal - agg.baseline).toFixed(2)}°C)`);
    } catch (e) {
      console.log(`✗ ${city.slug}: ${e.message}`);
    }
    await sleep(3000);
  }

  writeFileSync(OUT, JSON.stringify(out));
  const done = Object.keys(out).filter((k) => out[k]?.yearly?.length).length;
  console.log(`Europa: ${done}/${EURO_CITIES.length} città. -> ${OUT}`);
}

main();
