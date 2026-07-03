// Genera lo snapshot di cross-check E-OBS (src/data/eobs.json) dal Copernicus
// Climate Data Store (CDS) — dataset "insitu-gridded-observations-europe"
// (E-OBS), basato su osservazioni da stazione, INDIPENDENTE dalla rianalisi
// ERA5 già usata da fetch-history.mjs. Serve come secondo termometro, non
// come sostituto.
//
// STATO: parametri della richiesta VERIFICATI (schema pubblico del dataset +
// endpoint "costing" del CDS, vedi commento sopra CDS_REQUEST) e autenticazione
// CDS testata con successo (GET /api/profiles/v1/account, 2026-07-03). Resta
// un solo blocco: la licenza E-OBS restringe l'uso a "non-commercial research
// and non-commercial education projects only", e l'idoneità di
// italiarovente.app (gratuito, senza pubblicità, MIT/open source, senza
// ricavi) non è ancora confermata da ECA&D (eca@knmi.nl, richiesta inviata).
// Finché non arriva una risposta positiva, questo script si rifiuta di
// sottomettere un job reale — vedi assertLicenseConfirmed() più sotto.
//
// A differenza di fetch-history.mjs (chiamata sincrona, budget di pochi
// minuti, eseguita ad ogni build Vercel), il CDS lavora in modo asincrono:
// si sottomette un job, si fa polling dello stato, e la latenza può variare
// da pochi minuti a oltre 20 ore in caso di congestione. Per questo gira in
// un workflow GitHub Actions separato e schedulato mensilmente (E-OBS non
// viene aggiornato ogni giorno), non nella build del sito.
//
// Segue lo stesso stile "resiliente" di fetch-history.mjs: in caso di errore
// mantiene i dati già presenti nel file, e scrive sempre un blocco _meta con
// generatedAt/source/commit.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "eobs.json");
const CITIES_FILE = join(__dirname, "..", "src", "data", "cities.json");

const CITIES = JSON.parse(readFileSync(CITIES_FILE, "utf8"));
const MAIN_CITIES = CITIES.filter((c) => c.main).map((c) => ({
  slug: c.slug,
  name: c.name,
  lat: c.lat,
  lon: c.lon,
}));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Client CDS riutilizzabile — dataset-agnostico. Usa l'API "retrieve/v1" via
// plain fetch(), documentata ma "non ufficialmente supportata" da Copernicus:
//   POST /api/retrieve/v1/processes/{dataset}/execution   -> sottomette un job
//   GET  /api/retrieve/v1/jobs/{jobID}                    -> stato del job
//   GET  /api/retrieve/v1/jobs/{jobID}/results             -> URL di download
// Autenticazione: Bearer token dal Personal Access Token CDS (CDS_API_KEY).
// ---------------------------------------------------------------------------

const CDS_BASE = "https://cds.climate.copernicus.eu/api/retrieve/v1";

function cdsHeaders() {
  const token = process.env.CDS_API_KEY;
  if (!token) {
    throw new Error(
      "CDS_API_KEY non impostata. Su GitHub Actions è un repository secret; in locale va esportata nell'ambiente.",
    );
  }
  // Verificato con una chiamata reale (GET /api/profiles/v1/account): CDS usa
  // l'header "PRIVATE-TOKEN", non "Authorization: Bearer" (che risponde 401).
  return {
    "PRIVATE-TOKEN": token,
    "Content-Type": "application/json",
  };
}

/**
 * Sottomette un job di estrazione al CDS per il dataset indicato.
 * @param {string} dataset - id del dataset CDS, es. "insitu-gridded-observations-europe"
 * @param {object} request - oggetto "inputs" della richiesta (specifico per dataset)
 * @returns {Promise<string>} jobId
 */
