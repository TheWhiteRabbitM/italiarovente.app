// Genera didascalie di condivisione uniche per città (src/data/captions.json).
// Eseguito al BUILD, come lo storico: una chiamata Mistral per città, non ad
// ogni richiesta. Resiliente: se una città fallisce, o manca la chiave API,
// mantiene la didascalia già presente (le pagine hanno comunque un fallback
// statico, quindi non è mai bloccante). Le città già presenti non vengono
// rigenerate (REFRESH_ALL=1 forza la rigenerazione di tutte).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateText } from "ai";
import { mistral } from "@ai-sdk/mistral";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "captions.json");
const CITIES_FILE = join(__dirname, "..", "src", "data", "cities.json");
const HISTORY_FILE = join(__dirname, "..", "src", "data", "history.json");

const CITIES = JSON.parse(readFileSync(CITIES_FILE, "utf8"));
const HISTORY = JSON.parse(readFileSync(HISTORY_FILE, "utf8"));

const MODEL = mistral("mistral-small-latest");

// Tenuto in sync a mano con src/lib/captions.ts (script .mjs, non può
// importare da src/lib/*.ts).
const SYSTEM = `Scrivi didascalie brevi per la condivisione social di Italia Rovente
(italiarovente.app), un sito che mostra dati reali di temperatura delle città
italiane dal 1940 (fonte ERA5/ECMWF via Open-Meteo).

REGOLE FERREE:
- Usa SOLO i numeri forniti nel messaggio, esattamente come scritti. Non inventarne altri.
- Rispondi con UNA SOLA riga di testo: una frase sola, punto. Non proporre alternative,
  non elencare opzioni, non andare a capo per nessun motivo.
- Massimo 160 caratteri, in italiano.
- Niente markdown, niente hashtag, niente emoji (li aggiunge il sito), niente virgolette.
- Tono diretto e fattuale: i dati parlano da soli, non serve enfasi o allarmismo.
- Varia la struttura della frase invece di ripetere sempre lo stesso schema "Città: +X°C dal Y".`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtAnomaly = (a) => `${a >= 0 ? "+" : ""}${a.toFixed(1)}°C`;

export async function run() {
  mkdirSync(dirname(OUT), { recursive: true });
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    /* nessuna didascalia precedente */
  }

  if (!process.env.MISTRAL_API_KEY) {
    console.log("MISTRAL_API_KEY assente: salto la generazione didascalie (le pagine usano il testo statico).");
    return;
  }

  const out = { ...existing };
  const refreshAll = process.env.REFRESH_ALL === "1";
  let ok = 0, kept = 0, skipped = 0;

  for (const city of CITIES) {
    const snap = HISTORY[city.slug];
    if (!snap?.trend) {
      skipped++;
      continue;
    }
    if (!refreshAll && out[city.slug]) {
      skipped++;
      continue;
    }

    const delta = snap.trend.recentNormal - snap.trend.baselineMean;
    const prompt = `Città: ${city.name}. Riscaldamento tra la normale climatica 1961-1990 (${snap.trend.baselineMean.toFixed(1)}°C) e la normale 1991-2020 (${snap.trend.recentNormal.toFixed(1)}°C): ${fmtAnomaly(delta)}. Dati dal ${snap.startYear} al ${snap.trend.lastYear}.`;

    try {
      const { text } = await generateText({ model: MODEL, system: SYSTEM, prompt, maxOutputTokens: 100 });
      // Rete di sicurezza: se il modello propone più righe/alternative
      // (ignorando "una sola riga"), tieni solo la prima frase.
      const cleaned = text.split("\n")[0].trim().replace(/^["“]|["”]$/g, "");
      if (!cleaned || cleaned.length > 220) throw new Error("risposta vuota o troppo lunga");
      out[city.slug] = cleaned;
      ok++;
      console.log(`✓ ${city.slug}: ${cleaned}`);
    } catch (e) {
      if (existing[city.slug]) {
        out[city.slug] = existing[city.slug];
        kept++;
        console.log(`• ${city.slug}: ${e.message} -> mantengo didascalia precedente`);
      } else {
        console.log(`✗ ${city.slug}: ${e.message} -> userà il fallback statico a runtime`);
      }
    }
    await sleep(300);
  }

  writeFileSync(OUT, JSON.stringify(out));
  console.log(`Didascalie: ${ok} generate, ${kept} mantenute, ${skipped} saltate. -> ${OUT}`);
}

// Eseguibile sia standalone (`npm run generate-captions`) sia importato da
// fetch-history.mjs, che lo invoca sempre dopo aver scritto lo storico — il
// Build Command su Vercel è fissato dal pannello e non possiamo aggiungere
// un terzo comando in coda, quindi l'aggancio avviene dentro lo script che è
// già certo di essere eseguito.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
