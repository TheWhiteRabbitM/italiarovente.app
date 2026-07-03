// Genera lo snapshot di cross-check E-OBS (src/data/eobs.json) dal Copernicus
// Climate Data Store (CDS) — dataset "insitu-gridded-observations-europe"
// (E-OBS), basato su osservazioni da stazione, INDIPENDENTE dalla rianalisi
// ERA5 già usata da fetch-history.mjs. Serve come secondo termometro, non
// come sostituto.
//
// STATO: SBLOCCATO. Parametri della richiesta verificati (schema pubblico del
// dataset + endpoint "costing" del CDS), autenticazione CDS testata con
// successo, e — 2026-07-03 — ECA&D (eca@knmi.nl) ha confermato via email che
// l'uso descritto (validare le nostre analisi ERA5 e pubblicare statistiche
// aggregate derivate, MAI i dati E-OBS grezzi, con attribuzione) rientra
// nell'uso non commerciale consentito, a tre condizioni esplicite:
//   1. il progetto resta non commerciale;
//   2. il dataset E-OBS grezzo non viene ridistribuito — solo aggregati
//      (medie annue/decadali), mai la serie giornaliera puntuale scaricata;
//   3. le citazioni richieste (E-OBS/ECA&D/UERRA/Copernicus + Cornes et al.
//      2018, vedi ATTRIBUTION più sotto) compaiono sul sito.
// La condizione 2 è applicata nel codice: extractNearestGridCells() estrae la
// serie giornaliera solo come passo intermedio in memoria, MAI scritta su
// disco; main() la aggrega subito a medie annue prima di scrivere eobs.json.
// Se in futuro il progetto cambiasse natura (es. pubblicità, monetizzazione),
// ECA&D va ricontattata: non dare per scontato che questo via libera resti
// valido a tempo indeterminato.
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

/**
 * CDS impacchetta il risultato E-OBS in uno ZIP contenente un singolo file
 * NetCDF-4 (.nc) — scoperto empiricamente: l'URL del risultato termina in
 * ".zip" e il buffer scaricato non ha la signature HDF5 (h5wasm lo rifiuta
 * con "Not an HDF5 file" se passato direttamente). Questa funzione estrae il
 * primo file .nc trovato nello zip.
 * @param {Buffer} zipBuffer
 * @returns {Promise<Buffer>} contenuto del file .nc
 */
export async function extractNetcdfFromZip(zipBuffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(zipBuffer);
  const ncEntry = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith(".nc"));
  if (!ncEntry) {
    throw new Error(
      `extractNetcdfFromZip: nessun file .nc trovato nello zip. Contenuto: ${Object.keys(zip.files).join(", ")}`,
    );
  }
  const arrayBuffer = await ncEntry.async("arraybuffer");
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

// Testo di attribuzione richiesto dalla licenza E-OBS (condizione 3 sopra) —
// da mostrare ovunque compaiano dati derivati da E-OBS sul sito (pagina città,
// disclaimer). Riutilizzato anche in src/lib/eobs.ts.
export const EOBS_ATTRIBUTION = {
  it: "Dati E-OBS: progetto UERRA (EU-FP6) e Copernicus Climate Change Service; fornitori dei dati: rete ECA&D (ecad.eu). Fonte: Cornes, R., G. van der Schrier, E.J.M. van den Besselaar, and P.D. Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation Datasets.",
  en: "E-OBS data: EU-FP6 project UERRA and the Copernicus Climate Change Service; data providers: the ECA&D project (ecad.eu). Source: Cornes, R., G. van der Schrier, E.J.M. van den Besselaar, and P.D. Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation Datasets.",
};

