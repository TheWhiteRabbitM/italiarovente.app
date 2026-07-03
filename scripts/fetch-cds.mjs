// Genera lo snapshot di cross-check E-OBS (src/data/eobs.json) dal Copernicus
// Climate Data Store (CDS) — dataset "insitu-gridded-observations-europe"
// (E-OBS), basato su osservazioni da stazione, INDIPENDENTE dalla rianalisi
// ERA5 già usata da fetch-history.mjs. Serve come secondo termometro, non
// come sostituto.
//
// STATO: bloccato in attesa di chiarimento sulla licenza E-OBS presso ECA&D
// (eca@knmi.nl) — la licenza E-OBS restringe l'uso a "non-commercial research
// and non-commercial education projects only". italiarovente.app è gratuito,
// senza pubblicità, MIT/open source e senza ricavi, ma l'idoneità non è
// ancora confermata da ECA&D. Finché non arriva una risposta, questo script
// NON deve girare con parametri di richiesta reali: vedi CDS_REQUEST più
// sotto e il controllo che lancia un errore se contiene ancora il sentinel
// "UNVERIFIED".
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
  return {
    Authorization: `Bearer ${token}`,
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
  // L'URL di download firmato del CDS non richiede il Bearer token (è
  // pre-autenticato), ma lo includiamo comunque: è innocuo se ignorato.
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.CDS_API_KEY ?? ""}` } });
  if (!res.ok) throw new Error(`downloadResult: HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// ⚠️⚠️⚠️  PLACEHOLDER — DA VERIFICARE PRIMA DI QUALSIASI ESECUZIONE REALE  ⚠️⚠️⚠️
//
// Questi sono i parametri della richiesta CDS per il dataset E-OBS
// ("insitu-gridded-observations-europe"), MA sono valori "best-sourced ma non
// verificati" raccolti da ricerca generica, NON dalla sessione CDS autenticata
// dell'utente. Prima di lanciare un job reale, vanno sostituiti con l'esatta
// stringa enum copiata dal pulsante "Show API request code" nella pagina del
// dataset E-OBS sul sito CDS (richiede login), che mostra il payload esatto
// per variable / product_type / grid_resolution / version / format ecc. così
// come accettati dal backend in quel momento (questi valori cambiano nel
// tempo, es. quando esce una nuova versione E-OBS).
//
// Il marcatore sentinella "UNVERIFIED" DEVE restare nell'oggetto finché non
// viene sostituito: main() controlla la sua presenza e si rifiuta di
// eseguire, per evitare un run reale accidentale con parametri sbagliati o
// con una licenza ancora non chiarita da ECA&D.
const CDS_REQUEST = {
  __verified: "UNVERIFIED", // <- rimuovere questa riga SOLO dopo aver incollato i parametri veri
  dataset: "insitu-gridded-observations-europe",
  product_type: "ensemble_mean", // media d'insieme; alternativa "elevation" per il DEM, non pertinente qui
  variable: "mean_temperature", // TG in nomenclatura E-OBS
  grid_resolution: "0.1deg", // o "0.25deg" — da confermare
  period: "full_period", // periodo storico completo disponibile
  version: "v33.0e", // versione E-OBS più recente nota da ricerca — verificare quella corrente
  format: "zip", // il file scaricato contiene tipicamente un NetCDF-4 (.nc)
};

function assertRequestVerified(request) {
  const json = JSON.stringify(request);
  if (json.includes("UNVERIFIED") || request.__verified === "UNVERIFIED") {
    throw new Error(
      "CDS_REQUEST contiene ancora il marcatore sentinella \"UNVERIFIED\": i parametri della richiesta E-OBS " +
        "(variable/grid_resolution/version/format) NON sono stati verificati contro la sessione CDS autenticata " +
        "dell'utente (pulsante \"Show API request code\" sulla pagina del dataset). Inoltre l'idoneità di " +
        "italiarovente.app alla licenza E-OBS (uso non commerciale) è ancora in attesa di conferma da ECA&D. " +
        "Questo script si rifiuta di eseguire una chiamata reale finché entrambe le condizioni non sono risolte. " +
        "Vedi il commento sopra CDS_REQUEST in scripts/fetch-cds.mjs.",
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

  // Rifiuta l'esecuzione reale finché i parametri non sono verificati e la
  // licenza non è chiarita. Questo è l'unico "path" che questo script segue
  // oggi: la parte di submit/poll/download/parse sopra è plumbing pronta ma
  // non ancora collegata a un run live.
  assertRequestVerified(CDS_REQUEST);

  // --- Da qui in poi, codice non ancora raggiungibile finché il sentinel
  // "UNVERIFIED" non viene rimosso consapevolmente da CDS_REQUEST. ---

  let existing = {};
  try {
    existing = JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    /* nessuno snapshot precedente */
  }

  const out = { ...existing };

  try {
    console.log(`Sottometto job CDS per dataset "${CDS_REQUEST.dataset}"...`);
    const jobId = await submitJob(CDS_REQUEST.dataset, CDS_REQUEST);
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
