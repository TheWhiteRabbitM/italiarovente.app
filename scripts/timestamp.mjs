// Ancora il fingerprint del dataset (src/data/history.json → _meta.sha256) alla
// blockchain di Bitcoin tramite OpenTimestamps. Non mette i dati on-chain: solo
// l'hash. Produce una prova .ots che CHIUNQUE può verificare in autonomia
// (`ots verify`), senza fidarsi di noi, dimostrando che quell'esatto dataset
// esisteva a una certa data e non è più cambiato.
//
//   node scripts/timestamp.mjs
//
// Gratis, senza wallet/monete/gas. La prova nasce "pending" (attestata dai
// calendar server) ed entra in un blocco Bitcoin entro qualche ora; per
// includere l'attestazione Bitcoin definitiva si rilancia più tardi:
//   node scripts/timestamp.mjs --upgrade
//
// Le prove vivono in public/ots/ (scaricabili) e l'indice in
// src/data/ots-stamps.json (letto dalla pagina /dati). Vanno committate.

import OpenTimestamps from "opentimestamps";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OTS_DIR = join(ROOT, "public", "ots");
const INDEX = join(ROOT, "src", "data", "ots-stamps.json");
mkdirSync(OTS_DIR, { recursive: true });

const { DetachedTimestampFile, Ops } = OpenTimestamps;

function loadIndex() {
  if (!existsSync(INDEX)) return [];
  try {
    return JSON.parse(readFileSync(INDEX, "utf8"));
  } catch {
    return [];
  }
}

// --- Modalità upgrade: completa le prove pending con l'attestazione Bitcoin ---
async function upgradeAll() {
  const files = readdirSync(OTS_DIR).filter((f) => f.endsWith(".ots"));
  let upgraded = 0;
  for (const f of files) {
    const bytes = readFileSync(join(OTS_DIR, f));
    const det = DetachedTimestampFile.deserialize([...bytes]);
    const changed = await OpenTimestamps.upgrade(det);
    if (changed) {
      writeFileSync(join(OTS_DIR, f), Buffer.from(det.serializeToBytes()));
      upgraded++;
      console.log(`⬆️  ${f}: attestazione Bitcoin aggiunta`);
    } else {
      console.log(`• ${f}: ancora pending (nessun blocco Bitcoin ancora)`);
    }
  }
  console.log(`Fatto. ${upgraded}/${files.length} prove aggiornate.`);
}

// --- Modalità stamp: ancora il fingerprint corrente ---------------------------
async function stampCurrent() {
  const history = JSON.parse(readFileSync(join(ROOT, "src", "data", "history.json"), "utf8"));
  const meta = history._meta;
  if (!meta?.sha256) throw new Error("history.json senza _meta.sha256 — rilancia prima `npm run fetch-history`");

  const date = meta.generatedAt || "unknown";
  const sha8 = meta.sha256.slice(0, 8);
  const base = `stamp-${date}-${sha8}`;
  const manifestPath = join(OTS_DIR, `${base}.txt`);
  const otsPath = join(OTS_DIR, `${base}.ots`);

  const index = loadIndex();
  if (index.some((e) => e.sha256 === meta.sha256)) {
    console.log(`Il fingerprint ${sha8}… è già stato marcato temporalmente. Niente da fare.`);
    console.log("(Per completare le prove pending con Bitcoin: node scripts/timestamp.mjs --upgrade)");
    return;
  }

  // Manifesto testuale, deterministico: è QUESTO che viene marcato. Contiene il
  // fingerprint, quindi ancorare il manifesto ancora l'intero dataset.
  const manifest =
    [
      "Italia Rovente — dataset integrity manifest",
      `dataset_sha256: ${meta.sha256}`,
      `generated_at: ${date}`,
      `commit: ${meta.commit || "-"}`,
      `source: ${meta.source || "Open-Meteo Archive API — ERA5 (ECMWF/Copernicus C3S)"}`,
      "method: two 30-year normals (1961-1990 vs 1991-2020); reproduce from Copernicus, see https://italiarovente.app/dati",
      "",
    ].join("\n");
  const manifestBytes = Buffer.from(manifest, "utf8");
  writeFileSync(manifestPath, manifestBytes);

  console.log(`Marco temporalmente il fingerprint ${sha8}… (contatto i calendar server)…`);
  const detached = DetachedTimestampFile.fromBytes(new Ops.OpSHA256(), manifestBytes);
  await OpenTimestamps.stamp(detached);
  writeFileSync(otsPath, Buffer.from(detached.serializeToBytes()));

  const entry = {
    date,
    sha256: meta.sha256,
    commit: meta.commit || null,
    manifest: `/ots/${base}.txt`,
    ots: `/ots/${base}.ots`,
  };
  writeFileSync(INDEX, JSON.stringify([entry, ...index], null, 2) + "\n");

  console.log(`✓ Prova salvata: public/ots/${base}.ots`);
  console.log(`✓ Manifesto:     public/ots/${base}.txt`);
  console.log(`✓ Indice:        src/data/ots-stamps.json`);
  console.log("La prova è 'pending' (calendar); rilancia con --upgrade fra qualche ora per l'attestazione Bitcoin.");
}

const run = process.argv.includes("--upgrade") ? upgradeAll : stampCurrent;
run().catch((e) => {
  console.error("Errore:", e.message);
  process.exit(1);
});
