import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { CITIES, MAIN_CITIES, cityName } from "@/lib/cities";
import { getForecast, getArchive, getArchiveStats, type CityForecast } from "@/lib/weather";
import { notifyGrouped, pushConfigured, type LocalizedPayloads } from "@/lib/push";
import { redis } from "@/lib/redis";
import { logEvent } from "@/lib/eventlog";
import { logDailyStatsSnapshot } from "@/lib/statshistory";
import {
  nationalMonthlyHighlight,
  cityMonthlyHighlight,
  monthNormal,
  ordinalIt,
  ordinalEn,
} from "@/lib/monthlyCompare";

// Endpoint di revalidazione invocato dal Cron Vercel ogni giorno.
// Rinfresca il meteo ATTUALE (tag "forecast", leggero). Lo storico aggregato
// (tag "weather") si auto-rinfresca con SWR a 24h, quindi NON lo invalidiamo
// qui per non innescare un ricalcolo sincrono pesante.
// Controlla anche se oggi è stato battuto un record assoluto di caldo in una
// città principale (dato preciso, non stimato) e in tal caso invia una
// notifica push agli iscritti — riusa questo stesso cron, senza aggiungerne
// uno nuovo.
// Infine scansiona le previsioni delle città principali alla ricerca di
// ondate di calore imminenti (>= 3 giorni consecutivi con massima >= 35°
// che iniziano entro 3 giorni) e in tal caso invia UNA sola notifica push
// per esecuzione, con dedup su Redis per città (TTL 5 giorni).
// Se CRON_SECRET è impostata, richiede Authorization: Bearer <CRON_SECRET>.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Previsioni delle città principali, una sola fetch condivisa fra il check
// record e il check ondate di calore (il cron deve restare veloce e leggero).
async function fetchForecasts(): Promise<Map<string, CityForecast>> {
  const forecasts = new Map<string, CityForecast>();
  await Promise.allSettled(
    MAIN_CITIES.map(async (city) => {
      forecasts.set(city.slug, await getForecast(city));
    }),
  );
  return forecasts;
}

// Da payload push (url facoltativa) a voce del registro eventi (url richiesta).
function asEvent(p: { title: string; body: string; url?: string }) {
  return { title: p.title, body: p.body, url: p.url ?? "/" };
}

type BrokenRecord = {
  city: string;
  cityEn: string;
  slug: string;
  value: number;
  direction: "hot" | "cold";
};

// Record assoluti battuti oggi, di caldo E di freddo: il sito mostra entrambi
// con lo stesso rispetto ("i dati, non le opinioni") e il push fa altrettanto.
function checkRecords(forecasts: Map<string, CityForecast>, todayStr: string): BrokenRecord[] {
  const broken: BrokenRecord[] = [];
  for (const city of MAIN_CITIES) {
    const archive = getArchiveStats(city);
    if (!archive || archive.precise === false) continue;
    const forecast = forecasts.get(city.slug);
    if (!forecast) continue; // città non raggiungibile oggi: ignora
    const today = forecast.days.find((d) => d.date === todayStr);
    const base = { city: city.name, cityEn: cityName(city, "en"), slug: city.slug };
    if (today?.max != null && today.max > archive.records.hottest.value) {
      broken.push({ ...base, value: today.max, direction: "hot" });
    }
    if (today?.min != null && today.min < archive.records.coldest.value) {
      broken.push({ ...base, value: today.min, direction: "cold" });
    }
  }
  return broken;
}