export async function submitJob(dataset, request) {
  const res = await fetch(`${CDS_BASE}/processes/${dataset}/execution`, {
    method: "POST",
    headers: cdsHeaders(),
    body: JSON.stringify({ inputs: request }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`submitJob: HTTP ${res.status} — ${body.slice(0, 500)}`);
  }
  const json = await res.json();
  const jobId = json.jobID ?? json.jobId ?? json.id;
  if (!jobId) throw new Error(`submitJob: risposta senza jobID — ${JSON.stringify(json).slice(0, 300)}`);
  return jobId;
}

// Stati terminali documentati dall'API dei job CDS.
const TERMINAL_STATUSES = new Set(["successful", "failed", "dismissed"]);

/**
 * Fa polling dello stato di un job fino al completamento, con backoff
 * adattivo (per le linee guida CDS: parti da 1.0s, moltiplica per 1.5 ad ogni
 * tentativo, con un tetto a ~120s) fino a un timeout massimo complessivo.
 * @param {string} jobId
 * @param {{maxWaitMs?: number, onPoll?: (status: string, elapsedMs: number) => void}} [opts]
 * @returns {Promise<object>} il job risultante con status "successful"
 */
export async function pollJob(jobId, opts = {}) {
  // La latenza dei job CDS può superare le 20 ore in caso di congestione:
  // il default riflette questo (24h), sovrascrivibile dal chiamante.
  const maxWaitMs = opts.maxWaitMs ?? 24 * 60 * 60 * 1000;
  const start = Date.now();
  let delayMs = 1000; // 1.0s iniziale
  const CAP_MS = 120000; // tetto 120s

  for (;;) {
    const res = await fetch(`${CDS_BASE}/jobs/${jobId}`, { headers: cdsHeaders() });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`pollJob: HTTP ${res.status} — ${body.slice(0, 500)}`);
    }
    const job = await res.json();
    const status = job.status;
    opts.onPoll?.(status, Date.now() - start);

    if (status === "successful") return job;
    if (status === "failed" || status === "dismissed") {
      throw new Error(`pollJob: job ${jobId} terminato con stato "${status}" — ${JSON.stringify(job).slice(0, 500)}`);
    }
    if (TERMINAL_STATUSES.has(status)) return job;

    if (Date.now() - start > maxWaitMs) {
      throw new Error(`pollJob: timeout dopo ${Math.round((Date.now() - start) / 60000)} min (job ${jobId} ancora "${status}")`);
    }

    await sleep(delayMs);
    delayMs = Math.min(CAP_MS, delayMs * 1.5);
  }
}

/**
 * Recupera l'URL di download del risultato per un job completato.
 * @param {string} jobId
 * @returns {Promise<string>} URL diretto al file del risultato
 */
export async function getResultUrl(jobId) {
  const res = await fetch(`${CDS_BASE}/jobs/${jobId}/results`, { headers: cdsHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`getResultUrl: HTTP ${res.status} — ${body.slice(0, 500)}`);
  }
  const json = await res.json();
  // La forma esatta della risposta "results" varia per dataset/API version;
  // i formati osservati includono { asset: { value: { href } } } e varianti
  // con un array "links". Proviamo i percorsi più comuni.
  const href =
    json?.asset?.value?.href ??
    json?.href ??
    (Array.isArray(json?.links) ? json.links.find((l) => l.rel === "result" || l.href)?.href : undefined);
  if (!href) throw new Error(`getResultUrl: impossibile trovare l'URL nel risultato — ${JSON.stringify(json).slice(0, 500)}`);
  return href;
}

