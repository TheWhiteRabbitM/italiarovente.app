// Test automatico della pipeline di aggregazione (scripts/fetch-history.mjs).
// Non fa alcuna chiamata di rete: costruisce una serie giornaliera sintetica
// con un trend lineare ESATTO e nessun rumore, per cui normali climatiche,
// anomalie, medie decadali e regressione hanno un valore atteso calcolabile
// a mano (formula chiusa), indipendente dal codice sotto test.
//
// Esegui con: node scripts/test-aggregation.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, linreg } from "./fetch-history.mjs";

// --- Fixture: 60 anni (1961-2020), un trend lineare perfetto -------------
// mean(anno) = 10 + 0.1 * (anno - 1961)  ->  +0.1°C/anno esatti, R²=1.
// Ogni giorno dell'anno ha lo stesso valore, così la media annua è esatta
// indipendentemente dal numero di giorni (365 o 366, anni bisestili inclusi).
function buildFixture() {
  const time = [];
  const mean = [];
  const tmax = [];
  const tmin = [];
  for (let year = 1961; year <= 2020; year++) {
    const m = 10 + 0.1 * (year - 1961);
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      time.push(d.toISOString().slice(0, 10));
      mean.push(m);
      tmax.push(m + 5);
      tmin.push(m - 5);
    }
  }
  return { daily: { time, temperature_2m_mean: mean, temperature_2m_max: tmax, temperature_2m_min: tmin } };
}

const EPS = 0.02; // tolleranza: l'output è arrotondato a 2 decimali

test("linreg: retta perfetta senza rumore -> slope esatto, R²=1", () => {
  const pts = [[0, 10], [1, 11], [2, 12], [3, 13]]; // slope=1, intercetta=10
  const { slope, r2 } = linreg(pts);
  assert.ok(Math.abs(slope - 1) < 1e-9, `slope atteso 1, ottenuto ${slope}`);
  assert.ok(Math.abs(r2 - 1) < 1e-9, `R² atteso 1, ottenuto ${r2}`);
});

test("linreg: punto singolo o serie vuota -> nessun crash, slope 0", () => {
  assert.deepEqual(linreg([]), { slope: 0, r2: 0 });
  assert.deepEqual(linreg([[2020, 15]]), { slope: 0, r2: 0 });
});

test("aggregate: gli anni bisestili contano 366 giorni, non 365 fissi", () => {
  const r = aggregate(buildFixture());
  const y1963 = r.yearly.find((y) => y.year === 1963); // non bisestile
  const y1964 = r.yearly.find((y) => y.year === 1964); // bisestile
  assert.equal(y1963.count, 365);
  assert.equal(y1964.count, 366);
});

test("aggregate: normale 1961-1990 e 1991-2020 -> calcolo indipendente per formula chiusa", () => {
  const r = aggregate(buildFixture());
  // baselineMean = 10 + 0.1 * media(0..29) = 10 + 0.1*14.5 = 11.45
  // recentNormal = 10 + 0.1 * media(30..59) = 10 + 0.1*44.5 = 14.45
  const expectedBaseline = 11.45;
  const expectedRecent = 14.45;
  assert.ok(
    Math.abs(r.trend.baselineMean - expectedBaseline) < EPS,
    `baselineMean atteso ${expectedBaseline}, ottenuto ${r.trend.baselineMean}`,
  );
  assert.ok(
    Math.abs(r.trend.recentNormal - expectedRecent) < EPS,
    `recentNormal atteso ${expectedRecent}, ottenuto ${r.trend.recentNormal}`,
  );
  // Il "riscaldamento" mostrato sul sito è sempre recentNormal - baselineMean.
  const warming = r.trend.recentNormal - r.trend.baselineMean;
  assert.ok(Math.abs(warming - 3.0) < EPS, `riscaldamento atteso +3.0°C, ottenuto ${warming}`);
});

test("aggregate: tendenza lineare -> pendenza e R² coerenti con la retta sintetica", () => {
  const r = aggregate(buildFixture());
  assert.ok(Math.abs(r.trend.perYear - 0.1) < 1e-3, `perYear atteso 0.1, ottenuto ${r.trend.perYear}`);
  assert.ok(Math.abs(r.trend.perDecade - 1.0) < 1e-2, `perDecade atteso 1.0, ottenuto ${r.trend.perDecade}`);
  assert.ok(r.trend.r2 > 0.999, `R² atteso ~1 (retta perfetta), ottenuto ${r.trend.r2}`);
});

test("aggregate: anomalia di un anno = media dell'anno meno la normale 1961-1990", () => {
  const r = aggregate(buildFixture());
  const a1961 = r.anomalies.find((a) => a.year === 1961);
  // mean(1961) = 10.0 esatto; baselineMean = 11.45 -> anomalia attesa -1.45
  assert.ok(Math.abs(a1961.anomaly - -1.45) < EPS, `anomalia 1961 attesa -1.45, ottenuta ${a1961.anomaly}`);
});

test("aggregate: media decennale = media aritmetica delle medie annue del decennio", () => {
  const r = aggregate(buildFixture());
  const d1960 = r.decades.find((d) => d.decade === 1960); // anni 1961-1969 (9 anni)
  // media(0..8)=4 -> mean = 10 + 0.1*4 = 10.4
  assert.equal(d1960.count, 9);
  assert.ok(Math.abs(d1960.mean - 10.4) < EPS, `media decade 1960 attesa 10.4, ottenuta ${d1960.mean}`);
});

test("aggregate: record di caldo/freddo coerenti con i massimi/minimi sintetici", () => {
  const r = aggregate(buildFixture());
  // tmax = mean + 5, mean cresce monotonicamente col tempo -> il record di
  // caldo deve cadere nell'ultimo anno della serie (2020).
  assert.equal(r.records.hottest.date.slice(0, 4), "2020");
  // tmin = mean - 5, mean è minima nel primo anno -> record di freddo nel 1961.
  assert.equal(r.records.coldest.date.slice(0, 4), "1961");
});