// Payload localizzati per uno o più record battuti. `yours` marca la variante
// mirata a chi segue proprio quella città.
function recordPayloads(broken: BrokenRecord[], yours = false): LocalizedPayloads {
  const first = broken[0];
  const hot = first.direction === "hot";
  const emoji = hot ? "🔥" : "🥶";
  const kindIt = hot ? "caldo" : "freddo";
  const kindEn = hot ? "heat" : "cold";
  const single = broken.length === 1;
  const mixed = broken.some((b) => b.direction !== first.direction);
  const fmt = (v: number) => v.toFixed(1);

  const title = single
    ? `${emoji} Record di ${kindIt} a ${first.city}${yours ? " — la tua città" : "!"}`
    : mixed
      ? "🌡️ Record di temperatura in Italia!"
      : `${emoji} Record di ${kindIt} in Italia!`;
  const body = single
    ? `${first.city} ha toccato ${fmt(first.value)}°, il valore più ${hot ? "alto" : "basso"} mai registrato dal 1940.`
    : broken.map((b) => `${b.city} ${fmt(b.value)}°`).join(" · ") + " — nuovi record assoluti.";
  const titleEn = single
    ? `${emoji} New ${kindEn} record in ${first.cityEn}${yours ? " — your city" : "!"}`
    : mixed
      ? "🌡️ New temperature records in Italy!"
      : `${emoji} New ${kindEn} records in Italy!`;
  const bodyEn = single
    ? `${first.cityEn} hit ${fmt(first.value)}°, the ${hot ? "highest" : "lowest"} value ever recorded since 1940.`
    : broken.map((b) => `${b.cityEn} ${fmt(b.value)}°`).join(" · ") + " — new all-time records.";

  return {
    it: { title, body, url: `/citta/${first.slug}`, tag: "records", cta: "Vedi i dati" },
    en: { title: titleEn, body: bodyEn, url: `/en/citta/${first.slug}`, tag: "records", cta: "See the data" },
  };
}

// --- Ondate di calore ------------------------------------------------------
const HEAT_THRESHOLD = 35; // °C sulla massima giornaliera
const HEAT_MIN_RUN = 3; // giorni consecutivi minimi
const HEAT_START_WITHIN_DAYS = 3; // l'ondata deve iniziare entro N giorni
const HEAT_DEDUP_TTL = 5 * 24 * 60 * 60; // 5 giorni, in secondi

type HeatwaveRun = { days: number; peak: number; start: string };

// Trova la sequenza più lunga di giorni consecutivi con massima >= 35° che
// sia rilevante OGGI: può iniziare entro `limitStr` (prossimi giorni) oppure
// essere GIÀ INIZIATA nei giorni scorsi e ancora attiva oggi — in quel caso i
// giorni passati contano nella durata (prima venivano ignorati: un'ondata al
// 4° giorno con 2 residui non faceva scattare nulla pur essendo in pieno
// svolgimento). Le sequenze già concluse prima di oggi restano escluse.
// A parità di durata vince la più calda. Null se nessuna raggiunge 3 giorni.
const HEAT_LOOKBACK_DAYS = 7;

function findHeatwave(
  forecast: CityForecast,
  todayStr: string,
  limitStr: string,
): HeatwaveRun | null {
  const lookback = new Date(`${todayStr}T12:00:00Z`);
  lookback.setUTCDate(lookback.getUTCDate() - HEAT_LOOKBACK_DAYS);
  const lookbackStr = lookback.toISOString().slice(0, 10);
  const days = forecast.days.filter(
    (d) => d.isForecast || (d.date >= lookbackStr && d.date <= todayStr),
  );
  let best: HeatwaveRun | null = null;
  let run = 0;
  let peak = -Infinity;
  let start = "";
  let end = "";
  const flush = () => {
    // Valida se: abbastanza lunga, inizia entro il limite, e non è già finita
    // (l'ultimo giorno della sequenza è oggi o nel futuro).
    if (run < HEAT_MIN_RUN || start > limitStr || end < todayStr) return;
    if (!best || run > best.days || (run === best.days && peak > best.peak)) {
      best = { days: run, peak, start };
    }
  };
  for (const d of days) {
    if (d.max != null && d.max >= HEAT_THRESHOLD) {
      if (run === 0) {
        start = d.date;
        peak = -Infinity;
      }
      run++;
      end = d.date;
      if (d.max > peak) peak = d.max;
    } else {
      flush();
      run = 0;
    }
  }
  flush();
  return best;
}