/**
 * Scarica il file di risultato in memoria come Buffer.
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
export async function downloadResult(url) {
  // L'URL di download firmato del CDS è tipicamente pre-autenticato (punta a
  // un object store esterno), ma includiamo comunque l'header nel caso serva.
  const res = await fetch(url, { headers: { "PRIVATE-TOKEN": process.env.CDS_API_KEY ?? "" } });
  if (!res.ok) throw new Error(`downloadResult: HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Parametri della richiesta CDS per il dataset E-OBS — VERIFICATI, non più
// placeholder. Ottenuti leggendo lo schema pubblico del dataset (metadati, non
// dati protetti da licenza) via:
//   GET /api/catalogue/v1/collections/insitu-gridded-observations-europe
//   -> link "form"/"constraints" (JSON pubblico con gli enum validi)
// e confermati end-to-end contro il vero endpoint "costing" del CDS (stima
// dimensione/costo di una richiesta, non scarica dati):
//   POST /api/retrieve/v1/processes/insitu-gridded-observations-europe/costing
//   -> risposta 200 {"id":"size","cost":1.0,"limit":100.0} con questo identico
//      oggetto, confermando che la richiesta è ben formata e verrebbe accettata.
// Questi valori vanno ri-verificati se ECA&D pubblica una nuova versione
// E-OBS (il campo "version" cambia periodicamente).
const CDS_DATASET = "insitu-gridded-observations-europe";
const CDS_REQUEST = {
  product_type: "ensemble_mean", // media d'insieme; alternative: "ensemble_spread", "elevation" (DEM, non pertinente)
  variable: "mean_temperature", // TG in nomenclatura E-OBS
  grid_resolution: "0_25deg", // o "0_1deg" per la griglia più fine (file più grande)
  period: "full_period", // valido per version 33_0e insieme a 1980_1994/1995_2010/reg_2011_2025
  version: ["33_0e"], // versione E-OBS più recente al momento della verifica (2026-07-03) — è un array
};

// L'unico vincolo rimasto NON è più tecnico (i parametri sopra sono
// verificati) ma di LICENZA: l'uso di E-OBS è limitato a "non-commercial
// research and non-commercial education projects only", e l'idoneità di
// italiarovente.app non è ancora stata confermata da ECA&D (eca@knmi.nl).
// Lo script si rifiuta di sottomettere un job reale finché non viene
// impostata esplicitamente la variabile d'ambiente EOBS_LICENSE_CONFIRMED=1
// — un opt-in deliberato, da attivare solo dopo una risposta positiva da
// ECA&D, non un default silenzioso.
function assertLicenseConfirmed() {
  if (process.env.EOBS_LICENSE_CONFIRMED !== "1") {
    throw new Error(
      "Uso di E-OBS non ancora confermato da ECA&D (eca@knmi.nl) per italiarovente.app: la licenza E-OBS " +
        "restringe l'uso a scopi di ricerca/educazione non commerciali. Questo script si rifiuta di sottomettere " +
        "un job reale finché non si imposta esplicitamente EOBS_LICENSE_CONFIRMED=1 (solo dopo una risposta " +
        "positiva). I parametri della richiesta (CDS_REQUEST) sono già verificati e pronti — vedi il commento qui sopra.",
    );
  }
}

// ---------------------------------------------------------------------------
// Parsing NetCDF (E-OBS è distribuito come NetCDF-4/HDF5) via h5wasm — scelto
// perché funziona in modo identico su Windows (sviluppo locale) e sui runner
// Ubuntu di GitHub Actions, senza step di compilazione nativa (a differenza
// di netcdf4-js). Nota: il pacchetto npm "netcdfjs" supporta solo il formato
// classico NetCDF3 e NON è adatto ai file NetCDF4 di E-OBS — non usarlo.
// ---------------------------------------------------------------------------

/**
 * Estrae, per ogni città, il valore della cella-griglia più vicina da un
 * dataset NetCDF-4 E-OBS (variabili attese: lat, lon, e la variabile
 * meteorologica richiesta, es. "tg" per la temperatura media).
 *
 * @param {Buffer} netcdfBuffer - contenuto del file .nc
 * @param {{slug: string, name: string, lat: number, lon: number}[]} cities
 * @param {string} variableName - nome della variabile NetCDF da leggere (es. "tg")
 * @returns {Promise<Record<string, number[]>>} slug -> serie di valori nel tempo
 */
