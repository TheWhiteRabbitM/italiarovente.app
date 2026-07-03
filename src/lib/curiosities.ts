// Dati e testi condivisi per le "curiosità" delle città (record estivo,
// gemello climatico, gradi giorno): un unico posto che calcola sia il
// contenuto della mini-pagina di condivisione sia l'immagine OG dedicata,
// così il link condiviso mostra davvero il fatto specifico e non la scheda
// generica della città.
import { CITIES, getCity, cityName, type City } from "./cities";
import { getArchiveStats, getForecast } from "./weather";
import { getClimateAnalog, fmtDecade } from "./climateAnalog";
import { gradiGiorno, ggZone } from "./degreedays";
import { fmtTemp, fmtDate } from "./format";

export type CuriosityKind =
  | "record-estivo"
  | "record-invernale"
  | "gemello-climatico"
  | "gradi-giorno"
  | "record-durata"
  | "record-durata-freddo"
  | "record-caldo"
  | "record-freddo";
export const CURIOSITY_KINDS: CuriosityKind[] = [
  "record-estivo",
  "record-invernale",
  "gemello-climatico",
  "gradi-giorno",
  "record-durata",
  "record-durata-freddo",
  "record-caldo",
  "record-freddo",
];

export type CuriosityPayload = {
  eyebrow: string;
  pageTitle: string;
  bigText: string;
  bigColor: string;
  subLine: string;
  shareText: string;
  metaTitle: string;
  metaDescription: string;
};

async function recordEstivo(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive || archive.precise === false) return null;
  const hot = archive.records.hottest;
  const hotYear = parseInt(hot.date.slice(0, 4), 10);
  const hotMonth = parseInt(hot.date.slice(5, 7), 10);
  if (hotMonth < 6 || hotMonth > 8) return null;

  const forecast = await getForecast(city);
  const curTemp = forecast.current.temp;
  if (curTemp == null) return null;
  const nowDate = new Date();
  const curMonth = nowDate.getUTCMonth() + 1;
  if (curMonth < 6 || curMonth > 9) return null;
  const yearsAgo = nowDate.getUTCFullYear() - hotYear;
  if (yearsAgo <= 0) return null;

  const cooler = curTemp < hot.value;
  const date = fmtDate(hot.date, lang);
  const curT = fmtTemp(curTemp, 0);
  const hotT = fmtTemp(hot.value, 1);

  const text =
    lang === "en"
      ? cooler
        ? `With ${curT} in ${name} today, take comfort: on ${date} (${yearsAgo} years ago) it hit ${hotT} here — the all-time record since 1940.`
        : `With ${curT}, ${name} today is very close to the all-time record: ${hotT} on ${date} (${yearsAgo} years ago).`
      : cooler
        ? `Con ${curT} a ${name} oggi, consolati: il ${date} (${yearsAgo} anni fa) qui si toccarono ${hotT} — il record assoluto della serie dal 1940.`
        : `Con ${curT}, ${name} oggi è vicinissima al record assoluto di sempre: ${hotT} del ${date} (${yearsAgo} anni fa).`;

  return {
    eyebrow: lang === "en" ? "🔥 Summer record" : "🔥 Record estivo",
    pageTitle: lang === "en" ? `${name}'s all-time summer record` : `Il record estivo assoluto di ${name}`,
    bigText: hotT,
    bigColor: "#ffab98",
    subLine:
      lang === "en"
        ? `${date} — ${yearsAgo} years ago. Today: ${curT}.`
        : `${date} — ${yearsAgo} anni fa. Oggi: ${curT}.`,
    shareText: text,
    metaTitle:
      lang === "en" ? `${name}: the all-time summer record is ${hotT}` : `${name}: il record estivo assoluto è ${hotT}`,
    metaDescription: text,
  };
}