type HeatwaveOutcome =
  | { city: string; slug: string; days: number; peak: number; start: string; others: number; sent: number; groups: number }
  | { error: string }
  | null;

type HeatwaveCandidate = { city: string; cityEn: string; slug: string } & HeatwaveRun;

// Payload localizzati per un'ondata: la variante nazionale cita le altre città
// coinvolte, quella mirata parla solo della città seguita.
function heatwavePayloads(c: HeatwaveCandidate, others = 0): LocalizedPayloads {
  const startDate = new Date(`${c.start}T12:00:00`);
  const giorno = startDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const dayEn = startDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  // Ondata già iniziata (start nel passato) vs in arrivo: cambia il verbo,
  // non il metodo — la durata include in entrambi i casi l'intera sequenza.
  const ongoing = c.start <= new Date().toISOString().slice(0, 10);
  const body =
    (ongoing
      ? `${c.days} giorni consecutivi sopra i 35°, iniziata ${giorno}. Picco: ${c.peak.toFixed(1)}°.`
      : `${c.days} giorni consecutivi sopra i 35° previsti da ${giorno}. Picco: ${c.peak.toFixed(1)}°.`) +
    (others > 0 ? ` Coinvolte anche altre ${others} città.` : "");
  const bodyEn =
    (ongoing
      ? `${c.days} consecutive days above 35°, started ${dayEn}. Peak: ${c.peak.toFixed(1)}°.`
      : `${c.days} consecutive days above 35° forecast from ${dayEn}. Peak: ${c.peak.toFixed(1)}°.`) +
    (others > 0 ? ` ${others} other cities affected too.` : "");
  return {
    it: {
      title: ongoing
        ? `🌡️ Ondata di calore in corso a ${c.city}`
        : `🌡️ Ondata di calore in arrivo a ${c.city}`,
      body,
      url: `/citta/${c.slug}`,
      tag: `heatwave-${c.slug}`,
      cta: "Vedi i dati",
    },
    en: {
      title: ongoing ? `🌡️ Heatwave underway in ${c.cityEn}` : `🌡️ Heatwave coming to ${c.cityEn}`,
      body: bodyEn,
      url: `/en/citta/${c.slug}`,
      tag: `heatwave-${c.slug}`,
      cta: "See the data",
    },
  };
}