// Anche con il via libera di ECA&D, lo script si rifiuta di sottomettere un
// job reale finché non si imposta esplicitamente la variabile d'ambiente
// EOBS_LICENSE_CONFIRMED=1 — un opt-in deliberato invece di un default
// silenzioso, coerente con come questo script è stato progettato fin
// dall'inizio (misura doppia, taglia una volta).
function assertLicenseConfirmed() {
  if (process.env.EOBS_LICENSE_CONFIRMED !== "1") {
    throw new Error(
      "EOBS_LICENSE_CONFIRMED non impostata a \"1\": anche se ECA&D ha confermato l'idoneità di italiarovente.app " +
        "(email del 2026-07-03, vedi commento in testa al file), questo script richiede comunque l'opt-in esplicito " +
        "prima di sottomettere un job reale, per evitare esecuzioni accidentali.",
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

// Decodifica un'unità di tempo CF-convention tipo "days since 1950-01-01
// 00:00:00" in una data di partenza, per convertire l'indice temporale del
// NetCDF in anno solare senza dipendere da una libreria CF completa.
function parseCfTimeUnits(unitsStr) {
  const m = /days since (\d{4}-\d{2}-\d{2})/.exec(unitsStr ?? "");
  if (!m) throw new Error(`parseCfTimeUnits: formato unità tempo non riconosciuto: "${unitsStr}"`);
  return new Date(m[1] + "T00:00:00Z");
}

/**
 * Estrae, per ogni città, la serie giornaliera della cella-griglia più
 * vicina da un dataset NetCDF-4 E-OBS, e la aggrega SUBITO a medie annue —
 * la serie giornaliera intermedia resta solo in memoria, non viene mai
 * restituita né scritta su disco (condizione di licenza ECA&D: solo
 * aggregati derivati, mai il dato E-OBS grezzo).
 *
 * @param {Buffer} netcdfBuffer - contenuto del file .nc
 * @param {{slug: string, name: string, lat: number, lon: number}[]} cities
 * @param {string} variableName - nome della variabile NetCDF da leggere (es. "tg")
 * @returns {Promise<Record<string, {year: number, mean: number, count: number}[]>>}
 */
export async function extractYearlyMeans(netcdfBuffer, cities, variableName) {
  const h5wasm = await import("h5wasm");
  await h5wasm.ready;

  // h5wasm opera su un filesystem virtuale in-memory (Emscripten FS).
  const FS = h5wasm.FS;
  const tmpName = `eobs-${Date.now()}.nc`;
  FS.writeFile(tmpName, new Uint8Array(netcdfBuffer));

  const file = new h5wasm.File(tmpName, "r");
  try {
    const latDs = file.get("latitude") ?? file.get("lat");
    const lonDs = file.get("longitude") ?? file.get("lon");
    const timeDs = file.get("time");
    const varDs = file.get(variableName);
    if (!latDs || !lonDs || !timeDs || !varDs) {
      throw new Error(
        `extractYearlyMeans: variabili attese non trovate nel NetCDF (latitude/longitude/time/${variableName}). ` +
          `Chiavi disponibili: ${JSON.stringify(Object.keys(file.keys ? file.keys() : file))}`,
      );
    }
    const lat = latDs.value; // piccolo (~200 elementi), letto interamente senza problemi
    const lon = lonDs.value; // idem (~500 elementi)
    const timeRaw = timeDs.value; // piccolo (~28k elementi, giorni interi)
    // Gli attributi stringa di h5wasm (units/long_name/...) sono già stringhe
    // JS normali — NON array da indicizzare con [0] (bug scoperto ispezionando
    // il file reale: "days since 1950-01-01"[0] === "d").
    const timeUnits = timeDs.attrs?.units?.value;
    const epoch = parseCfTimeUnits(timeUnits);
    const years = [...timeRaw].map((d) => {
      const date = new Date(epoch.getTime() + d * 86400000);
      return date.getUTCFullYear();
    });

    // Il dato "tg" è impacchettato come intero a 16 bit (dtype "<h") con
    // scale_factor/add_offset — scoperto ispezionando il file reale: il
    // valore reale è raw*scale_factor + add_offset, e il valore mancante è
    // -9999 nel dominio IMPACCHETTATO (va confrontato prima di scompattare).
    // Questi attributi numerici SONO array-like con un solo elemento (a
    // differenza degli attributi stringa sopra) -> [0] indexing corretto qui.
    const scaleFactor = varDs.attrs?.scale_factor?.value?.[0] ?? 1;
    const addOffset = varDs.attrs?.add_offset?.value?.[0] ?? 0;
    const fillValue = varDs.attrs?._FillValue?.value?.[0] ?? varDs.attrs?.missing_value?.value?.[0];

    // E-OBS è un dataset SOLO TERRA: per le città costiere, la cella-griglia
    // più vicina in assoluto può cadere in mare (interamente fill value) —
    // scoperto empiricamente su 5 delle 12 città principali (Palermo, Genova,
    // Bari, Venezia, Cagliari, tutte costiere). Per questo si generano più
    // celle candidate ordinate per distanza reale (non nearest per-asse
    // indipendente, che può combinare un lat e un lon "vicini" in una cella
    // di mare) entro un raggio di ricerca, e si prova ciascuna finché non se
    // ne trova una con dati sufficientemente completi.
    const SEARCH_RADIUS_DEG = 1.5; // ~6 celle a 0.25°, ampio abbastanza per una penisola stretta
    const MIN_VALID_YEARS = 50; // su ~76 anni attesi: soglia per scartare celle quasi-vuote

    function candidateCells(targetLat, targetLon) {
      const candidates = [];
      for (let i = 0; i < lat.length; i++) {
        if (Math.abs(lat[i] - targetLat) > SEARCH_RADIUS_DEG) continue;
        for (let j = 0; j < lon.length; j++) {
          if (Math.abs(lon[j] - targetLon) > SEARCH_RADIUS_DEG) continue;
          const d = Math.hypot(lat[i] - targetLat, lon[j] - targetLon);
          candidates.push({ latIdx: i, lonIdx: j, d });
        }
      }
      candidates.sort((a, b) => a.d - b.d);
      return candidates;
    }

    const nTime = timeRaw.length;

    function aggregateCell(latIdx, lonIdx) {
      // Lettura a fetta (hyperslab): solo la colonna [tutti i tempi, questa
      // cella], non l'intero cubo europeo — necessario, l'intero array "tg"
      // (~5 GB da scompattato) eccede il limite di memoria di h5wasm (2 GB).
      const raw = varDs.slice([
        [0, nTime, 1],
        [latIdx, latIdx + 1, 1],
        [lonIdx, lonIdx + 1, 1],
      ]);

      // Media annua: somma/conteggio dei giorni validi per anno, MAI la
      // serie giornaliera stessa conservata oltre questo ciclo (condizione
      // di licenza ECA&D: solo aggregati derivati).
      const yearAgg = new Map();
      for (let t = 0; t < nTime; t++) {
        const rv = raw[t];
        if (rv === fillValue) continue;
        const v = rv * scaleFactor + addOffset;
        const y = years[t];
        const a = yearAgg.get(y) ?? { sum: 0, n: 0 };
        a.sum += v;
        a.n += 1;
        yearAgg.set(y, a);
      }
      return [...yearAgg.entries()]
        .map(([year, a]) => ({ year, mean: Math.round((a.sum / a.n) * 100) / 100, count: a.n }))
        .sort((a, b) => a.year - b.year);
    }

    const result = {};
    for (const city of cities) {
      const candidates = candidateCells(city.lat, city.lon);
      let yearly = [];
      let usedCandidate = null;
      for (const c of candidates) {
        const attempt = aggregateCell(c.latIdx, c.lonIdx);
        if (attempt.length >= MIN_VALID_YEARS) {
          yearly = attempt;
          usedCandidate = c;
          break;
        }
      }
      if (!usedCandidate) {
        console.warn(
          `  [${city.slug}] nessuna cella valida trovata entro ${SEARCH_RADIUS_DEG}° (${candidates.length} candidate provate) — probabile isola/costa isolata.`,
        );
      } else if (usedCandidate.d > 0.3) {
        console.log(
          `  [${city.slug}] cella più vicina era in mare/mancante, usata quella a ${usedCandidate.d.toFixed(2)}° di distanza.`,
        );
      }
      result[city.slug] = yearly;
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
    const zipBuffer = await downloadResult(resultUrl);
    console.log(`Scaricati ${zipBuffer.length} byte (zip). Estraggo il NetCDF...`);
    const buffer = await extractNetcdfFromZip(zipBuffer);
    console.log(`NetCDF estratto: ${buffer.length} byte. Parsing...`);
    if (process.env.EOBS_DEBUG_SAVE_NC) {
      writeFileSync(process.env.EOBS_DEBUG_SAVE_NC, buffer);
      console.log(`[debug] NetCDF salvato in ${process.env.EOBS_DEBUG_SAVE_NC}`);
    }

    const variableName = "tg"; // E-OBS: "tg" = temperatura media giornaliera
    const yearly = await extractYearlyMeans(buffer, MAIN_CITIES, variableName);

    for (const city of MAIN_CITIES) {
      out[city.slug] = { yearly: yearly[city.slug] ?? null };
    }
    console.log(`Estratte medie annue per ${MAIN_CITIES.length} città.`);
  } catch (e) {
    console.error(`Errore nel fetch CDS/E-OBS: ${e.message} -> mantengo i dati esistenti`);
    // Resiliente come fetch-history.mjs: in caso di errore, non tocca i dati
    // già presenti nel file.
  }

  out._meta = {
    generatedAt: todayISO(),
    source: "Copernicus Climate Data Store — E-OBS ensemble mean (station-based, independent of ERA5)",
    commit: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : null,
    status: "confirmed",
    licenseConfirmedBy: "ECA&D (eca@knmi.nl), 2026-07-03",
    licenseConditions: [
      "non-commercial use only",
      "raw E-OBS data not redistributed (yearly means only)",
      "attribution required — see EOBS_ATTRIBUTION",
    ],
    attribution: EOBS_ATTRIBUTION,
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
