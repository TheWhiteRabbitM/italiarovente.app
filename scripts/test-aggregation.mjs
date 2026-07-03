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

test("linreg: retta perfetta senza rumore -> slope esatto, R²=1, IC95 nullo (nessun residuo)", () => {
  const pts = [[0, 10], [1, 11], [2, 12], [3, 13]]; // slope=1, intercetta=10
  const { slope, r2, ciMargin } = linreg(pts);
  assert.ok(Math.abs(slope - 1) < 1e-9, `slope atteso 1, ottenuto ${slope}`);
  assert.ok(Math.abs(r2 - 1) < 1e-9, `R² atteso 1, ottenuto ${r2}`);
  // Punti perfettamente allineati -> nessun residuo -> varianza residua 0 ->
  // errore standard 0 -> margine dell'IC 0 (nessuna incertezza da stimare).
  assert.ok(Math.abs(ciMargin) < 1e-9, `ciMargin atteso ~0, ottenuto ${ciMargin}`);
});

test("linreg: punto singolo o serie vuota -> nessun crash, slope 0, IC non calcolabile", () => {
  const empty = linreg([]);
  assert.equal(empty.slope, 0);
  assert.equal(empty.r2, 0);
  assert.ok(Number.isNaN(empty.ciMargin), "IC non calcolabile con 0 punti -> NaN");

  const single = linreg([[2020, 15]]);
  assert.equal(single.slope, 0);
  assert.equal(single.r2, 0);
  assert.ok(Number.isNaN(single.ciMargin), "IC non calcolabile con 1 solo punto -> NaN");
});

test("linreg: IC95 su un esempio con rumore noto -> formula chiusa indipendente", () => {
  // Punti scelti a mano: x = 0..4, y con uno scarto noto dalla retta esatta
  // y = 2x + 1, per poter calcolare SSE/SE/IC a mano senza dipendere dal
  // codice sotto test.
  const pts = [[0, 1.2], [1, 2.8], [2, 5.3], [3, 6.7], [4, 9.1]];
  const n = pts.length;
  const sx = pts.reduce((s, [x]) => s + x, 0);
  const sy = pts.reduce((s, [, y]) => s + y, 0);
  const sxx = pts.reduce((s, [x]) => s + x * x, 0);
  const sxy = pts.reduce((s, [x, y]) => s + x * y, 0);
  const slopeExp = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const interceptExp = (sy - slopeExp * sx) / n;
  const sseExp = pts.reduce((s, [x, y]) => s + (y - (interceptExp + slopeExp * x)) ** 2, 0);
  const df = n - 2;
  const sxxDevExp = sxx - (sx * sx) / n;
  const seExp = Math.sqrt(sseExp / df / sxxDevExp);
  // df=3 -> valore critico t tabulato esatto per un IC al 95% (due code) = 3.182.
  const ciExp = 3.182 * seExp;

  const { slope, ciMargin } = linreg(pts);
  assert.ok(Math.abs(slope - slopeExp) < 1e-9, `slope atteso ${slopeExp}, ottenuto ${slope}`);
  assert.ok(
    Math.abs(ciMargin - ciExp) < 1e-6,
    `ciMargin atteso ${ciExp} (formula chiusa, df=3, t=3.182), ottenuto ${ciMargin}`,
  );
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
  // Fixture senza rumore -> nessun residuo -> IC95 sulla pendenza ~0.
  assert.ok(
    Math.abs(r.trend.perDecadeCi95) < 1e-2,
    `perDecadeCi95 atteso ~0 (retta perfetta), ottenuto ${r.trend.perDecadeCi95}`,
  );
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

// Un anno intero "noioso" (1990, sotto ogni soglia) prima dei giorni di
// test: aggregate() richiede almeno un anno completo (>=360 giorni validi)
// per calcolare trend/decenni senza andare in errore — qui serve solo a
// soddisfare quel requisito, non interferisce con i test sulle sequenze.
function boringYear(year) {
  const days = [];
  for (let m = 0; m < 12; m++) {
    const last = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= last; d++) {
      const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push([date, 15]);
    }
  }
  return days;
}

function fixtureFromDays(days) {
  // days: array di [dataISO, tmax], anteposto a un anno "noioso" per dare
  // ad aggregate() almeno un anno completo -> costruisce un input minimo.
  const all = [...boringYear(1990), ...days];
  return {
    daily: {
      time: all.map(([d]) => d),
      temperature_2m_mean: all.map(([, mx]) => mx - 5),
      temperature_2m_max: all.map(([, mx]) => mx),
      temperature_2m_min: all.map(([, mx]) => mx - 10),
    },
  };
}

test("aggregate: ondata di calore -> vince la sequenza consecutiva più lunga, non la somma totale", () => {
  // 3 giorni >=35°, un giorno sotto soglia (interrompe), poi 6 giorni >=35°.
  const days = [
    ["2015-07-01", 35], ["2015-07-02", 35], ["2015-07-03", 35],
    ["2015-07-04", 34], // sotto soglia -> interrompe la sequenza
    ["2015-07-05", 35], ["2015-07-06", 35], ["2015-07-07", 35],
    ["2015-07-08", 35], ["2015-07-09", 35], ["2015-07-10", 35],
  ];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestHeatwave.days, 6, `attesi 6 giorni, ottenuti ${r.records.longestHeatwave.days}`);
  assert.equal(r.records.longestHeatwave.start, "2015-07-05");
  assert.equal(r.records.longestHeatwave.end, "2015-07-10");
});