// Ondate di calore, su due binari:
// - MIRATO: chi segue una città riceve l'avviso della SUA città quando ha
//   un'ondata in arrivo (dedup "heatwave:sub:<slug>", TTL 5 giorni) — prima
//   veniva taciuta se un'altra città aveva la sequenza più lunga.
// - NAZIONALE: chi non segue una città (e chi la segue ma la sua è tranquilla)
//   riceve come oggi il top-pick fra le candidate (dedup "heatwave:<slug>").
async function checkHeatwaves(forecasts: Map<string, CityForecast>, todayStr: string): Promise<HeatwaveOutcome> {
  const limit = new Date();
  limit.setUTCDate(limit.getUTCDate() + HEAT_START_WITHIN_DAYS);
  const limitStr = limit.toISOString().slice(0, 10);

  const candidates: HeatwaveCandidate[] = [];
  for (const city of MAIN_CITIES) {
    const forecast = forecasts.get(city.slug);
    if (!forecast) continue;
    const wave = findHeatwave(forecast, todayStr, limitStr);
    if (wave) candidates.push({ city: city.name, cityEn: cityName(city, "en"), slug: city.slug, ...wave });
  }
  if (!candidates.length) return null;

  // Dedup su due spazi chiave separati: il top-pick nazionale non consuma il
  // diritto dei follower a essere avvisati sulla loro città, e viceversa.
  const kv = redis; // narrowing stabile dentro le closure
  let freshNational = candidates;
  let freshTargeted = candidates;
  if (kv) {
    const [natSeen, subSeen] = await Promise.all([
      Promise.all(candidates.map((c) => kv.exists(`heatwave:${c.slug}`))),
      Promise.all(candidates.map((c) => kv.exists(`heatwave:sub:${c.slug}`))),
    ]);
    freshNational = candidates.filter((_, i) => !natSeen[i]);
    freshTargeted = candidates.filter((_, i) => !subSeen[i]);
  }
  if (!freshNational.length && !freshTargeted.length) return null;

  freshNational.sort((a, b) => b.days - a.days || b.peak - a.peak);
  const top: HeatwaveCandidate | null = freshNational[0] ?? null;
  const others = Math.max(0, freshNational.length - 1);
  const targetedBySlug = new Map(freshTargeted.map((c) => [c.slug, c]));

  const result = await notifyGrouped((city) => {
    if (city !== null) {
      // Follower: prima l'ondata della SUA città; se è tranquilla, il nazionale.
      const mine = targetedBySlug.get(city);
      if (mine) return heatwavePayloads(mine);
    }
    return top ? heatwavePayloads(top, others) : null;
  });

  if (kv) {
    const ops: Promise<unknown>[] = freshTargeted.map((c) =>
      kv.set(`heatwave:sub:${c.slug}`, todayStr, { ex: HEAT_DEDUP_TTL }),
    );
    if (top) ops.push(kv.set(`heatwave:${top.slug}`, todayStr, { ex: HEAT_DEDUP_TTL }));
    await Promise.all(ops);
  }

  const logged = top ?? freshTargeted[0];
  const loggedPayloads = heatwavePayloads(logged, logged === top ? others : 0);
  await logEvent({
    date: new Date().toISOString(),
    type: "heatwave",
    it: asEvent(loggedPayloads.it),
    en: asEvent(loggedPayloads.en),
  });
  return {
    city: logged.city,
    slug: logged.slug,
    days: logged.days,
    peak: logged.peak,
    start: logged.start,
    others,
    sent: result.sent,
    groups: result.groups,
  };
}

// --- Recap mensile -----------------------------------------------------------
// Il giorno 1 del mese: anomalia nazionale del mese APPENA CONCLUSO, come media
// fra le città principali dello scarto (media giornaliera del mese vs
// climatologia mensile della città, sull'intera serie). Una sola notifica,
// localizzata per lingua dell'iscritto (it/en), dedup su Redis per mese.
// getArchive è async ma leggero (una sola chiamata API per città, la coda
// recente): accettabile sul cron delle 5:30 — si riusa quello, nessun nuovo
// percorso di fetch. NB: ERA5 arriva con ~5 giorni di ritardo, quindi il
// giorno 1 mancano gli ultimi giorni del mese: bastano >= 20 giorni validi
// per una media mensile robusta.
const MONTHLY_MIN_DAYS = 20;
const MONTHLY_DEDUP_TTL = 40 * 24 * 60 * 60; // 40 giorni, in secondi

const MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

type MonthlyRecapOutcome =
  | { month: string; anomaly: number; cities: number; sent: number }
  | { skipped: string }
  | { error: string }
  | null;