async function recordInvernale(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive || archive.precise === false) return null;
  const cold = archive.records.coldest;
  const coldYear = parseInt(cold.date.slice(0, 4), 10);
  const coldMonth = parseInt(cold.date.slice(5, 7), 10);
  if (coldMonth !== 12 && coldMonth !== 1 && coldMonth !== 2) return null;

  const forecast = await getForecast(city);
  const curTemp = forecast.current.temp;
  if (curTemp == null) return null;
  const nowDate = new Date();
  const curMonth = nowDate.getUTCMonth() + 1;
  if (curMonth !== 11 && curMonth !== 12 && curMonth !== 1 && curMonth !== 2 && curMonth !== 3) return null;
  const yearsAgo = nowDate.getUTCFullYear() - coldYear;
  if (yearsAgo <= 0) return null;

  const warmer = curTemp > cold.value;
  const date = fmtDate(cold.date, lang);
  const curT = fmtTemp(curTemp, 0);
  const coldT = fmtTemp(cold.value, 1);

  const text =
    lang === "en"
      ? warmer
        ? `With ${curT} in ${name} today, take comfort: on ${date} (${yearsAgo} years ago) it dropped to ${coldT} here — the all-time cold record since 1940.`
        : `With ${curT}, ${name} today is very close to the all-time cold record: ${coldT} on ${date} (${yearsAgo} years ago).`
      : warmer
        ? `Con ${curT} a ${name} oggi, consolati: il ${date} (${yearsAgo} anni fa) qui si toccarono ${coldT} — il record di freddo assoluto della serie dal 1940.`
        : `Con ${curT}, ${name} oggi è vicinissima al record di freddo assoluto di sempre: ${coldT} del ${date} (${yearsAgo} anni fa).`;

  return {
    eyebrow: lang === "en" ? "❄️ Winter record" : "❄️ Record invernale",
    pageTitle: lang === "en" ? `${name}'s all-time cold record` : `Il record di freddo assoluto di ${name}`,
    bigText: coldT,
    bigColor: "#7fb3ff",
    subLine:
      lang === "en"
        ? `${date} — ${yearsAgo} years ago. Today: ${curT}.`
        : `${date} — ${yearsAgo} anni fa. Oggi: ${curT}.`,
    shareText: text,
    metaTitle:
      lang === "en" ? `${name}: the all-time cold record is ${coldT}` : `${name}: il record di freddo assoluto è ${coldT}`,
    metaDescription: text,
  };
}

async function recordDurata(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  const wave = archive?.records.longestHeatwave;
  if (!wave) return null;

  const startDate = fmtDate(wave.start, lang);
  const endDate = fmtDate(wave.end, lang);
  const peakT = fmtTemp(wave.peak, 1);
  const text =
    lang === "en"
      ? `${name}'s longest heatwave ever recorded lasted ${wave.days} consecutive days (${startDate}–${endDate}), peaking at ${peakT}.`
      : `A ${name} l'ondata di calore più lunga mai registrata è durata ${wave.days} giorni consecutivi (dal ${startDate} al ${endDate}), con un picco di ${peakT}.`;

  return {
    eyebrow: lang === "en" ? "🔥📅 Duration record" : "🔥📅 Record di durata",
    pageTitle:
      lang === "en" ? `${name}'s longest heatwave ever recorded` : `L'ondata di calore più lunga mai registrata a ${name}`,
    bigText: lang === "en" ? `${wave.days} days` : `${wave.days} giorni`,
    bigColor: "#ff8a5c",
    subLine:
      lang === "en"
        ? `${startDate} – ${endDate} · peak ${peakT}`
        : `${startDate} – ${endDate} · picco ${peakT}`,
    shareText: text,
    metaTitle:
      lang === "en"
        ? `${name}: the longest heatwave ever recorded lasted ${wave.days} days`
        : `${name}: l'ondata di calore più lunga mai registrata è durata ${wave.days} giorni`,
    metaDescription: text,
  };
}

async function recordDurataFreddo(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  const snap = archive?.records.longestColdSnap;
  if (!snap) return null;

  const startDate = fmtDate(snap.start, lang);
  const endDate = fmtDate(snap.end, lang);
  const lowT = fmtTemp(snap.low, 1);
  const text =
    lang === "en"
      ? `${name}'s longest cold snap ever recorded lasted ${snap.days} consecutive frosty nights (${startDate}–${endDate}), dropping to ${lowT}.`
      : `A ${name} la sequenza di notti di gelo più lunga mai registrata è durata ${snap.days} giorni consecutivi (dal ${startDate} al ${endDate}), con un minimo di ${lowT}.`;

  return {
    eyebrow: lang === "en" ? "🥶📅 Duration record" : "🥶📅 Record di durata (gelo)",
    pageTitle:
      lang === "en" ? `${name}'s longest cold snap ever recorded` : `La sequenza di gelo più lunga mai registrata a ${name}`,
    bigText: lang === "en" ? `${snap.days} days` : `${snap.days} giorni`,
    bigColor: "#7fb3ff",
    subLine:
      lang === "en"
        ? `${startDate} – ${endDate} · low ${lowT}`
        : `${startDate} – ${endDate} · minimo ${lowT}`,
    shareText: text,
    metaTitle:
      lang === "en"
        ? `${name}: the longest cold snap ever recorded lasted ${snap.days} days`
        : `${name}: la sequenza di gelo più lunga mai registrata è durata ${snap.days} giorni`,
    metaDescription: text,
  };
}

