// Genera lo snapshot storico precalcolato (src/data/history.json).
// Eseguito al BUILD: scarica da Open-Meteo (ERA5) la serie giornaliera 1940->oggi
// per ogni città e ne calcola gli aggregati (annuali, mensili, anomalie, decenni,
// record, trend). Lo storico profondo non cambia mai -> calcolato una volta.
// Resiliente: se una città fallisce (es. 429), mantiene il valore già presente
// nel file, così i build locali (rate-limited) riusano i dati committati.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "history.json");
const CITIES_FILE = join(__dirname, "..", "src", "data", "cities.json");

// Fonte unica delle città (condivisa con il sito).
const CITIES = JSON.parse(readFileSync(CITIES_FILE, "utf8"));

const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const DATA_START = "1940-01-01";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ERA5 diventa disponibile con ~5 giorni di ritardo, ma quella versione
// iniziale (ERA5T) è preliminare: la versione finale, "ri-analizzata", arriva
// solo dopo alcuni mesi e può differire leggermente. Per non dichiarare un
// record assoluto su un dato che potrebbe ancora essere rivisto, i record
// giornalieri (non le medie annue/mensili) ignorano gli ultimi mesi. Tenuto
// in sync a mano con RECORD_CUTOFF_DAYS in src/lib/weather.ts.
const RECORD_CUTOFF_DAYS = 120;
function recordCutoffISO() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - RECORD_CUTOFF_DAYS);
  return d.toISOString().slice(0, 10);
}

// Stessa soglia già usata per "ondata di calore" nelle notifiche push
// (src/app/api/refresh/route.ts, HEAT_THRESHOLD) — un solo vocabolario sul
// sito, non due soglie diverse per lo stesso concetto.
const HEATWAVE_STREAK_THRESHOLD = 35;

// Notte di gelo: minima <= 0°C. Soglia meteorologica standard (non 35°/-35°
// simmetrico: l'obiettivo è una sequenza di gelo notturno riconoscibile,
// non un valore arbitrario).
const COLD_SNAP_STREAK_THRESHOLD = 0;

function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function linreg(pts) {
  const n = pts.length;
  if (n < 2) return { slope: 0, r2: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pts) {
    sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y;
  }
  const denom = n * sxx - sx * sx;
  if (!denom) return { slope: 0, r2: 0 };
  const slope = (n * sxy - sx * sy) / denom;
  const rNum = n * sxy - sx * sy;
  const rDen = Math.sqrt(denom * (n * syy - sy * sy));
  const r = rDen ? rNum / rDen : 0;
  return { slope, r2: r * r };
}