async function sendMonthlyRecap(now: Date): Promise<MonthlyRecapOutcome> {
  // Mese precedente (calendario, UTC): il giorno 1 di luglio -> giugno.
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevYear = prev.getUTCFullYear();
  const prevMonth = prev.getUTCMonth() + 1; // 1..12
  const monthKey = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  // Dedup: una sola notifica per mese, anche se il cron rigira.
  if (redis && (await redis.exists(`monthly-recap:${monthKey}`))) {
    return { skipped: "already-sent" };
  }

  const prefix = `${monthKey}-`;
  const archives = await Promise.allSettled(MAIN_CITIES.map((city) => getArchive(city)));
  const anomalies: number[] = [];
  for (const res of archives) {
    if (res.status !== "fulfilled") continue;
    const archive = res.value;
    // Baseline: la normale 1961-1990 dello stesso mese, come ovunque sul sito.
    // Senza monthlySeries (snapshot vecchio) la città esce dal conteggio: mai
    // una baseline diversa mescolata alle altre nella stessa media nazionale.
    if (!archive.monthlySeries) continue;
    const normal = monthNormal(archive.monthlySeries, prevMonth);
    if (normal === null) continue;
    const days = archive.recent.filter((d) => d.date.startsWith(prefix) && d.mean != null);
    if (days.length < MONTHLY_MIN_DAYS) continue;
    const monthMean = days.reduce((sum, d) => sum + (d.mean as number), 0) / days.length;
    anomalies.push(monthMean - normal);
  }
  // Serve almeno metà delle città: con meno, la "media nazionale" non è tale.
  if (anomalies.length < MAIN_CITIES.length / 2) {
    return { skipped: `insufficient-data (${anomalies.length}/${MAIN_CITIES.length})` };
  }

  const anomaly = anomalies.reduce((a, b) => a + b, 0) / anomalies.length;
  const mese = MESI[prevMonth - 1];
  const Mese = mese[0].toUpperCase() + mese.slice(1);
  const value = `${anomaly >= 0 ? "+" : ""}${anomaly.toFixed(1).replace(".", ",")}°`;
  // Nome del mese in inglese e anomalia con il punto decimale per la variante EN.
  const monthEn = prev.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const valueEn = `${anomaly >= 0 ? "+" : ""}${anomaly.toFixed(1)}°`;

  // Aggiunge il ranking ("il più caldo mai registrato") quando è notevole
  // (tra i primi/ultimi 5 dal 1940): stesso dato di nationalMonthlyHighlight()
  // usato in homepage, qui in più letto solo se combacia col mese appena
  // recapppato (mai una classifica di un mese diverso spacciata per questo).
  const highlight = nationalMonthlyHighlight();
  const notable =
    highlight &&
    highlight.year === prevYear &&
    highlight.month === prevMonth &&
    highlight.rank <= 5;
  let rankIt = "";
  let rankEn = "";
  if (notable) {
    const kind = highlight.direction === "hot" ? "caldo" : "freddo";
    const kindEn = highlight.direction === "hot" ? "hottest" : "coldest";
    rankIt = ` È il ${ordinalIt(highlight.rank)} ${mese} più ${kind} dal ${highlight.sinceYear} (su ${highlight.total} anni).`;
    rankEn = ` It's the ${ordinalEn(highlight.rank)} ${kindEn} ${monthEn} since ${highlight.sinceYear} (${highlight.total} years of records).`;
  }

  const eventIt = {
    title: `📊 Il clima di ${mese} in Italia`,
    body: `${Mese}: ${value} rispetto alla normale 1961–1990.${rankIt} Vedi il bollettino completo.`,
    url: `/mese`,
    tag: `monthly-${monthKey}`,
    cta: "Vedi il bollettino",
  };
  const eventEn = {
    title: `📊 ${monthEn}'s climate in Italy`,
    body: `${monthEn}: ${valueEn} vs the 1961–1990 normal.${rankEn} See the full bulletin.`,
    url: `/en/mese`,
    tag: `monthly-${monthKey}`,
    cta: "See the bulletin",
  };
  const national: LocalizedPayloads = { it: eventIt, en: eventEn };

  // Recap personalizzato per chi segue una città: l'anomalia del mese della
  // SUA città (stesso metodo del widget in pagina città), con il ranking se
  // notevole. Usato solo se il dato copre proprio il mese appena concluso;
  // altrimenti quel gruppo riceve il nazionale come tutti.
  const cityRecap = (slug: string): LocalizedPayloads | null => {
    const city = CITIES.find((c) => c.slug === slug);
    if (!city) return null;
    const snap = getArchiveStats(city);
    const h = cityMonthlyHighlight(snap?.monthlySeries);
    if (!h || h.year !== prevYear || h.month !== prevMonth) return null;
    const v = `${h.anomaly >= 0 ? "+" : ""}${h.anomaly.toFixed(1).replace(".", ",")}°`;
    const vEn = `${h.anomaly >= 0 ? "+" : ""}${h.anomaly.toFixed(1)}°`;
    const cityRankIt =
      h.rank <= 5
        ? ` È il ${ordinalIt(h.rank)} ${mese} più ${h.direction === "hot" ? "caldo" : "freddo"} dal ${h.sinceYear}.`
        : "";
    const cityRankEn =
      h.rank <= 5
        ? ` It's the ${ordinalEn(h.rank)} ${h.direction === "hot" ? "hottest" : "coldest"} ${monthEn} since ${h.sinceYear}.`
        : "";
    return {
      it: {
        title: `📊 Il clima di ${mese} a ${city.name}`,
        body: `${Mese} a ${city.name}: ${v} rispetto alla normale 1961–1990.${cityRankIt} Italia: ${value}.`,
        url: `/citta/${slug}`,
        tag: `monthly-${monthKey}`,
        cta: "Vedi i dati",
      },
      en: {
        title: `📊 ${monthEn}'s climate in ${cityName(city, "en")}`,
        body: `${monthEn} in ${cityName(city, "en")}: ${vEn} vs the 1961–1990 normal.${cityRankEn} Italy: ${valueEn}.`,
        url: `/en/citta/${slug}`,
        tag: `monthly-${monthKey}`,
        cta: "See the data",
      },
    };
  };

  const result = await notifyGrouped((city) => (city ? (cityRecap(city) ?? national) : national));
  if (redis) {
    await redis.set(`monthly-recap:${monthKey}`, now.toISOString().slice(0, 10), {
      ex: MONTHLY_DEDUP_TTL,
    });
  }
  await logEvent({ date: now.toISOString(), type: "monthly", it: eventIt, en: eventEn });
  return {
    month: monthKey,
    anomaly: Math.round(anomaly * 100) / 100,
    cities: anomalies.length,
    sent: result.sent,
  };
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  revalidateTag("forecast", { expire: 0 });

  let notified: { sent: number; removed: number; records: string[] } | null = null;
  let heatwave: HeatwaveOutcome = null;
  let monthlyRecap: MonthlyRecapOutcome = null;
  if (pushConfigured()) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const forecasts = await fetchForecasts();

    const broken = checkRecords(forecasts, todayStr);
    if (broken.length) {
      // Tutti ricevono il record (è la notizia del sito); chi segue una delle
      // città col record battuto riceve la variante centrata sulla SUA città.
      const generic = recordPayloads(broken);
      const bySlug = new Map(broken.map((b) => [b.slug, b]));
      const result = await notifyGrouped((city) => {
        const mine = city ? bySlug.get(city) : undefined;
        return mine ? recordPayloads([mine], true) : generic;
      });
      notified = { sent: result.sent, removed: result.removed, records: broken.map((b) => b.city) };
      await logEvent({
        date: new Date().toISOString(),
        type: "record",
        it: asEvent(generic.it),
        en: asEvent(generic.en),
      });
    }

    // Non fatale: un errore qui non deve rompere il resto del refresh.
    try {
      heatwave = await checkHeatwaves(forecasts, todayStr);
    } catch (e) {
      heatwave = { error: e instanceof Error ? e.message : String(e) };
    }

    // Recap mensile: solo il giorno 1 del mese, non fatale come le ondate.
    if (new Date().getUTCDate() === 1) {
      try {
        monthlyRecap = await sendMonthlyRecap(new Date());
      } catch (e) {
        monthlyRecap = { error: e instanceof Error ? e.message : String(e) };
      }
    }
  }

  // Snapshot giornaliero visite/bot (dedup interno, indipendente dal push):
  // non fatale, il refresh non deve fallire se questo salta.
  let statsSnapshot: Awaited<ReturnType<typeof logDailyStatsSnapshot>> | { error: string } = { skipped: true };
  try {
    statsSnapshot = await logDailyStatsSnapshot();
  } catch (e) {
    statsSnapshot = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    revalidated: true,
    tags: ["forecast"],
    notified,
    heatwave,
    monthlyRecap,
    statsSnapshot,
    at: new Date().toISOString(),
  });
}
