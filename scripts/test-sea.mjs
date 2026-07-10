// Test dell'archivio marino (scripts/fetch-sea.mjs). Nessuna chiamata di rete:
// `mergeRange` è pura, e riceve payload sintetici che riproducono i tre casi
// che contano davvero — buchi della fonte, revisione dei giorni recenti, e
// risposte che sconfinano prima dell'inizio della serie.
//
// Esegui con: node --test scripts/test-sea.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mergeRange, daysBetween, SEA_START } from "./fetch-sea.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// La fonte pubblica un decimale: ogni confronto fra media, min e max va fatto
// con questa tolleranza, non con lo zero.
const ROUNDING_UNIT = 0.1;
const EPS = 1e-9;

const empty = (start) => ({ start, mean: [], max: [], min: [] });

test("daysBetween: differenza in giorni, inclusi i cambi di mese e gli anni bisestili", () => {
  assert.equal(daysBetween("2022-11-24", "2022-11-24"), 0);
  assert.equal(daysBetween("2022-11-24", "2022-12-01"), 7);
  // 2024 è bisestile: il 29 febbraio esiste e va contato.
  assert.equal(daysBetween("2024-02-28", "2024-03-01"), 2);
  assert.equal(daysBetween("2023-02-28", "2023-03-01"), 1);
});

test("mergeRange: i null della fonte restano null, non spariscono e non slittano", () => {
  const s = empty("2022-11-24");
  mergeRange(s, {
    time: ["2022-11-24", "2022-11-25", "2022-11-26"],
    mean: [18.7, null, 18.5],
    max: [18.8, null, 18.6],
    min: [18.7, null, 18.4],
  });
  // Il buco occupa il suo posto: la lunghezza è 3, non 2. Se collassasse, ogni
  // data successiva verrebbe letta con un giorno di anticipo.
  assert.equal(s.mean.length, 3);
  assert.deepEqual(s.mean, [18.7, null, 18.5]);
  assert.equal(s.mean[2], 18.5);
});

test("mergeRange: un payload che inizia dopo l'inizio serie riempie il vuoto con null", () => {
  const s = empty("2022-11-24");
  mergeRange(s, {
    time: ["2022-11-27"], // 3 giorni dopo lo start
    mean: [17.9],
    max: [18.0],
    min: [17.8],
  });
  assert.equal(s.mean.length, 4);
  assert.deepEqual(s.mean, [null, null, null, 17.9]);
});

test("mergeRange: la finestra di revisione sovrascrive i giorni già salvati", () => {
  const s = empty("2022-11-24");
  mergeRange(s, {
    time: ["2022-11-24", "2022-11-25"],
    mean: [18.7, 18.6],
    max: [18.8, 18.7],
    min: [18.7, 18.5],
  });
  // L'analisi marina rivede il valore del 25: deve vincere il nuovo, non il vecchio.
  mergeRange(s, {
    time: ["2022-11-25", "2022-11-26"],
    mean: [19.9, 18.5],
    max: [20.0, 18.6],
    min: [19.8, 18.4],
  });
  assert.deepEqual(s.mean, [18.7, 19.9, 18.5]);
  assert.deepEqual(s.max, [18.8, 20.0, 18.6]);
  assert.equal(s.mean.length, 3, "la revisione non deve allungare la serie oltre l'ultimo giorno");
});

test("mergeRange: le date precedenti allo start vengono ignorate, non scritte a indice negativo", () => {
  const s = empty("2022-11-24");
  mergeRange(s, {
    time: ["2022-11-22", "2022-11-23", "2022-11-24"],
    mean: [null, null, 18.7],
    max: [null, null, 18.8],
    min: [null, null, 18.7],
  });
  assert.equal(s.mean.length, 1);
  assert.deepEqual(s.mean, [18.7]);
});

test("snapshot reale: struttura coerente, inizio serie dichiarato, nessun valore assurdo", () => {
  const db = JSON.parse(
    readFileSync(join(__dirname, "..", "src", "data", "sea-history.json"), "utf8"),
  );
  assert.equal(db._meta.seriesStart, SEA_START);

  const slugs = Object.keys(db).filter((k) => k !== "_meta");
  assert.equal(slugs.length, 6, "sei mari monitorati");

  for (const slug of slugs) {
    const s = db[slug];
    assert.equal(s.start, SEA_START, `${slug}: stesso inizio serie`);
    assert.equal(s.mean.length, s.max.length, `${slug}: array paralleli`);
    assert.equal(s.mean.length, s.min.length, `${slug}: array paralleli`);
    // L'ultimo indice deve corrispondere a _meta.lastDate: se gli array e la
    // data dichiarata divergessero, ogni lettura per data sarebbe sfalsata.
    assert.equal(
      daysBetween(s.start, db._meta.lastDate),
      s.mean.length - 1,
      `${slug}: lunghezza incoerente con _meta.lastDate`,
    );

    for (let i = 0; i < s.mean.length; i++) {
      if (s.mean[i] == null) continue;
      // Mediterraneo: nessun valore fuori da questo intervallo è plausibile.
      assert.ok(s.mean[i] > 5 && s.mean[i] < 35, `${slug}: media ${s.mean[i]} fuori scala`);

      // min <= max non ammette eccezioni: se i due si invertissero sarebbe uno
      // scambio di colonne, e produrrebbe scarti grandi.
      assert.ok(s.min[i] <= s.max[i] + EPS, `${slug}: min sopra max a indice ${i}`);

      // La media, invece, può cadere fino a 0,1° FUORI dall'intervallo min-max:
      // la fonte arrotonda i tre valori a un decimale in modo indipendente, e
      // d'inverno (escursione giornaliera quasi nulla) capita di leggere
      // mean=16.9 con min=max=17.0. È un artefatto di arrotondamento della
      // fonte, non un errore di aggregazione: verificato su 7860 giorni, lo
      // scarto non supera mai una singola unità di arrotondamento.
      assert.ok(
        s.min[i] - s.mean[i] <= ROUNDING_UNIT + EPS,
        `${slug}: min supera la media di più di un'unità di arrotondamento a indice ${i}`,
      );
      assert.ok(
        s.mean[i] - s.max[i] <= ROUNDING_UNIT + EPS,
        `${slug}: max sotto la media di più di un'unità di arrotondamento a indice ${i}`,
      );
    }
  }
});

test("snapshot reale: il buco della fonte (gen-feb 2025) è preservato su tutti i mari", () => {
  const db = JSON.parse(
    readFileSync(join(__dirname, "..", "src", "data", "sea-history.json"), "utf8"),
  );
  // L'API Open-Meteo Marine non ha dati dal 2025-01-29 al 2025-02-11 (verificato
  // interrogandola direttamente). Devono restare null: riempirli per
  // interpolazione significherebbe inventare 14 giorni di misure.
  const i0 = daysBetween(SEA_START, "2025-01-29");
  const i1 = daysBetween(SEA_START, "2025-02-11");
  for (const slug of Object.keys(db).filter((k) => k !== "_meta")) {
    for (let i = i0; i <= i1; i++) {
      assert.equal(db[slug].mean[i], null, `${slug}: il buco della fonte è stato riempito`);
    }
    // E il giorno subito prima e subito dopo devono avere un dato: il buco è
    // esattamente quello, non uno più largo.
    assert.notEqual(db[slug].mean[i0 - 1], null, `${slug}: manca il giorno prima del buco`);
    assert.notEqual(db[slug].mean[i1 + 1], null, `${slug}: manca il giorno dopo il buco`);
  }
});