test("aggregate: un buco nella serie (data mancante) interrompe la sequenza anche se i valori qualificano", () => {
  // 5 giorni >=35°, poi un salto di 2 giorni (data mancante), poi altri 4.
  const days = [
    ["2015-08-01", 36], ["2015-08-02", 36], ["2015-08-03", 36], ["2015-08-04", 36], ["2015-08-05", 36],
    // 2015-08-06 mancante -> non consecutivo
    ["2015-08-07", 36], ["2015-08-08", 36], ["2015-08-09", 36], ["2015-08-10", 36],
  ];
  const r = aggregate(fixtureFromDays(days));
  // Se il buco NON interrompesse la sequenza, il totale sarebbe 9 giorni.
  assert.equal(r.records.longestHeatwave.days, 5, `attesi 5 giorni (il buco deve interrompere), ottenuti ${r.records.longestHeatwave.days}`);
  assert.equal(r.records.longestHeatwave.start, "2015-08-01");
  assert.equal(r.records.longestHeatwave.end, "2015-08-05");
});

test("aggregate: nessun giorno sopra soglia -> longestHeatwave è null", () => {
  const days = [["2015-01-01", 10], ["2015-01-02", 12], ["2015-01-03", 8]];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestHeatwave, null);
});

// tmin = tmax - 10 nella fixture: per testare il gelo (tmin <= 0) bastano
// tmax bassi (es. tmax=5 -> tmin=-5). Nessun collegamento col caldo: sono
// due sequenze indipendenti calcolate nello stesso giro del ciclo.
test("aggregate: notti di gelo -> vince la sequenza consecutiva più lunga, non la somma totale", () => {
  const days = [
    ["2016-01-01", 5], ["2016-01-02", 5], ["2016-01-03", 5], // tmin -5,-5,-5
    ["2016-01-04", 15], // tmin 5, sopra zero -> interrompe
    ["2016-01-05", 5], ["2016-01-06", 5], ["2016-01-07", 5], ["2016-01-08", 5], ["2016-01-09", 5],
  ];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestColdSnap.days, 5, `attesi 5 giorni, ottenuti ${r.records.longestColdSnap.days}`);
  assert.equal(r.records.longestColdSnap.start, "2016-01-05");
  assert.equal(r.records.longestColdSnap.end, "2016-01-09");
  assert.ok(Math.abs(r.records.longestColdSnap.low - -5) < EPS, `low atteso -5, ottenuto ${r.records.longestColdSnap.low}`);
});

test("aggregate: un buco nella serie interrompe anche la sequenza di gelo", () => {
  const days = [
    ["2016-02-01", 5], ["2016-02-02", 5], ["2016-02-03", 5], ["2016-02-04", 5],
    // 2016-02-05 mancante -> non consecutivo
    ["2016-02-06", 5], ["2016-02-07", 5],
  ];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestColdSnap.days, 4, `attesi 4 giorni (il buco deve interrompere), ottenuti ${r.records.longestColdSnap.days}`);
});

test("aggregate: nessun giorno sotto soglia -> longestColdSnap è null", () => {
  const days = [["2016-03-01", 20], ["2016-03-02", 22], ["2016-03-03", 18]];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestColdSnap, null);
});

test("aggregate: caldo e gelo sono sequenze indipendenti calcolate nello stesso passaggio", () => {
  const days = [
    ["2017-06-01", 36], ["2017-06-02", 36], ["2017-06-03", 36], // ondata di calore, 3gg
    ["2017-06-04", 15], // giorno neutro
    ["2017-07-01", 4], ["2017-07-02", 4], // gelo, 2gg (tmin -6)
  ];
  const r = aggregate(fixtureFromDays(days));
  assert.equal(r.records.longestHeatwave.days, 3);
  assert.equal(r.records.longestColdSnap.days, 2);
});
