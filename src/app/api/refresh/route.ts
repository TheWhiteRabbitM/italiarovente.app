import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { MAIN_CITIES, cityName } from "@/lib/cities";
import { getForecast, getArchive, getArchiveStats, type CityForecast } from "@/lib/weather";
import { notifyAll, pushConfigured } from "@/lib/push";
import { redis } from "@/lib/redis";
import { logEvent } from "@/lib/eventlog";
import { logDailyStatsSnapshot } from "@/lib/statshistory";

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

type BrokenRecord = { city: string; cityEn: string; slug: string; value: number };

function checkRecords(forecasts: Map<string, CityForecast>, todayStr: string): BrokenRecord[] {
  const broken: BrokenRecord[] = [];
  for (const city of MAIN_CITIES) {
    const archive = getArchiveStats(city);
    if (!archive || archive.precise === false) continue;
    const forecast = forecasts.get(city.slug);
    if (!forecast) continue; // città non raggiungibile oggi: ignora
    const today = forecast.days.find((d) => d.date === todayStr);
    if (today?.max != null && today.max > archive.records.hottest.value) {
      broken.push({
        city: city.name,
        cityEn: cityName(city, "en"),
        slug: city.slug,
        value: today.max,
      });
    }
  }
  return broken;
}

// --- Ondate di calore ------------------------------------------------------
const HEAT_THRESHOLD = 35; // °C sulla massima giornaliera
const HEAT_MIN_RUN = 3; // giorni consecutivi minimi
const HEAT_START_WITHIN_DAYS = 3; // l'ondata deve iniziare entro N giorni
const HEAT_DEDUP_TTL = 5 * 24 * 60 * 60; // 5 giorni, in secondi

type HeatwaveRun = { days: number; peak: number; start: string };