async function fetchDaily(city, end) {
  // Città principali: media+max+min (record precisi). Altre: solo media
  // (1/3 del peso API -> molte più città entro il rate limit).
  const daily = city.main
    ? "temperature_2m_mean,temperature_2m_max,temperature_2m_min"
    : "temperature_2m_mean";
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    start_date: DATA_START,
    end_date: end,
    daily,
    timezone: "Europe/Rome",
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${ARCHIVE}?${params}`);
      if (res.ok) return res.json();
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        await sleep(ra > 0 ? Math.min(12000, ra * 1000) : Math.min(8000, 1200 * 2 ** attempt));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(Math.min(8000, 1200 * 2 ** attempt));
    }
  }
  throw new Error("rate-limited");
}

export function aggregate(j) {
  const time = j.daily.time;
  const mean = j.daily.temperature_2m_mean;
  const tmax = j.daily.temperature_2m_max ?? [];
  const tmin = j.daily.temperature_2m_min ?? [];
  // precise = abbiamo davvero max/min (città principali, fetch a 3 variabili)
  const precise = Array.isArray(j.daily.temperature_2m_max);

  const yearAgg = new Map();
  const monthAgg = new Map();
  const monthEarly = new Map(); // media mensile 1961-1990
  const monthRecent = new Map(); // media mensile 1991-2020
  let baseSum = 0, baseN = 0, recSum = 0, recN = 0;
  let hottest = { date: "", value: -Infinity };
  let coldest = { date: "", value: Infinity };
  const recordCutoff = recordCutoffISO();

  // Ondata di calore più lunga mai registrata: sequenza massima di giorni
  // CONSECUTIVI (nessun buco nella serie) con massima >= soglia. Calcolato
  // qui perché la serie giornaliera è già in memoria per le medie annue —
  // nessun fetch aggiuntivo. Come per i record assoluti, si ferma al cutoff
  // per non dichiarare un record su dati ERA5 ancora provvisori.
  let heatRun = 0, heatPeak = -Infinity, heatStart = "";
  let bestHeatwave = { days: 0, start: "", end: "", peak: -Infinity };
  // Simmetrico alla sequenza di caldo, ma sulle notti di gelo consecutive
  // (minima <= soglia) — stesso calcolo, nessun fetch in più.
  let coldRun = 0, coldLow = Infinity, coldStart = "";
  let bestColdSnap = { days: 0, start: "", end: "", low: Infinity };
  let prevDate = null;

  for (let i = 0; i < time.length; i++) {
    const date = time[i];
    const m = mean[i], mx = tmax[i], mn = tmin[i];
    const y = +date.slice(0, 4);
    const mo = +date.slice(5, 7);

    const consecutive = prevDate !== null && daysBetween(prevDate, date) === 1;
    if (!consecutive) {
      heatRun = 0; heatPeak = -Infinity; heatStart = "";
      coldRun = 0; coldLow = Infinity; coldStart = "";
    }
    if (mx != null && mx >= HEATWAVE_STREAK_THRESHOLD && date <= recordCutoff) {
      if (heatRun === 0) heatStart = date;
      heatRun++;
      if (mx > heatPeak) heatPeak = mx;
      if (heatRun > bestHeatwave.days) {
        bestHeatwave = { days: heatRun, start: heatStart, end: date, peak: heatPeak };
      }
    } else {
      heatRun = 0; heatPeak = -Infinity; heatStart = "";
    }
    if (mn != null && mn <= COLD_SNAP_STREAK_THRESHOLD && date <= recordCutoff) {
      if (coldRun === 0) coldStart = date;
      coldRun++;
      if (mn < coldLow) coldLow = mn;
      if (coldRun > bestColdSnap.days) {
        bestColdSnap = { days: coldRun, start: coldStart, end: date, low: coldLow };
      }
    } else {
      coldRun = 0; coldLow = Infinity; coldStart = "";
    }
    prevDate = date;

    if (m != null) {
      const ya = yearAgg.get(y) ?? { sm: 0, sMax: 0, sMin: 0, n: 0, hd: 0, ehd: 0, tn: 0 };
      ya.sm += m; ya.sMax += mx ?? m; ya.sMin += mn ?? m; ya.n++;
      if (mx != null) { if (mx >= 30) ya.hd++; if (mx >= 35) ya.ehd++; }
      if (mn != null && mn >= 20) ya.tn++;
      yearAgg.set(y, ya);
      const ma = monthAgg.get(mo) ?? { sm: 0, sMax: 0, sMin: 0, n: 0 };
      ma.sm += m; ma.sMax += mx ?? m; ma.sMin += mn ?? m; ma.n++;
      monthAgg.set(mo, ma);
      if (y >= 1961 && y <= 1990) {
        baseSum += m; baseN++;
        const e = monthEarly.get(mo) ?? { s: 0, n: 0 }; e.s += m; e.n++; monthEarly.set(mo, e);
      }
      if (y >= 1991 && y <= 2020) {
        recSum += m; recN++;
        const e = monthRecent.get(mo) ?? { s: 0, n: 0 }; e.s += m; e.n++; monthRecent.set(mo, e);
      }
    }
    if (mx != null && mx > hottest.value && date <= recordCutoff) hottest = { date, value: mx };
    if (mn != null && mn < coldest.value && date <= recordCutoff) coldest = { date, value: mn };
  }

  const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
  const yearly = [...yearAgg.entries()]
    .map(([year, a]) => ({
      year,
      mean: round(a.sm / a.n),
      max: round(a.sMax / a.n),
      min: round(a.sMin / a.n),
      count: a.n,
      hd: a.hd, // giorni con max >= 30
      ehd: a.ehd, // giorni con max >= 35
      tn: a.tn, // notti con min >= 20
    }))
    .sort((a, b) => a.year - b.year);
  const monthly = [...monthAgg.entries()]
    .map(([month, a]) => ({
      month,
      mean: round(a.sm / a.n),
      max: round(a.sMax / a.n),
      min: round(a.sMin / a.n),
    }))
    .sort((a, b) => a.month - b.month);

  const baselineMean = baseN ? baseSum / baseN : NaN;
  const recentNormal = recN ? recSum / recN : NaN;
  const fullYears = yearly.filter((y) => y.count >= 360);
  const warmestYear = fullYears.reduce((acc, y) => (y.mean > acc.mean ? y : acc), fullYears[0]);
  const coolestYear = fullYears.reduce((acc, y) => (y.mean < acc.mean ? y : acc), fullYears[0]);

  const anomalies = yearly.map((y) => ({ year: y.year, anomaly: round(y.mean - baselineMean) }));

  const decAgg = new Map();
  for (const y of fullYears) {
    const d = Math.floor(y.year / 10) * 10;
    const e = decAgg.get(d) ?? { s: 0, n: 0 };
    e.s += y.mean; e.n++; decAgg.set(d, e);
  }
  const decades = [...decAgg.entries()]
    .map(([decade, e]) => ({
      decade,
      mean: round(e.s / e.n),
      anomaly: round(e.s / e.n - baselineMean),
      count: e.n,
    }))
    .sort((a, b) => a.decade - b.decade);

  const reg = linreg(fullYears.map((y) => [y.year, y.mean]));
  const firstY = fullYears[0];
  const lastY = fullYears[fullYears.length - 1];

  return {
    precise,
    yearly,
    anomalies,
    decades,
    monthly,
    records: {
      hottest: { date: hottest.date, value: round(hottest.value, 1) },
      coldest: { date: coldest.date, value: round(coldest.value, 1) },
      warmestYear,
      coolestYear,
      longestHeatwave:
        bestHeatwave.days > 0
          ? { days: bestHeatwave.days, start: bestHeatwave.start, end: bestHeatwave.end, peak: round(bestHeatwave.peak, 1) }
          : null,
      longestColdSnap:
        bestColdSnap.days > 0
          ? { days: bestColdSnap.days, start: bestColdSnap.start, end: bestColdSnap.end, low: round(bestColdSnap.low, 1) }
          : null,
    },
    trend: {
      perYear: round(reg.slope, 4),
      perDecade: round(reg.slope * 10, 3),
      totalChange: round(reg.slope * (lastY.year - firstY.year), 2),
      r2: round(reg.r2, 3),
      baselineMean: round(baselineMean),
      recentNormal: round(recentNormal),
      lastFullYearMean: lastY.mean,
      firstYear: firstY.year,
      lastYear: lastY.year,
    },
    startYear: yearly[0]?.year ?? 1940,
    lastDate: time[time.length - 1],
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    /* nessuno snapshot precedente */
  }

  const out = { ...existing };
  const end = todayISO();
  const refreshAll = process.env.REFRESH_ALL === "1";
  // Budget temporale: il build non deve mai bloccarsi a lungo. Ogni esecuzione
  // popola quante più città possibile entro il budget; le altre al run successivo.
  const BUDGET_MS = Number(process.env.FETCH_BUDGET_MS || 210000);
  const start = Date.now();
  let ok = 0, kept = 0, skipped = 0, deferred = 0;
  // Priorità: prima le città principali (così vengono scaricate prima di
  // esaurire il rate limit), poi le altre.
  const order = [...CITIES].sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
  for (const city of order) {
    // Di default mantieni le città già presenti (rerun = solo mancanti).
    // Ma ri-scarica le principali se manca il conteggio giorni/notti (hd)
    // o i record di durata (ondata di calore / gelo più lunghi).
    const cached = existing[city.slug];
    const hasHeat = cached?.yearly?.[0]?.hd !== undefined;
    const hasStreak = cached?.records?.longestHeatwave !== undefined;
    const hasColdStreak = cached?.records?.longestColdSnap !== undefined;
    const needsHeat = city.main && (!hasHeat || !hasStreak || !hasColdStreak);
    if (!refreshAll && cached?.yearly?.length && !needsHeat) {
      skipped++;
      continue;
    }
    if (Date.now() - start > BUDGET_MS) {
      deferred++;
      continue;
    }
    try {
      const j = await fetchDaily(city, end);
      out[city.slug] = aggregate(j);
      ok++;
      console.log(`✓ ${city.slug} (${out[city.slug].startYear}-${out[city.slug].trend.lastYear})`);
    } catch (e) {
      if (existing[city.slug]) {
        out[city.slug] = existing[city.slug];
        kept++;
        console.log(`• ${city.slug}: ${e.message} -> uso snapshot esistente`);
      } else {
        console.log(`✗ ${city.slug}: ${e.message} -> nessun dato`);
      }
    }
    await sleep(2500); // distanzia le richieste per rispettare il rate limit
  }

  // Metadati di provenienza dello snapshot: quando è stato generato, da quale
  // fonte, ed eventualmente con quale commit (disponibile nei build Vercel via
  // VERCEL_GIT_COMMIT_SHA). Permette di riprodurre esattamente questi numeri.
  out._meta = {
    generatedAt: end,
    source: "Open-Meteo Archive API — ERA5 reanalysis (ECMWF/Copernicus C3S)",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null,
  };

  writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `Snapshot: ${ok} aggiornate, ${kept} mantenute, ${skipped} saltate, ${deferred} rinviate (budget), ${Object.keys(out).filter((k) => out[k]?.yearly?.length).length}/${CITIES.length} totali. -> ${OUT}`,
  );

  // Il Build Command su Vercel è fissato dal pannello (non legge più
  // package.json "build"), quindi le didascalie AI vanno agganciate qui,
  // nello script che sappiamo essere sempre eseguito.
  const { run: generateCaptions } = await import("./generate-captions.mjs");
  await generateCaptions();
}

// Solo se eseguito direttamente (non quando importato, es. dai test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