// Record assoluti (caldo/freddo): puro fatto storico, sempre disponibile
// (nessun vincolo di stagione, nessuna chiamata al meteo attuale) — a
// differenza di record-estivo/record-invernale, che confrontano col meteo
// di oggi e sono quindi limitati alla stagione giusta. Adatti alla
// rotazione in home: nessuna fetch, nessuna finestra temporale.
async function recordCaldo(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive || archive.precise === false) return null;
  const hot = archive.records.hottest;
  if (!hot?.date) return null;
  const date = fmtDate(hot.date, lang);
  const hotT = fmtTemp(hot.value, 1);
  const text =
    lang === "en"
      ? `The hottest day ever recorded in ${name}: ${hotT} on ${date}.`
      : `Il giorno più caldo mai registrato a ${name}: ${hotT} il ${date}.`;

  return {
    eyebrow: lang === "en" ? "🔥 All-time heat record" : "🔥 Il giorno più caldo di sempre",
    pageTitle: lang === "en" ? `${name}'s all-time heat record` : `Il record di caldo assoluto di ${name}`,
    bigText: hotT,
    bigColor: "#ef4444",
    subLine: date,
    shareText: text,
    metaTitle: lang === "en" ? `${name}: the all-time heat record is ${hotT}` : `${name}: il record di caldo assoluto è ${hotT}`,
    metaDescription: text,
  };
}

async function recordFreddo(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive || archive.precise === false) return null;
  const cold = archive.records.coldest;
  if (!cold?.date) return null;
  const date = fmtDate(cold.date, lang);
  const coldT = fmtTemp(cold.value, 1);
  const text =
    lang === "en"
      ? `The coldest day ever recorded in ${name}: ${coldT} on ${date}.`
      : `Il giorno più freddo mai registrato a ${name}: ${coldT} il ${date}.`;

  return {
    eyebrow: lang === "en" ? "❄️ All-time cold record" : "❄️ Il giorno più freddo di sempre",
    pageTitle: lang === "en" ? `${name}'s all-time cold record` : `Il record di freddo assoluto di ${name}`,
    bigText: coldT,
    bigColor: "#2563eb",
    subLine: date,
    shareText: text,
    metaTitle: lang === "en" ? `${name}: the all-time cold record is ${coldT}` : `${name}: il record di freddo assoluto è ${coldT}`,
    metaDescription: text,
  };
}

async function gemelloClimatico(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const analog = getClimateAnalog(city.slug);
  if (!analog) return null;
  const decade = fmtDecade(analog.decade, lang);
  const meanNow = fmtTemp(analog.meanNow, 1);
  const meanThen = fmtTemp(analog.meanThen, 1);
  const text =
    lang === "en"
      ? `${name}'s average annual temperature today matches what ${analog.cityName} had in ${decade} — ${meanNow} vs ${meanThen}.`
      : `${name} ha oggi la stessa temperatura media annua che aveva ${analog.cityName} negli ${decade} — ${meanNow} contro ${meanThen}.`;

  return {
    eyebrow: lang === "en" ? "🕰️ Climate twin" : "🕰️ Gemello climatico",
    pageTitle: lang === "en" ? `${name}'s climate twin` : `Il gemello climatico di ${name}`,
    bigText: analog.cityName,
    bigColor: "#ffd27a",
    subLine: lang === "en" ? `${decade} — ${meanNow} vs ${meanThen}` : `${decade} — ${meanNow} contro ${meanThen}`,
    shareText: text,
    metaTitle:
      lang === "en" ? `${name}'s climate twin: ${analog.cityName} in ${decade}` : `Il gemello climatico di ${name}: ${analog.cityName} negli ${decade}`,
    metaDescription: text,
  };
}

async function gradiGiornoCuriosity(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive) return null;
  const gg = gradiGiorno(archive.monthly);
  if (gg == null) return null;
  const zone = ggZone(gg);
  const ggStr = gg.toLocaleString(lang === "it" ? "it-IT" : "en-US", { useGrouping: true });
  const text =
    lang === "en"
      ? `${name}: an estimated ${ggStr} heating degree days (zone ${zone}) — based on Italy's official DPR 412/93 indicator of a building's heating demand.`
      : `${name}: stima di ${ggStr} gradi giorno (zona ${zone}) — basata sull'indicatore ufficiale italiano (DPR 412/93) del fabbisogno di riscaldamento degli edifici.`;

  return {
    eyebrow: lang === "en" ? "🏠 Heating degree days" : "🏠 Gradi giorno",
    pageTitle: lang === "en" ? `${name}'s heating degree days` : `I gradi giorno di ${name}`,
    bigText: `${ggStr} GG`,
    bigColor: "#b3c5ff",
    subLine:
      lang === "en"
        ? `Estimated · zone ${zone} (DPR 412/93)`
        : `Stima · zona ${zone} (DPR 412/93)`,
    shareText: text,
    metaTitle: lang === "en" ? `${name}: ${ggStr} heating degree days (zone ${zone})` : `${name}: ${ggStr} gradi giorno (zona ${zone})`,
    metaDescription: text,
  };
}