// Trova nella previsione (oggi + giorni futuri) la sequenza più lunga di
// giorni consecutivi con massima >= 35° che inizi entro `limitStr`.
// A parità di durata vince la più calda. Null se nessuna raggiunge 3 giorni.
function findHeatwave(
  forecast: CityForecast,
  todayStr: string,
  limitStr: string,
): HeatwaveRun | null {
  const days = forecast.days.filter((d) => d.isForecast || d.date === todayStr);
  let best: HeatwaveRun | null = null;
  let run = 0;
  let peak = -Infinity;
  let start = "";
  const flush = () => {
    if (run < HEAT_MIN_RUN || start > limitStr) return;
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
  | { city: string; slug: string; days: number; peak: number; start: string; others: number; sent: number }
  | { error: string }
  | null;

// Al massimo UNA notifica di ondata di calore per esecuzione del cron: fra le
// città candidate (non già notificate di recente, chiave Redis
// "heatwave:<slug>" con TTL 5 giorni) vince quella con la sequenza più
// lunga/calda; le altre vengono citate nel corpo ("e altre N città").
async function checkHeatwaves(forecasts: Map<string, CityForecast>, todayStr: string): Promise<HeatwaveOutcome> {
  const limit = new Date();
  limit.setUTCDate(limit.getUTCDate() + HEAT_START_WITHIN_DAYS);
  const limitStr = limit.toISOString().slice(0, 10);

  const candidates: ({ city: string; cityEn: string; slug: string } & HeatwaveRun)[] = [];
  for (const city of MAIN_CITIES) {
    const forecast = forecasts.get(city.slug);
    if (!forecast) continue;
    const wave = findHeatwave(forecast, todayStr, limitStr);
    if (wave) candidates.push({ city: city.name, cityEn: cityName(city, "en"), slug: city.slug, ...wave });
  }
  if (!candidates.length) return null;

  // Dedup: salta le città già notificate negli ultimi 5 giorni.
  const kv = redis; // narrowing stabile dentro le closure
  let fresh = candidates;
  if (kv) {
    const seen = await Promise.all(candidates.map((c) => kv.exists(`heatwave:${c.slug}`)));
    fresh = candidates.filter((_, i) => !seen[i]);
  }
  if (!fresh.length) return null;

  fresh.sort((a, b) => b.days - a.days || b.peak - a.peak);
  const top = fresh[0];
  const others = fresh.length - 1;

  const startDate = new Date(`${top.start}T12:00:00`);
  const giorno = startDate.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const body =
    `${top.days} giorni consecutivi sopra i 35° previsti da ${giorno}. Picco: ${top.peak.toFixed(1)}°.` +
    (others > 0 ? ` Coinvolte anche altre ${others} città.` : "");
  const dayEn = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const bodyEn =
    `${top.days} consecutive days above 35° forecast from ${dayEn}. Peak: ${top.peak.toFixed(1)}°.` +
    (others > 0 ? ` ${others} other cities affected too.` : "");

  const eventIt = { title: `🌡️ Ondata di calore in arrivo a ${top.city}`, body, url: `/citta/${top.slug}` };
  const eventEn = {
    title: `🌡️ Heatwave coming to ${top.cityEn}`,
    body: bodyEn,
    url: `/en/citta/${top.slug}`,
  };
  const result = await notifyAll({ it: eventIt, en: eventEn });
  if (redis) {
    await redis.set(`heatwave:${top.slug}`, todayStr, { ex: HEAT_DEDUP_TTL });
  }
  await logEvent({ date: new Date().toISOString(), type: "heatwave", it: eventIt, en: eventEn });
  return { city: top.city, slug: top.slug, days: top.days, peak: top.peak, start: top.start, others, sent: result.sent };
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
    const clim = archive.monthly.find((m) => m.month === prevMonth);
    if (!clim) continue;
    const days = archive.recent.filter((d) => d.date.startsWith(prefix) && d.mean != null);
    if (days.length < MONTHLY_MIN_DAYS) continue;
    const monthMean = days.reduce((sum, d) => sum + (d.mean as number), 0) / days.length;
    anomalies.push(monthMean - clim.mean);
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

  const eventIt = {
    title: `📊 Il clima di ${mese} in Italia`,
    body: `${Mese}: ${value} rispetto alla media storica del mese. Vedi i dati città per città.`,
    url: `/`,
  };
  const eventEn = {
    title: `📊 ${monthEn}'s climate in Italy`,
    body: `${monthEn}: ${valueEn} vs the month's historical average. See the city-by-city data.`,
    url: `/en`,
  };
  const result = await notifyAll({ it: eventIt, en: eventEn });
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
      const first = broken[0];
      const title = broken.length === 1 ? `🔥 Record di caldo a ${first.city}!` : "🔥 Record di caldo in Italia!";
      const body =
        broken.length === 1
          ? `${first.city} ha toccato ${first.value.toFixed(1)}°, il valore più alto mai registrato dal 1940.`
          : broken.map((b) => `${b.city} ${b.value.toFixed(1)}°`).join(" · ") + " — nuovi record assoluti.";
      const titleEn =
        broken.length === 1 ? `🔥 New heat record in ${first.cityEn}!` : "🔥 New heat records in Italy!";
      const bodyEn =
        broken.length === 1
          ? `${first.cityEn} hit ${first.value.toFixed(1)}°, the highest value ever recorded since 1940.`
          : broken.map((b) => `${b.cityEn} ${b.value.toFixed(1)}°`).join(" · ") + " — new all-time records.";
      const result = await notifyAll({
        it: { title, body, url: `/citta/${first.slug}` },
        en: { title: titleEn, body: bodyEn, url: `/en/citta/${first.slug}` },
      });
      notified = { ...result, records: broken.map((b) => b.city) };
      await logEvent({
        date: new Date().toISOString(),
        type: "record",
        it: { title, body, url: `/citta/${first.slug}` },
        en: { title: titleEn, body: bodyEn, url: `/en/citta/${first.slug}` },
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