export async function extractNearestGridCells(netcdfBuffer, cities, variableName) {
  const h5wasm = await import("h5wasm");
  await h5wasm.ready;

  // h5wasm opera su un filesystem virtuale in-memory (Emscripten FS).
  const FS = h5wasm.FS;
  const tmpName = `eobs-${Date.now()}.nc`;
  FS.writeFile(tmpName, new Uint8Array(netcdfBuffer));

  const file = new h5wasm.File(tmpName, "r");
  try {
    const lat = file.get("latitude")?.value ?? file.get("lat")?.value;
    const lon = file.get("longitude")?.value ?? file.get("lon")?.value;
    const varDataset = file.get(variableName);
    if (!lat || !lon || !varDataset) {
      throw new Error(
        `extractNearestGridCells: variabili attese non trovate nel NetCDF (lat/lon/${variableName}). ` +
          `Chiavi disponibili: ${Object.keys(file.keys?.() ?? {})}`,
      );
    }
    const values = varDataset.value; // atteso: array [time, lat, lon] appiattito

    function nearestIndex(arr, target) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < arr.length; i++) {
        const d = Math.abs(arr[i] - target);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    const result = {};
    for (const city of cities) {
      const latIdx = nearestIndex(lat, city.lat);
      const lonIdx = nearestIndex(lon, city.lon);
      // Estrazione della serie temporale per la cella (latIdx, lonIdx).
      // La forma esatta (ordine degli assi) va confermata contro il file
      // NetCDF reale una volta ottenuto — placeholder strutturale per ora.
      const nLat = lat.length;
      const nLon = lon.length;
      const nTime = values.length / (nLat * nLon);
      const series = [];
      for (let t = 0; t < nTime; t++) {
        const idx = t * nLat * nLon + latIdx * nLon + lonIdx;
        series.push(values[idx]);
      }
      result[city.slug] = series;
    }
    return result;
  } finally {
    file.close();
    FS.unlink(tmpName);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });

  // Rifiuta l'esecuzione reale finché la licenza non è chiarita da ECA&D
  // (i parametri della richiesta sono già verificati, vedi sopra).
  assertLicenseConfirmed();

  // --- Da qui in poi, codice non ancora raggiungibile finché non si imposta
  // esplicitamente EOBS_LICENSE_CONFIRMED=1 (solo dopo il via libera ECA&D). ---

  let existing = {};
  try {
    existing = JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    /* nessuno snapshot precedente */
  }

  const out = { ...existing };

  try {
    console.log(`Sottometto job CDS per dataset "${CDS_DATASET}"...`);
    const jobId = await submitJob(CDS_DATASET, CDS_REQUEST);
    console.log(`Job sottomesso: ${jobId}. Polling...`);
    const job = await pollJob(jobId, {
      onPoll: (status, elapsedMs) => console.log(`  [${Math.round(elapsedMs / 1000)}s] stato: ${status}`),
    });
    const resultUrl = await getResultUrl(job.jobID ?? jobId);
    console.log(`Download risultato da ${resultUrl}...`);
    const buffer = await downloadResult(resultUrl);

    const variableName = "tg"; // E-OBS: "tg" = temperatura media giornaliera
    const series = await extractNearestGridCells(buffer, MAIN_CITIES, variableName);

    // TODO: aggregare la serie giornaliera per anno (mean temp) nello stesso
    // stile di aggregate() in fetch-history.mjs, una volta note la forma e la
    // frequenza reali dei dati restituiti da CDS.
    for (const city of MAIN_CITIES) {
      out[city.slug] = { series: series[city.slug] ?? null };
    }
  } catch (e) {
    console.error(`Errore nel fetch CDS/E-OBS: ${e.message} -> mantengo i dati esistenti`);
    // Resiliente come fetch-history.mjs: in caso di errore, non tocca i dati
    // già presenti nel file.
  }

  out._meta = {
    generatedAt: todayISO(),
    source: "Copernicus Climate Data Store — E-OBS ensemble mean",
    commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : null,
    status: "pending-license-clarification",
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Scritto ${OUT}`);
}

// Solo se eseguito direttamente (non quando importato, es. dai test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