export async function getCuriosity(
  slug: string,
  kind: CuriosityKind,
  lang: "it" | "en" = "it",
): Promise<CuriosityPayload | null> {
  const city = getCity(slug);
  if (!city) return null;
  const name = cityName(city, lang);

  if (kind === "record-estivo") return recordEstivo(city, name, lang);
  if (kind === "record-invernale") return recordInvernale(city, name, lang);
  if (kind === "gemello-climatico") return gemelloClimatico(city, name, lang);
  if (kind === "gradi-giorno") return gradiGiornoCuriosity(city, name, lang);
  if (kind === "record-durata") return recordDurata(city, name, lang);
  if (kind === "record-durata-freddo") return recordDurataFreddo(city, name, lang);
  if (kind === "record-caldo") return recordCaldo(city, name, lang);
  if (kind === "record-freddo") return recordFreddo(city, name, lang);
  return null;
}

// Sottoinsieme "sicuro" per la rotazione in home: SOLO curiosità calcolate
// dallo snapshot già in cache (nessuna fetch a Open-Meteo), e le più
// interessanti/precise da mostrare senza contesto (nessun vincolo di
// stagione). record-estivo/record-invernale restano fuori apposta —
// richiedono il meteo attuale (getForecast) e in home verrebbero
// interrogate ad ogni caricamento/click da visitatori diversi,
// moltiplicando le chiamate live. gradi-giorno resta fuori: poco
// interessante per la maggior parte delle persone, resta solo in scheda
// città.
const POOL_KINDS: CuriosityKind[] = [
  "gemello-climatico",
  "record-durata",
  "record-durata-freddo",
  "record-caldo",
  "record-freddo",
];

// Città idonee per ciascun tipo: record-caldo/freddo/durata richiedono dati
// "precisi" (max/min reali, solo le città principali), quindi sono
// disponibili per una manciata di città su 107. gemello-climatico invece
// funziona quasi ovunque. Pescare "città a caso poi riprova" favorirebbe
// sistematicamente gemello-climatico (molte più possibilità di successo per
// tentativo) — qui invece si sceglie PRIMA il tipo con pari probabilità, poi
// una città SOLO fra quelle che quel tipo può davvero mostrare: ogni
// curiosità ha la stessa chance di comparire, non solo quella più diffusa.
function eligibleCitiesForKind(kind: CuriosityKind): City[] {
  if (kind === "gemello-climatico") {
    return CITIES.filter((c) => getClimateAnalog(c.slug) != null);
  }
  if (kind === "record-durata") {
    return CITIES.filter((c) => getArchiveStats(c)?.records.longestHeatwave);
  }
  if (kind === "record-durata-freddo") {
    return CITIES.filter((c) => getArchiveStats(c)?.records.longestColdSnap);
  }
  if (kind === "record-caldo" || kind === "record-freddo") {
    return CITIES.filter((c) => {
      const s = getArchiveStats(c);
      return !!s && s.precise !== false;
    });
  }
  return [];
}

export type RandomCuriosity = CuriosityPayload & {
  citySlug: string;
  cityName: string;
  kind: CuriosityKind;
};

// Nessuna fetch: ogni candidato legge solo dati già in memoria/cache.
const MAX_ATTEMPTS = 8;

export async function getRandomCuriosity(lang: "it" | "en" = "it"): Promise<RandomCuriosity | null> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const kind = POOL_KINDS[Math.floor(Math.random() * POOL_KINDS.length)];
    const eligible = eligibleCitiesForKind(kind);
    if (eligible.length === 0) continue;
    const city = eligible[Math.floor(Math.random() * eligible.length)];
    const payload = await getCuriosity(city.slug, kind, lang);
    if (payload) return { ...payload, citySlug: city.slug, cityName: cityName(city, lang), kind };
  }
  // Ripiego garantito: Roma ha sempre un record di caldo assoluto in cache.
  const fallbackCity = getCity("roma");
  if (fallbackCity) {
    const payload = await getCuriosity("roma", "record-caldo", lang);
    if (payload) return { ...payload, citySlug: "roma", cityName: cityName(fallbackCity, lang), kind: "record-caldo" };
  }
  return null;
}
