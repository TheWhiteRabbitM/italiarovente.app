import { notFound } from "next/navigation";
import Link from "next/link";
import { getCity, cityName, CITIES, type City } from "@/lib/cities";
import {
  getForecast,
  getArchive,
  getArchiveStats,
  getAirQuality,
  getMinMaxWarming,
} from "@/lib/weather";
import {
  YearlyTrendChart,
  MonthlyClimChart,
  RecentDailyChart,
  AnomalyBarChart,
  DecadeBars,
  HeatDaysChart,
} from "@/components/charts";
import type { Metadata } from "next";
import { WarmingStripes } from "@/components/WarmingStripes";
import { Verdict } from "@/components/Verdict";
import { EobsCrossCheck } from "@/components/EobsCrossCheck";
import { getEobsComparison } from "@/lib/eobs";
import { MonthlyHighlight } from "@/components/MonthlyHighlight";
import { cityMonthlyHighlight } from "@/lib/monthlyCompare";
import { SummerFeels } from "@/components/SummerFeels";
import { getSummerFeels } from "@/lib/summerfeels";
import { CityContext } from "@/components/CityContext";
import { getCityRanking } from "@/lib/ranking";
import { Methodology } from "@/components/Methodology";
import { EmbedButton } from "@/components/EmbedButton";
import { DayLookup } from "@/components/DayLookup";
import { NotifyButton } from "@/components/NotifyButton";
import { getClimateAnalog, fmtDecade } from "@/lib/climateAnalog";
import { gradiGiorno, ggZone } from "@/lib/degreedays";
import { SITE_URL } from "@/lib/site";
import {
  tempColor,
  weatherDesc,
  weatherDescEn,
  fmtDate,
  fmtDayShort,
  fmtDayShortEn,
  fmtAnomaly,
  fmtTemp,
} from "@/lib/format";
import { Temp } from "@/components/Temp";
import { QuickShare } from "@/components/QuickShare";

export const revalidate = 3600;
// Le pagine città sono generate on-demand (ISR) per non sovraccaricare l'API al build.

const STR = {
  it: {
    allCities: "← Tutte le città",
    share: (name: string) => `📲 Condividi ${name}`,
    secNowEyebrow: "🌤️ Meteo",
    secNow: "Adesso e prossimi giorni",
    secVerdictEyebrow: "⚖️ Analisi",
    secVerdict: "Il verdetto sui dati",
    secHistoryEyebrow: "📈 Storico",
    secHistory: "Dal 1940 a oggi",
    secHeatEyebrow: "🌡️ Estremi",
    secHeat: "Caldo estremo",
    secToolsEyebrow: "🧰 Strumenti",
    secTools: "Strumenti e condivisione",
    lastUpdated: "ultimo dato:",
    dataUnavailableTitle: (name: string) => `${name}: dati non disponibili`,
    dataUnavailableBody:
      "La fonte meteo è temporaneamente irraggiungibile. Riprova tra poco.",
    backHome: "← Torna alla home",
    insightWasThe: "è stato il",
    insightHottestYearAt: (name: string, total: number) =>
      `anno più caldo a ${name} su ${total} dal`,
    insightAmongHottest: "Tra i più caldi di sempre.",
    analog: (
      cityLabel: string,
      valueNow: React.ReactNode,
      otherCity: string,
      decade: string,
      valueThen: React.ReactNode,
    ) => (
      <>
        La temperatura media annua di {cityLabel} è oggi la stessa che aveva{" "}
        <strong>{otherCity}</strong> negli <strong>{decade}</strong> —{" "}
        {valueNow} contro {valueThen}.
      </>
    ),
    summerRecordCooler: (
      name: string,
      curT: React.ReactNode,
      hotT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        Con {curT} a {name} oggi, consolati: il <strong>{date}</strong> (
        {years} anni fa) qui si toccarono <strong>{hotT}</strong> — il record
        assoluto della serie dal 1940.
      </>
    ),
    summerRecordClose: (
      name: string,
      curT: React.ReactNode,
      hotT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        Con {curT}, {name} oggi è vicinissima al record assoluto di sempre:{" "}
        <strong>{hotT}</strong> del <strong>{date}</strong> ({years} anni fa).
      </>
    ),
    winterRecordCooler: (
      name: string,
      curT: React.ReactNode,
      coldT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        Con {curT} a {name} oggi, consolati: il <strong>{date}</strong> (
        {years} anni fa) qui si toccarono <strong>{coldT}</strong> — il record
        di freddo assoluto della serie dal 1940.
      </>
    ),
    winterRecordClose: (
      name: string,
      curT: React.ReactNode,
      coldT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        Con {curT}, {name} oggi è vicinissima al record di freddo assoluto di
        sempre: <strong>{coldT}</strong> del <strong>{date}</strong> ({years}{" "}
        anni fa).
      </>
    ),
    analogShare: (name: string, otherCity: string, decade: string, meanNow: string, meanThen: string) =>
      `${name} ha oggi la stessa temperatura media annua che aveva ${otherCity} negli ${decade} — ${meanNow} contro ${meanThen}.`,
    summerRecordShareCooler: (name: string, curT: string, hotT: string, date: string, years: number) =>
      `Con ${curT} a ${name} oggi, consolati: il ${date} (${years} anni fa) qui si toccarono ${hotT} — il record assoluto della serie dal 1940.`,
    summerRecordShareClose: (name: string, curT: string, hotT: string, date: string, years: number) =>
      `Con ${curT}, ${name} oggi è vicinissima al record assoluto di sempre: ${hotT} del ${date} (${years} anni fa).`,
    winterRecordShareCooler: (name: string, curT: string, coldT: string, date: string, years: number) =>
      `Con ${curT} a ${name} oggi, consolati: il ${date} (${years} anni fa) qui si toccarono ${coldT} — il record di freddo assoluto della serie dal 1940.`,
    winterRecordShareClose: (name: string, curT: string, coldT: string, date: string, years: number) =>
      `Con ${curT}, ${name} oggi è vicinissima al record di freddo assoluto di sempre: ${coldT} del ${date} (${years} anni fa).`,
    ggShare: (name: string, ggVal: string, zone: string) =>
      `${name}: stima di ${ggVal} gradi giorno (zona ${zone}) — basata sull'indicatore ufficiale italiano (DPR 412/93) del fabbisogno di riscaldamento degli edifici.`,
    durataShare: (name: string, days: number, start: string, end: string, peak: string) =>
      `A ${name} l'ondata di calore più lunga mai registrata è durata ${days} giorni consecutivi (dal ${start} al ${end}), con un picco di ${peak}.`,
    stripesTitle: "Le strisce del riscaldamento",
    stripesSubtitle: (startYear: number) => (
      <>
        Un anno per striscia, dal {startYear} a oggi:{" "}
        <span className="text-[#2166ac] font-semibold">blu</span> sotto la
        normale 1961–1990, <span className="text-[#b2182b] font-semibold">rosso</span>{" "}
        sopra.
      </>
    ),
    anomalyChartTitle: "Anomalia annua rispetto al 1961–1990",
    anomalyChartSubtitle:
      "Quanto ogni anno è stato più caldo (rosso) o più freddo (blu) della normale climatica. La linea tratteggiata è la tendenza.",
    decadeChartTitle: "Media per decennio",
    decadeChartSubtitle:
      "Aggregando per decennio, il rumore annuale sparisce e resta la tendenza di fondo.",
    heatSectionTitle: "Giorni roventi e notti tropicali 🥵",
    heatSectionSubtitle:
      "Giorni con massima ≥30° e notti con minima ≥20°. È l'afa che si sente sulla pelle: il grafico mostra come è cambiata.",
    heatDaysLabel: "Giorni ≥30° / anno",
    tropicalNightsLabel: "Notti tropicali / anno",
    vsBaseline: (v: string) => `rispetto al 1961–1990 (${v})`,
    heatEli5More: (weeks: number) => (
      <>
        💡 In pratica: rispetto al 1961–1990 ci sono circa{" "}
        <strong>{weeks} {weeks === 1 ? "settimana" : "settimane"} in più</strong>{" "}
        all&apos;anno di caldo sopra i 30°.
      </>
    ),
    heatEli5Same:
      "💡 In pratica: il numero di giorni sopra i 30° è rimasto stabile rispetto al 1961–1990.",
    ggTitle: "🏠 Gradi giorno (riscaldamento)",
    ggSubtitle: (zone: string) => (
      <>
        <strong>Stima</strong> basata sulla climatologia mensile (non sul
        calcolo ufficiale giorno per giorno del DPR 412/93): zona climatica
        indicativa <strong>{zone}</strong>. Può differire dal valore ufficiale
        del comune, specialmente nei mesi di transizione.
      </>
    ),
    ggEli5: "Più alto = inverni più freddi/lunghi, più bisogno di riscaldare casa.",
    durataTitle: "🔥📅 L'ondata di calore più lunga",
    durataSubtitle: "Il record di durata: la sequenza più lunga di giorni consecutivi con massima ≥35° dal 1940.",
    durataRange: (start: string, end: string, peak: React.ReactNode) => (
      <>
        {start} – {end} · picco {peak}
      </>
    ),
    durataFreddoTitle: "🥶📅 La sequenza di gelo più lunga",
    durataFreddoSubtitle: "Il record di durata: la sequenza più lunga di notti consecutive con minima ≤0° dal 1940.",
    durataFreddoRange: (start: string, end: string, low: React.ReactNode) => (
      <>
        {start} – {end} · minimo {low}
      </>
    ),
    durataFreddoShare: (name: string, days: number, start: string, end: string, low: string) =>
      `A ${name} la sequenza di notti di gelo più lunga mai registrata è durata ${days} giorni consecutivi (dal ${start} al ${end}), con un minimo di ${low}.`,
    minMaxTitle: "Massime e minime: chi si scalda di più?",
    minMaxSubtitle:
      "Stesso confronto a due trentenni (1961–1990 vs 1991–2020), ma separato per massime diurne e minime notturne: spesso non salgono allo stesso ritmo.",
    maxLabel: "☀️ Massime",
    minLabel: "🌙 Minime",
    minMaxSimilar: (name: string, maxV: React.ReactNode, minV: React.ReactNode) => (
      <>A {name} massime e minime sono salite in modo simile ({maxV} contro {minV}).</>
    ),
    minMaxMinRoseMore: (name: string, minV: React.ReactNode, maxV: React.ReactNode) => (
      <>
        A {name} le minime notturne sono salite più delle massime diurne (
        {minV} contro {maxV}): l&apos;escursione termica giorno/notte si sta
        riducendo.
      </>
    ),
    minMaxMaxRoseMore: (name: string, maxV: React.ReactNode, minV: React.ReactNode) => (
      <>
        A {name} le massime diurne sono salite più delle minime notturne (
        {maxV} contro {minV}): l&apos;escursione termica giorno/notte si sta
        ampliando.
      </>
    ),
    warmingLabel: "Ultimo anno",
    warmingSub: "vs normale 1961–1990",
    trendLabel: "Tendenza",
    trendSub: "per decennio (regressione)",
    hottestRecordLabel: "🔥 Record di caldo",
    coldestRecordLabel: "❄️ Record di freddo",
    warmestYearLabel: "🔥 Anno più caldo",
    coolestYearLabel: "❄️ Anno più fresco",
    yearlyTrendTitle: "Temperatura media annua dal 1940",
    yearlyTrendSubtitle: (
      warmestYear: number,
      warmestVal: React.ReactNode,
      coolestYear: number,
      coolestVal: React.ReactNode,
    ) => (
      <>
        L&apos;anno più caldo è stato il {warmestYear} ({warmestVal}), il più
        fresco il {coolestYear} ({coolestVal}). Linea spessa = media mobile 10
        anni.
      </>
    ),
    monthlyTitle: "Climatologia mensile (media 1940–oggi)",
    monthlySubtitle:
      "Massime medie, minime medie e media giornaliera per ciascun mese dell'anno.",
    recentTitle: "Ultimo anno · giorno per giorno",
    recentSubtitle: (date: string) => (
      <>Massime e minime giornaliere. Ultimo dato storico disponibile: {date}.</>
    ),
    relatedTitle: (region: string) => `Altre città in ${region}`,
    sourceLine: (startYear: number) => (
      <>Fonte: Open-Meteo · Storico ERA5 (ECMWF). Serie dal {startYear}.</>
    ),
    loadingBody:
      "📊 I dati storici dal 1940 si stanno caricando o sono temporaneamente non disponibili. Ricarica tra poco per vedere grafici e record.",
    humidity: "umidità",
    // Scala UV OMS: 0-2 · 3-5 · 6-7 · 8-10 · 11+
    uvSeverity: ["basso", "moderato", "alto", "molto alto", "estremo"],
    airLabel: "Aria",
    // Scala European AQI: 0-20 · 20-40 · 40-60 · 60-80 · 80-100 · 100+
    aqiLevels: [
      "buona",
      "discreta",
      "moderata",
      "scarsa",
      "pessima",
      "estremamente pessima",
    ],
    pollenLabel: "Pollini",
    pollenNames: {
      alder: "ontano",
      birch: "betulla",
      grass: "graminacee",
      mugwort: "artemisia",
      olive: "olivo",
      ragweed: "ambrosia",
    },
  },
  en: {
    allCities: "← All cities",
    share: (name: string) => `📲 Share ${name}`,
    secNowEyebrow: "🌤️ Weather",
    secNow: "Now and next days",
    secVerdictEyebrow: "⚖️ Analysis",
    secVerdict: "The data verdict",
    secHistoryEyebrow: "📈 History",
    secHistory: "From 1940 to today",
    secHeatEyebrow: "🌡️ Extremes",
    secHeat: "Extreme heat",
    secToolsEyebrow: "🧰 Tools",
    secTools: "Tools & sharing",
    lastUpdated: "last updated:",
    dataUnavailableTitle: (name: string) => `${name}: data unavailable`,
    dataUnavailableBody:
      "The weather source is temporarily unreachable. Please try again shortly.",
    backHome: "← Back home",
    insightWasThe: "was the",
    insightHottestYearAt: (name: string, total: number) =>
      `hottest year in ${name} out of ${total} since`,
    insightAmongHottest: "Among the hottest ever.",
    analog: (
      cityLabel: string,
      valueNow: React.ReactNode,
      otherCity: string,
      decade: string,
      valueThen: React.ReactNode,
    ) => (
      <>
        {cityLabel}&apos;s average annual temperature today matches what{" "}
        <strong>{otherCity}</strong> had in <strong>{decade}</strong> —{" "}
        {valueNow} vs {valueThen}.
      </>
    ),
    summerRecordCooler: (
      name: string,
      curT: React.ReactNode,
      hotT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        With {curT} in {name} today, take comfort: on <strong>{date}</strong>{" "}
        ({years} years ago) it hit <strong>{hotT}</strong> here — the
        all-time record of the series since 1940.
      </>
    ),
    summerRecordClose: (
      name: string,
      curT: React.ReactNode,
      hotT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        With {curT}, {name} today is very close to the all-time record:{" "}
        <strong>{hotT}</strong> on <strong>{date}</strong> ({years} years
        ago).
      </>
    ),
    winterRecordCooler: (
      name: string,
      curT: React.ReactNode,
      coldT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        With {curT} in {name} today, take comfort: on <strong>{date}</strong>{" "}
        ({years} years ago) it dropped to <strong>{coldT}</strong> here — the
        all-time cold record of the series since 1940.
      </>
    ),
    winterRecordClose: (
      name: string,
      curT: React.ReactNode,
      coldT: React.ReactNode,
      date: string,
      years: number,
    ) => (
      <>
        With {curT}, {name} today is very close to the all-time cold record:{" "}
        <strong>{coldT}</strong> on <strong>{date}</strong> ({years} years
        ago).
      </>
    ),
    analogShare: (name: string, otherCity: string, decade: string, meanNow: string, meanThen: string) =>
      `${name}'s average annual temperature today matches what ${otherCity} had in ${decade} — ${meanNow} vs ${meanThen}.`,
    summerRecordShareCooler: (name: string, curT: string, hotT: string, date: string, years: number) =>
      `With ${curT} in ${name} today, take comfort: on ${date} (${years} years ago) it hit ${hotT} here — the all-time record since 1940.`,
    summerRecordShareClose: (name: string, curT: string, hotT: string, date: string, years: number) =>
      `With ${curT}, ${name} today is very close to the all-time record: ${hotT} on ${date} (${years} years ago).`,
    winterRecordShareCooler: (name: string, curT: string, coldT: string, date: string, years: number) =>
      `With ${curT} in ${name} today, take comfort: on ${date} (${years} years ago) it dropped to ${coldT} here — the all-time cold record since 1940.`,
    winterRecordShareClose: (name: string, curT: string, coldT: string, date: string, years: number) =>
      `With ${curT}, ${name} today is very close to the all-time cold record: ${coldT} on ${date} (${years} years ago).`,
    ggShare: (name: string, ggVal: string, zone: string) =>
      `${name}: an estimated ${ggVal} heating degree days (zone ${zone}) — based on Italy's official DPR 412/93 indicator of a building's heating demand.`,
    durataShare: (name: string, days: number, start: string, end: string, peak: string) =>
      `${name}'s longest heatwave ever recorded lasted ${days} consecutive days (${start}–${end}), peaking at ${peak}.`,
    stripesTitle: "The warming stripes",
    stripesSubtitle: (startYear: number) => (
      <>
        One year per stripe, from {startYear} to today:{" "}
        <span className="text-[#2166ac] font-semibold">blue</span> below the
        1961–1990 normal, <span className="text-[#b2182b] font-semibold">red</span>{" "}
        above.
      </>
    ),
    anomalyChartTitle: "Annual anomaly vs 1961–1990",
    anomalyChartSubtitle:
      "How much warmer (red) or colder (blue) each year was than the climate normal. The dashed line is the trend.",
    decadeChartTitle: "Average per decade",
    decadeChartSubtitle:
      "Aggregating by decade, annual noise disappears and the underlying trend remains.",
    heatSectionTitle: "Heat days and tropical nights 🥵",
    heatSectionSubtitle:
      "Days with a high ≥30° and nights with a low ≥20°. It's the mugginess you feel on your skin: the chart shows how it has changed.",
    heatDaysLabel: "Days ≥30° / year",
    tropicalNightsLabel: "Tropical nights / year",
    vsBaseline: (v: string) => `vs 1961–1990 (${v})`,
    heatEli5More: (weeks: number) => (
      <>
        💡 In plain terms: compared to 1961–1990, there are roughly{" "}
        <strong>{weeks} extra {weeks === 1 ? "week" : "weeks"}</strong> of
        heat above 30° every year.
      </>
    ),
    heatEli5Same:
      "💡 In plain terms: the number of days above 30° has stayed roughly stable compared to 1961–1990.",
    ggTitle: "🏠 Heating degree days",
    ggSubtitle: (zone: string) => (
      <>
        <strong>Estimate</strong> based on monthly climatology (not the
        official day-by-day DPR 412/93 calculation): indicative climate zone{" "}
        <strong>{zone}</strong>. May differ from the municipality&apos;s
        official value, especially in shoulder-season months.
      </>
    ),
    ggEli5: "Higher = colder/longer winters, more heating needed at home.",
    durataTitle: "🔥📅 The longest heatwave",
    durataSubtitle: "The duration record: the longest run of consecutive days with a high ≥35° since 1940.",
    durataRange: (start: string, end: string, peak: React.ReactNode) => (
      <>
        {start} – {end} · peak {peak}
      </>
    ),
    durataFreddoTitle: "🥶📅 The longest cold snap",
    durataFreddoSubtitle: "The duration record: the longest run of consecutive nights with a low ≤0° since 1940.",
    durataFreddoRange: (start: string, end: string, low: React.ReactNode) => (
      <>
        {start} – {end} · low {low}
      </>
    ),
    durataFreddoShare: (name: string, days: number, start: string, end: string, low: string) =>
      `${name}'s longest cold snap ever recorded lasted ${days} consecutive frosty nights (${start}–${end}), dropping to ${low}.`,
    minMaxTitle: "Highs and lows: which is warming faster?",
    minMaxSubtitle:
      "Same two-normal comparison (1961–1990 vs 1991–2020), but split between daytime highs and nighttime lows: they often don't rise at the same pace.",
    maxLabel: "☀️ Highs",
    minLabel: "🌙 Lows",
    minMaxSimilar: (name: string, maxV: React.ReactNode, minV: React.ReactNode) => (
      <>In {name} highs and lows rose in a similar way ({maxV} vs {minV}).</>
    ),
    minMaxMinRoseMore: (name: string, minV: React.ReactNode, maxV: React.ReactNode) => (
      <>
        In {name} nighttime lows rose more than daytime highs ({minV} vs{" "}
        {maxV}): the day/night temperature range is shrinking.
      </>
    ),
    minMaxMaxRoseMore: (name: string, maxV: React.ReactNode, minV: React.ReactNode) => (
      <>
        In {name} daytime highs rose more than nighttime lows ({maxV} vs{" "}
        {minV}): the day/night temperature range is widening.
      </>
    ),
    warmingLabel: "Last year",
    warmingSub: "vs 1961–1990 normal",
    trendLabel: "Trend",
    trendSub: "per decade (regression)",
    hottestRecordLabel: "🔥 Hottest record",
    coldestRecordLabel: "❄️ Coldest record",
    warmestYearLabel: "🔥 Warmest year",
    coolestYearLabel: "❄️ Coolest year",
    yearlyTrendTitle: "Annual mean temperature since 1940",
    yearlyTrendSubtitle: (
      warmestYear: number,
      warmestVal: React.ReactNode,
      coolestYear: number,
      coolestVal: React.ReactNode,
    ) => (
      <>
        The hottest year was {warmestYear} ({warmestVal}), the coolest{" "}
        {coolestYear} ({coolestVal}). Thick line = 10-year moving average.
      </>
    ),
    monthlyTitle: "Monthly climatology (1940–today average)",
    monthlySubtitle:
      "Average highs, average lows and average daily mean for each month of the year.",
    recentTitle: "Last year · day by day",
    recentSubtitle: (date: string) => (
      <>Daily highs and lows. Last available historical data point: {date}.</>
    ),
    relatedTitle: (region: string) => `Other cities in ${region}`,
    sourceLine: (startYear: number) => (
      <>Source: Open-Meteo · ERA5 historical record (ECMWF). Series from {startYear}.</>
    ),
    loadingBody:
      "📊 Historical data since 1940 is still loading or temporarily unavailable. Reload shortly to see charts and records.",
    humidity: "humidity",
    // WHO UV scale: 0-2 · 3-5 · 6-7 · 8-10 · 11+
    uvSeverity: ["low", "moderate", "high", "very high", "extreme"],
    airLabel: "Air",
    // European AQI scale: 0-20 · 20-40 · 40-60 · 60-80 · 80-100 · 100+
    aqiLevels: [
      "good",
      "fair",
      "moderate",
      "poor",
      "very poor",
      "extremely poor",
    ],
    pollenLabel: "Pollen",
    pollenNames: {
      alder: "alder",
      birch: "birch",
      grass: "grass",
      mugwort: "mugwort",
      olive: "olive",
      ragweed: "ragweed",
    },
  },
} as const;

type Lang = "it" | "en";

function buildMetadata(slug: string, lang: Lang): Metadata {
  const city = getCity(slug);
  if (!city) return {};
  const name = cityName(city, lang);
  const path = lang === "en" ? `/en/citta/${city.slug}` : `/citta/${city.slug}`;
  const url = `${SITE_URL}${path}`;

  // Metadati data-driven: quando lo snapshot storico precalcolato è disponibile,
  // titolo e descrizione riportano il riscaldamento reale della città (normale
  // 1991–2020 vs 1961–1990) e il ritmo per decennio. Numeri in Celsius "piatti"
  // (rivolti ai crawler, nessun toggle unità): fmtAnomaly con locale per lingua.
  const stats = getArchiveStats(city);
  const warming = stats
    ? stats.trend.recentNormal - stats.trend.baselineMean
    : null;
  const perDecade = stats ? stats.trend.perDecade : null;

  if (lang === "en") {
    const title =
      warming != null
        ? `${name} climate since 1940: ${fmtAnomaly(warming, 1)}, historical data & anomalies`
        : `${name} climate since 1940: historical data & anomalies`;
    const description =
      warming != null && perDecade != null
        ? `${name} (${city.region}) has warmed by ${fmtAnomaly(warming, 1)} vs the 1961–1990 normal, at a pace of ${fmtAnomaly(perDecade, 2)} per decade. Current temperature, history since 1940, anomalies, records and warming stripes. ERA5/ECMWF data.`
        : `How has ${name}'s (${city.region}) temperature changed? Current temperature, history since 1940, anomalies, records and warming stripes. ERA5/ECMWF data.`;
    return {
      title,
      description,
      keywords: [
        `${name} weather`,
        `${name} temperature`,
        `${name} climate`,
        `${name} global warming`,
        `${name} temperature history`,
        `${name} climate change`,
        `${name} weather records`,
      ],
      alternates: {
        canonical: `/en/citta/${city.slug}`,
        languages: { it: `/citta/${city.slug}`, "x-default": `/citta/${city.slug}` },
      },
      openGraph: {
        type: "article",
        url,
        title,
        description,
        siteName: "Italia Rovente",
        locale: "en_US",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const title =
    warming != null
      ? `Clima di ${name} dal 1940: ${fmtAnomaly(warming, 1, "c", { locale: "it" })}, dati storici e anomalie`
      : `Clima di ${name} dal 1940: dati storici e anomalie`;
  const description =
    warming != null && perDecade != null
      ? `A ${name} (${city.region}) la temperatura è salita di ${fmtAnomaly(warming, 1, "c", { locale: "it" })} rispetto alla normale 1961–1990, a un ritmo di ${fmtAnomaly(perDecade, 2, "c", { locale: "it" })} per decennio. Temperatura attuale, storico dal 1940, anomalie, record e warming stripes. Dati ERA5/ECMWF.`
      : `Come è cambiata la temperatura di ${name} (${city.region})? Temperatura attuale, storico dal 1940, anomalie, record e warming stripes. Dati ERA5/ECMWF.`;
  return {
    title,
    description,
    keywords: [
      `meteo ${name}`,
      `temperatura ${name}`,
      `clima ${name}`,
      `riscaldamento ${name}`,
      `storico temperature ${name}`,
    ],
    alternates: {
      canonical: `/citta/${city.slug}`,
      languages: { en: `/en/citta/${city.slug}` },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Italia Rovente",
      locale: "it_IT",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(slug, "it");
}

export async function generateMetadataEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(slug, "en");
}

export async function renderCityPage(slug: string, lang: Lang) {
  const city = getCity(slug);
  if (!city) notFound();
  const t = STR[lang];
  const name = cityName(city, lang);
  const cityHome = lang === "en" ? "/en/citta" : "/";
  const shareHref =
    lang === "en" ? `/en/condividi/${city.slug}` : `/condividi/${city.slug}`;

  const [forecastR, archiveR, airR] = await Promise.allSettled([
    getForecast(city),
    getArchive(city),
    getAirQuality(city),
  ]);

  if (forecastR.status !== "fulfilled") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-3xl font-extrabold mb-2">
          {t.dataUnavailableTitle(name)}
        </h1>
        <p className="text-on-surface-variant mb-6">{t.dataUnavailableBody}</p>
        <Link
          href={lang === "en" ? "/en" : "/"}
          className="m3-chip bg-primary text-on-primary px-6 py-3"
        >
          {t.backHome}
        </Link>
      </div>
    );
  }

  const forecast = forecastR.value;
  const archive = archiveR.status === "fulfilled" ? archiveR.value : null;
  // Qualità dell'aria: dato accessorio, null su qualsiasi errore -> niente chip.
  const air = airR.status === "fulfilled" ? airR.value : null;
  // Cross-check E-OBS: null per le città fuori dalle 12 principali coperte.
  const eobsComparison = getEobsComparison(city.slug);
  const monthlyHighlight = cityMonthlyHighlight(archive?.monthlySeries);
  // Afa estiva: null per le città non principali (senza percepita).
  const summerFeels = getSummerFeels(archive?.summerApparent);
  // Posizione nella classifica nazionale del riscaldamento (per il box
  // "contesto di classifica" e i link interni alle città vicine).
  const ranking = getCityRanking(city.slug);

  const cur = forecast.current;
  const w = lang === "en" ? weatherDescEn(cur.code) : weatherDesc(cur.code);
  const color = tempColor(cur.temp);
  const trend = archive?.trend;
  const warming = trend ? trend.lastFullYearMean - trend.baselineMean : 0;

  // Smart insight: classifica dell'ultimo anno completo tra tutti gli anni.
  let insight: { year: number; rank: number; total: number } | null = null;
  if (archive) {
    const fy = archive.yearly.filter((y) => y.count >= 360);
    if (fy.length > 1) {
      const last = fy[fy.length - 1];
      const rank =
        [...fy].sort((a, b) => b.mean - a.mean).findIndex((y) => y.year === last.year) + 1;
      insight = { year: last.year, rank, total: fy.length };
    }
  }

  // Massime vs minime: chi si scalda di più (solo città con max/min reali)
  const minMax = archive ? getMinMaxWarming(archive) : null;

  // Gradi giorno (DPR 412/93): fabbisogno di riscaldamento stimato dalla
  // climatologia mensile già disponibile (nessun nuovo fetch).
  const gg = archive ? gradiGiorno(archive.monthly) : null;
  const zone = gg != null ? ggZone(gg) : null;

  // Ondata di calore più lunga mai registrata: precalcolata in
  // fetch-history.mjs dalla serie giornaliera (già scaricata per le medie
  // annue), nessun fetch aggiuntivo qui.
  const wave = archive?.records.longestHeatwave ?? null;
  // Simmetrico, per la sequenza di notti di gelo più lunga.
  const coldSnap = archive?.records.longestColdSnap ?? null;

  // Confronto climatico: quale altra città aveva, in passato, la stessa
  // temperatura media annua che questa città ha oggi.
  const analog = getClimateAnalog(city.slug);

  // Confronto col record assoluto d'estate: mostrato solo durante la
  // stagione calda (giugno-settembre) e solo se il record risale
  // all'estate (giugno-agosto), per un confronto "stagione con stagione".
  const hot = archive && archive.precise !== false ? archive.records.hottest : null;
  const nowDate = new Date();
  const curMonth = nowDate.getUTCMonth() + 1;
  const hotYear = hot ? parseInt(hot.date.slice(0, 4), 10) : null;
  const hotMonth = hot ? parseInt(hot.date.slice(5, 7), 10) : null;
  const yearsAgo = hotYear != null ? nowDate.getUTCFullYear() - hotYear : null;
  const showSummerRecord =
    hot != null &&
    hotMonth != null &&
    hotMonth >= 6 &&
    hotMonth <= 8 &&
    curMonth >= 6 &&
    curMonth <= 9 &&
    yearsAgo != null &&
    yearsAgo > 0 &&
    cur.temp != null;

  // Confronto col record assoluto d'inverno: stessa logica, ma per il record
  // di freddo (dicembre-febbraio), mostrato in una finestra più larga
  // (novembre-marzo) perché le ondate di freddo sono meno prevedibili.
  const cold = archive && archive.precise !== false ? archive.records.coldest : null;
  const coldYear = cold ? parseInt(cold.date.slice(0, 4), 10) : null;
  const coldMonth = cold ? parseInt(cold.date.slice(5, 7), 10) : null;
  const yearsAgoWinter = coldYear != null ? nowDate.getUTCFullYear() - coldYear : null;
  const showWinterRecord =
    cold != null &&
    coldMonth != null &&
    (coldMonth === 12 || coldMonth === 1 || coldMonth === 2) &&
    (curMonth === 11 || curMonth === 12 || curMonth === 1 || curMonth === 2 || curMonth === 3) &&
    yearsAgoWinter != null &&
    yearsAgoWinter > 0 &&
    cur.temp != null;

  // Altre città collegate (SEO internal-linking + UX): fino a 8 città della
  // stessa regione, ordinate per vicinanza geografica; se la regione ne ha
  // meno di 4, si completa con le più vicine in assoluto (nessun fetch,
  // solo CITIES).
  const relatedCities = getRelatedCities(city);

  // Giorni roventi & notti tropicali (solo città con max/min reali)
  let heat: { nowTN: number; oldTN: number; nowHD: number; oldHD: number } | null = null;
  if (archive && archive.precise !== false) {
    const fy = archive.yearly.filter((y) => y.count >= 360 && y.hd != null);
    if (fy.length > 10) {
      const old = fy.filter((y) => y.year >= 1961 && y.year <= 1990);
      const last5 = fy.slice(-5);
      const avg = (a: typeof fy, k: "hd" | "tn") =>
        a.reduce((s, y) => s + (y[k] ?? 0), 0) / a.length;
      heat = {
        oldTN: Math.round(avg(old, "tn")),
        nowTN: Math.round(avg(last5, "tn")),
        oldHD: Math.round(avg(old, "hd")),
        nowHD: Math.round(avg(last5, "hd")),
      };
    }
  }

  const path = lang === "en" ? `/en/citta/${city.slug}` : `/citta/${city.slug}`;
  const url = `${SITE_URL}${path}`;
  const curiosityUrl = (
    kind:
      | "record-estivo"
      | "record-invernale"
      | "gemello-climatico"
      | "gradi-giorno"
      | "record-durata"
      | "record-durata-freddo",
  ) => `${SITE_URL}${lang === "en" ? "/en" : ""}/condividi/curiosita/${city.slug}/${kind}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
      {
        "@type": "Dataset",
        name: `Temperature storiche di ${city.name} dal ${archive?.startYear ?? 1940}`,
        description: `Serie di temperatura dell'aria a 2 m di ${city.name} (${city.region}), media giornaliera e annua, con anomalie rispetto alla normale 1961–1990.`,
        url,
        inLanguage: lang === "en" ? "en-US" : "it-IT",
        keywords: [`${city.name}`, "temperatura", "riscaldamento globale", "clima", "ERA5"],
        creator: { "@type": "Organization", name: "ECMWF / Copernicus (ERA5)" },
        license: "https://open-meteo.com/en/license",
        spatialCoverage: {
          "@type": "Place",
          name: city.name,
          geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
        },
        ...(trend
          ? {
              temporalCoverage: `${trend.firstYear}/${trend.lastYear}`,
              // Array di PropertyValue: valori strutturati e non ambigui per
              // gli LLM e Google Dataset Search (riscaldamento tra le due
              // normali, ritmo per decennio, R², record assoluti). Non produce
              // rich result nella ricerca web normale — Dataset è scoped a
              // Dataset Search — ma è la forma più leggibile a macchina.
              variableMeasured: [
                {
                  "@type": "PropertyValue",
                  name: "Riscaldamento (normale 1991–2020 vs 1961–1990)",
                  value: Number((trend.recentNormal - trend.baselineMean).toFixed(2)),
                  unitText: "°C",
                },
                {
                  "@type": "PropertyValue",
                  name: "Tendenza per decennio",
                  value: Number(trend.perDecade.toFixed(2)),
                  unitText: "°C/decade",
                },
                {
                  "@type": "PropertyValue",
                  name: "R² della tendenza lineare",
                  value: Number(trend.r2.toFixed(3)),
                },
                ...(archive?.records?.hottest
                  ? [{
                      "@type": "PropertyValue",
                      name: "Record di caldo assoluto",
                      value: archive.records.hottest.value,
                      unitText: "°C",
                      valueReference: archive.records.hottest.date,
                    }]
                  : []),
                ...(archive?.records?.coldest
                  ? [{
                      "@type": "PropertyValue",
                      name: "Record di freddo assoluto",
                      value: archive.records.coldest.value,
                      unitText: "°C",
                      valueReference: archive.records.coldest.date,
                    }]
                  : []),
              ],
            }
          : {}),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <Link
          href={cityHome}
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          {t.allCities}
        </Link>
        <Link
          href={shareHref}
          aria-label={t.share(name)}
          title={t.share(name)}
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          📲
        </Link>
      </div>

      {/* HERO CITTÀ */}
      <section className="m3-card rise p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: color }}
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {name}
            </h1>
            <p className="text-on-surface-variant font-medium">
              {city.region} · {w.icon} {w.label}
            </p>
            {/* Chip che vanno a capo su tutte le dimensioni: nessuno scroll
                nascosto, nessun dato tagliato fuori dallo schermo su mobile.
                Tutte allo stesso livello, nessun raggruppamento con sfondo
                proprio (creava un doppio sfondo dietro le chip ambiente). */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="m3-chip whitespace-nowrap bg-secondary-container text-on-secondary-container">
                💧 {cur.humidity ?? "–"}% {t.humidity}
              </span>
              <span className="m3-chip whitespace-nowrap bg-tertiary-container text-on-tertiary-container">
                💨 {cur.wind ?? "–"} km/h
              </span>
              {cur.uvMax != null && (
                <span
                  className="m3-chip whitespace-nowrap text-on-surface"
                  style={{ background: `${UV_COLORS[uvSeverityIdx(cur.uvMax)]}2b` }}
                >
                  ☀️ UV {Math.round(cur.uvMax)} · {t.uvSeverity[uvSeverityIdx(cur.uvMax)]}
                </span>
              )}
              {air?.aqi != null && (
                <span className="m3-chip whitespace-nowrap bg-secondary-container text-on-secondary-container">
                  🌬️ {t.airLabel}: {t.aqiLevels[aqiLevelIdx(air.aqi)]}
                </span>
              )}
              {air && air.pollen.length > 0 && (
                <span className="m3-chip whitespace-nowrap bg-tertiary-container text-on-tertiary-container">
                  🌾 {t.pollenLabel}:{" "}
                  {air.pollen
                    .map((p) => (t.pollenNames as Record<string, string>)[p.key] ?? p.key)
                    .join(", ")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-7xl sm:text-8xl font-extrabold tracking-tighter leading-none"
              style={{ color }}
            >
              <Temp value={cur.temp} digits={0} />
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              {t.lastUpdated}{" "}
              {new Date(cur.time).toLocaleString(lang === "en" ? "en-US" : "it-IT", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* NUMERI CHIAVE — i fatti principali subito sotto la hero, prima dei
          grafici: 2×2 su mobile, 4 in fila su desktop. */}
      {archive && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <RecordCard
            label={t.warmingLabel}
            big={<Temp value={warming} digits={1} delta showUnit={false} locale={lang} />}
            sub={t.warmingSub}
            color={warming >= 0 ? "#ef4444" : "#2563eb"}
          />
          <RecordCard
            label={t.trendLabel}
            big={<Temp value={archive.trend.perDecade} digits={2} delta showUnit={false} locale={lang} />}
            sub={t.trendSub}
            color="#f97316"
          />
          {archive.precise !== false ? (
            <>
              <RecordCard
                label={t.hottestRecordLabel}
                big={<Temp value={archive.records.hottest.value} digits={1} />}
                sub={fmtDate(archive.records.hottest.date, lang)}
                color={tempColor(archive.records.hottest.value)}
              />
              <RecordCard
                label={t.coldestRecordLabel}
                big={<Temp value={archive.records.coldest.value} digits={1} />}
                sub={fmtDate(archive.records.coldest.date, lang)}
                color={tempColor(archive.records.coldest.value)}
              />
            </>
          ) : (
            <>
              <RecordCard
                label={t.warmestYearLabel}
                big={`${archive.records.warmestYear.year}`}
                sub={
                  <>
                    {lang === "en" ? "mean " : "media "}
                    <Temp value={archive.records.warmestYear.mean} digits={1} />
                  </>
                }
                color={tempColor(archive.records.warmestYear.mean)}
              />
              <RecordCard
                label={t.coolestYearLabel}
                big={`${archive.records.coolestYear.year}`}
                sub={
                  <>
                    {lang === "en" ? "mean " : "media "}
                    <Temp value={archive.records.coolestYear.mean} digits={1} />
                  </>
                }
                color={tempColor(archive.records.coolestYear.mean)}
              />
            </>
          )}
        </section>
      )}

      {/* SEZIONE: ADESSO E PROSSIMI GIORNI */}
      <SectionHeader eyebrow={t.secNowEyebrow} title={t.secNow} />
      <section>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {forecast.days
            .filter((d) => d.date >= new Date().toISOString().slice(0, 10))
            .slice(0, 7)
            .map((d) => {
              const dw = lang === "en" ? weatherDescEn(d.code) : weatherDesc(d.code);
              return (
                <div
                  key={d.date}
                  className="m3-card p-3 flex flex-col items-center gap-1 text-center"
                >
                  <span className="text-xs font-semibold text-on-surface-variant capitalize">
                    {lang === "en" ? fmtDayShortEn(d.date) : fmtDayShort(d.date)}
                  </span>
                  <span className="text-2xl">{dw.icon}</span>
                  <span className="font-extrabold tabular-nums" style={{ color: tempColor(d.max) }}>
                    <Temp value={d.max} digits={0} />
                  </span>
                  <span className="text-sm text-on-surface-variant tabular-nums">
                    <Temp value={d.min} digits={0} />
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {archive ? (
        <>
          {/* SEZIONE: IL VERDETTO */}
          <SectionHeader eyebrow={t.secVerdictEyebrow} title={t.secVerdict} />
          <Verdict
            scope={name}
            normalsDelta={archive.trend.recentNormal - archive.trend.baselineMean}
            perDecade={archive.trend.perDecade}
            ci95={archive.trend.perDecadeCi95}
            r2={archive.trend.r2}
            firstYear={archive.trend.firstYear}
            lastYear={archive.trend.lastYear}
            baseline={archive.trend.baselineMean}
            recentNormal={archive.trend.recentNormal}
            lang={lang}
          />

          {/* CONTESTO DI CLASSIFICA (internal linking verso città vicine + regione) */}
          {ranking && (
            <CityContext ranking={ranking} name={name} region={city.region} lang={lang} />
          )}

          {/* MESE A CONFRONTO (per città) */}
          <MonthlyHighlight
            highlight={monthlyHighlight}
            lang={lang}
            variant="city"
            scope={lang === "en" ? `in ${name}` : `a ${name}`}
          />

          {/* CROSS-CHECK E-OBS (solo 12 città principali) */}
          {eobsComparison && (
            <EobsCrossCheck
              eobs={eobsComparison}
              era5Warming={archive.trend.recentNormal - archive.trend.baselineMean}
              lang={lang}
            />
          )}

          {/* AFA D'ESTATE (solo città principali con temperatura percepita) */}
          {summerFeels && <SummerFeels data={summerFeels} scope={name} lang={lang} />}

          {/* SMART INSIGHT */}
          {insight && (
            <div
              className="m3-card rise p-4 sm:p-5 mb-6 flex items-center gap-4"
              style={insight.rank <= 3 ? { borderColor: "var(--primary)" } : undefined}
            >
              <span className="text-3xl sm:text-4xl shrink-0">
                {insight.rank <= 3 ? "🔥" : "📅"}
              </span>
              <p className="text-sm sm:text-base leading-relaxed">
                {lang === "en" ? (
                  <>
                    <strong>{insight.year}</strong> {t.insightWasThe}{" "}
                    <strong
                      style={{ color: insight.rank <= 5 ? "var(--primary)" : "var(--on-surface)" }}
                    >
                      {insight.rank}
                      {ordinalSuffix(insight.rank)}
                    </strong>{" "}
                    {t.insightHottestYearAt(name, insight.total)} {archive.startYear}.
                    {insight.rank <= 5 && <strong> {t.insightAmongHottest}</strong>}
                  </>
                ) : (
                  <>
                    Il <strong>{insight.year}</strong> {t.insightWasThe}{" "}
                    <strong
                      style={{ color: insight.rank <= 5 ? "var(--primary)" : "var(--on-surface)" }}
                    >
                      {insight.rank}°
                    </strong>{" "}
                    {t.insightHottestYearAt(name, insight.total)} {archive.startYear}.
                    {insight.rank <= 5 && <strong> {t.insightAmongHottest}</strong>}
                  </>
                )}
              </p>
            </div>
          )}

          {/* CONFRONTO CLIMATICO */}
          {analog && (
            <div className="m3-card rise p-4 sm:p-5 mb-6 flex items-start gap-4">
              <span className="text-3xl sm:text-4xl shrink-0">🕰️</span>
              <div>
                <p className="text-sm sm:text-base leading-relaxed">
                  {t.analog(
                    name,
                    <Temp value={analog.meanNow} digits={1} delta={false} />,
                    analog.cityName,
                    fmtDecade(analog.decade, lang),
                    <Temp value={analog.meanThen} digits={1} delta={false} />,
                  )}
                </p>
                <QuickShare
                  lang={lang}
                  url={curiosityUrl("gemello-climatico")}
                  text={t.analogShare(
                    name,
                    analog.cityName,
                    fmtDecade(analog.decade, lang),
                    fmtTemp(analog.meanNow, 1),
                    fmtTemp(analog.meanThen, 1),
                  )}
                />
              </div>
            </div>
          )}

          {/* CONFRONTO CON IL RECORD ESTIVO ASSOLUTO */}
          {showSummerRecord && hot && yearsAgo != null && (
            <div className="m3-card rise p-4 sm:p-5 mb-6 flex items-start gap-4">
              <span className="text-3xl sm:text-4xl shrink-0">
                {cur.temp! < hot.value ? "😌" : "🔥"}
              </span>
              <div>
                <p className="text-sm sm:text-base leading-relaxed">
                  {cur.temp! < hot.value
                    ? t.summerRecordCooler(
                        name,
                        <Temp value={cur.temp} digits={0} />,
                        <Temp value={hot.value} digits={1} />,
                        fmtDate(hot.date, lang),
                        yearsAgo,
                      )
                    : t.summerRecordClose(
                        name,
                        <Temp value={cur.temp} digits={0} />,
                        <Temp value={hot.value} digits={1} />,
                        fmtDate(hot.date, lang),
                        yearsAgo,
                      )}
                </p>
                <QuickShare
                  lang={lang}
                  url={curiosityUrl("record-estivo")}
                  text={
                    cur.temp! < hot.value
                      ? t.summerRecordShareCooler(name, fmtTemp(cur.temp, 0), fmtTemp(hot.value, 1), fmtDate(hot.date, lang), yearsAgo)
                      : t.summerRecordShareClose(name, fmtTemp(cur.temp, 0), fmtTemp(hot.value, 1), fmtDate(hot.date, lang), yearsAgo)
                  }
                />
              </div>
            </div>
          )}

          {/* CONFRONTO CON IL RECORD INVERNALE ASSOLUTO */}
          {showWinterRecord && cold && yearsAgoWinter != null && (
            <div className="m3-card rise p-4 sm:p-5 mb-6 flex items-start gap-4">
              <span className="text-3xl sm:text-4xl shrink-0">
                {cur.temp! > cold.value ? "😌" : "🥶"}
              </span>
              <div>
                <p className="text-sm sm:text-base leading-relaxed">
                  {cur.temp! > cold.value
                    ? t.winterRecordCooler(
                        name,
                        <Temp value={cur.temp} digits={0} />,
                        <Temp value={cold.value} digits={1} />,
                        fmtDate(cold.date, lang),
                        yearsAgoWinter,
                      )
                    : t.winterRecordClose(
                        name,
                        <Temp value={cur.temp} digits={0} />,
                        <Temp value={cold.value} digits={1} />,
                        fmtDate(cold.date, lang),
                        yearsAgoWinter,
                      )}
                </p>
                <QuickShare
                  lang={lang}
                  url={curiosityUrl("record-invernale")}
                  text={
                    cur.temp! > cold.value
                      ? t.winterRecordShareCooler(name, fmtTemp(cur.temp, 0), fmtTemp(cold.value, 1), fmtDate(cold.date, lang), yearsAgoWinter)
                      : t.winterRecordShareClose(name, fmtTemp(cur.temp, 0), fmtTemp(cold.value, 1), fmtDate(cold.date, lang), yearsAgoWinter)
                  }
                />
              </div>
            </div>
          )}

          {/* SEZIONE: DAL 1940 A OGGI (stripes + tutti i grafici storici) */}
          <SectionHeader eyebrow={t.secHistoryEyebrow} title={t.secHistory} />
          <section className="m3-card rise p-5 sm:p-6 mb-6">
            <h3 className="text-xl font-extrabold tracking-tight">
              {t.stripesTitle}
            </h3>
            <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
              {t.stripesSubtitle(archive.startYear)}
            </p>
            <WarmingStripes data={archive.anomalies} height={120} lang={lang} />
            <div className="mt-4">
              <EmbedButton citySlug={city.slug} lang={lang} />
            </div>
          </section>

          {/* ANOMALIE ANNUE */}
          <ChartCard title={t.anomalyChartTitle} subtitle={t.anomalyChartSubtitle}>
            <AnomalyBarChart data={archive.anomalies} lang={lang} />
          </ChartCard>

          {/* DECENNI */}
          <ChartCard title={t.decadeChartTitle} subtitle={t.decadeChartSubtitle}>
            <DecadeBars data={archive.decades} lang={lang} />
          </ChartCard>

          {/* GRAFICO TREND ANNUALE */}
          <ChartCard
            title={t.yearlyTrendTitle}
            subtitle={t.yearlyTrendSubtitle(
              archive.records.warmestYear.year,
              <Temp value={archive.records.warmestYear.mean} digits={2} />,
              archive.records.coolestYear.year,
              <Temp value={archive.records.coolestYear.mean} digits={2} />,
            )}
          >
            <YearlyTrendChart data={archive.yearly} baseline={archive.trend.baselineMean} lang={lang} />
          </ChartCard>

          {/* GRAFICO CLIMATOLOGIA MENSILE (solo città principali con max/min) */}
          {archive.precise !== false && (
            <ChartCard title={t.monthlyTitle} subtitle={t.monthlySubtitle}>
              <MonthlyClimChart data={archive.monthly} lang={lang} />
            </ChartCard>
          )}

          {/* GRAFICO ANDAMENTO RECENTE */}
          <ChartCard
            title={t.recentTitle}
            subtitle={t.recentSubtitle(fmtDate(archive.lastDate, lang))}
          >
            <RecentDailyChart data={archive.recent} lang={lang} />
          </ChartCard>

          {/* SEZIONE: CALDO ESTREMO (solo città con max/min reali) */}
          {(heat || minMax || gg != null) && (
            <SectionHeader eyebrow={t.secHeatEyebrow} title={t.secHeat} />
          )}

          {/* GIORNI ROVENTI & NOTTI TROPICALI */}
          {heat && (
            <section className="m3-card rise p-5 sm:p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">
                {t.heatSectionTitle}
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
                {t.heatSectionSubtitle}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">
                    {t.heatDaysLabel}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: "#f97316" }}>
                    {heat.nowHD}
                  </div>
                  <div className="text-xs text-on-surface-variant tabular-nums">
                    {heat.nowHD - heat.oldHD >= 0 ? "+" : ""}
                    {heat.nowHD - heat.oldHD} {t.vsBaseline(`${heat.oldHD}`)}
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">
                    {t.tropicalNightsLabel}
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: "#b2182b" }}>
                    {heat.nowTN}
                  </div>
                  <div className="text-xs text-on-surface-variant tabular-nums">
                    {heat.nowTN - heat.oldTN >= 0 ? "+" : ""}
                    {heat.nowTN - heat.oldTN} {t.vsBaseline(`${heat.oldTN}`)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                {heat.nowHD - heat.oldHD >= 4
                  ? t.heatEli5More(Math.round((heat.nowHD - heat.oldHD) / 7))
                  : t.heatEli5Same}
              </p>
              <HeatDaysChart data={archive.yearly} lang={lang} />
            </section>
          )}

          {/* GRADI GIORNO (riscaldamento) */}
          {gg != null && zone && (
            <section className="m3-card rise p-5 sm:p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">{t.ggTitle}</h3>
              <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
                {t.ggSubtitle(zone)}
              </p>
              <div className="rounded-2xl bg-surface-container-high p-4 inline-flex items-center gap-3">
                <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: "#1d4ed8" }}>
                  {gg.toLocaleString(lang === "it" ? "it-IT" : "en-US", { useGrouping: true })}
                </div>
                <div className="text-xs text-on-surface-variant">GG</div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-3">{t.ggEli5}</p>
              <QuickShare
                lang={lang}
                url={curiosityUrl("gradi-giorno")}
                text={t.ggShare(name, gg.toLocaleString(lang === "it" ? "it-IT" : "en-US", { useGrouping: true }), zone)}
              />
            </section>
          )}

          {/* RECORD DI DURATA (ondata di calore più lunga) */}
          {wave && (
            <section className="m3-card rise p-5 sm:p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">{t.durataTitle}</h3>
              <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
                {t.durataSubtitle}
              </p>
              <div className="rounded-2xl bg-surface-container-high p-4 inline-flex items-center gap-3">
                <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: "#ff8a5c" }}>
                  {wave.days}
                </div>
                <div className="text-xs text-on-surface-variant">{lang === "en" ? "days" : "giorni"}</div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-3">
                {t.durataRange(fmtDate(wave.start, lang), fmtDate(wave.end, lang), <Temp value={wave.peak} digits={1} />)}
              </p>
              <QuickShare
                lang={lang}
                url={curiosityUrl("record-durata")}
                text={t.durataShare(name, wave.days, fmtDate(wave.start, lang), fmtDate(wave.end, lang), fmtTemp(wave.peak, 1))}
              />
            </section>
          )}

          {/* RECORD DI DURATA (sequenza di gelo più lunga) */}
          {coldSnap && (
            <section className="m3-card rise p-5 sm:p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">{t.durataFreddoTitle}</h3>
              <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
                {t.durataFreddoSubtitle}
              </p>
              <div className="rounded-2xl bg-surface-container-high p-4 inline-flex items-center gap-3">
                <div className="text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: "#7fb3ff" }}>
                  {coldSnap.days}
                </div>
                <div className="text-xs text-on-surface-variant">{lang === "en" ? "days" : "giorni"}</div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-3">
                {t.durataFreddoRange(fmtDate(coldSnap.start, lang), fmtDate(coldSnap.end, lang), <Temp value={coldSnap.low} digits={1} />)}
              </p>
              <QuickShare
                lang={lang}
                url={curiosityUrl("record-durata-freddo")}
                text={t.durataFreddoShare(name, coldSnap.days, fmtDate(coldSnap.start, lang), fmtDate(coldSnap.end, lang), fmtTemp(coldSnap.low, 1))}
              />
            </section>
          )}

          {/* MASSIME VS MINIME */}
          {minMax && (
            <section className="m3-card rise p-5 sm:p-6 mb-6">
              <h3 className="text-xl font-extrabold tracking-tight">
                {t.minMaxTitle}
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
                {t.minMaxSubtitle}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">
                    {t.maxLabel}
                  </div>
                  <div
                    className="text-3xl font-extrabold tracking-tight tabular-nums"
                    style={{ color: minMax.deltaMax >= 0 ? "var(--primary)" : "var(--secondary)" }}
                  >
                    <Temp value={minMax.deltaMax} digits={1} delta locale={lang} />
                  </div>
                  <div className="text-xs text-on-surface-variant tabular-nums">
                    <Temp value={minMax.baselineMax} digits={1} /> → <Temp value={minMax.recentMax} digits={1} />
                  </div>
                </div>
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">
                    {t.minLabel}
                  </div>
                  <div
                    className="text-3xl font-extrabold tracking-tight tabular-nums"
                    style={{ color: minMax.deltaMin >= 0 ? "var(--primary)" : "var(--secondary)" }}
                  >
                    <Temp value={minMax.deltaMin} digits={1} delta locale={lang} />
                  </div>
                  <div className="text-xs text-on-surface-variant tabular-nums">
                    <Temp value={minMax.baselineMin} digits={1} /> → <Temp value={minMax.recentMin} digits={1} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">
                {Math.abs(minMax.deltaMin - minMax.deltaMax) < 0.1
                  ? t.minMaxSimilar(
                      name,
                      <Temp value={minMax.deltaMax} digits={1} delta locale={lang} />,
                      <Temp value={minMax.deltaMin} digits={1} delta locale={lang} />,
                    )
                  : minMax.deltaMin > minMax.deltaMax
                    ? t.minMaxMinRoseMore(
                        name,
                        <Temp value={minMax.deltaMin} digits={1} delta locale={lang} />,
                        <Temp value={minMax.deltaMax} digits={1} delta locale={lang} />,
                      )
                    : t.minMaxMaxRoseMore(
                        name,
                        <Temp value={minMax.deltaMax} digits={1} delta locale={lang} />,
                        <Temp value={minMax.deltaMin} digits={1} delta locale={lang} />,
                      )}
              </p>
            </section>
          )}

          {/* SEZIONE: STRUMENTI E CONDIVISIONE */}
          <SectionHeader eyebrow={t.secToolsEyebrow} title={t.secTools} />
          <DayLookup slug={city.slug} lang={lang} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={shareHref}
              className="m3-chip bg-primary text-on-primary px-5 py-2.5 hover:scale-105 transition-transform"
            >
              {t.share(name)}
            </Link>
            <NotifyButton lang={lang} />
          </div>

          <div className="mt-8">
            <Methodology lang={lang} />
          </div>

          {/* ALTRE CITTÀ (link interni) */}
          {relatedCities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-extrabold mb-3">
                {t.relatedTitle(city.region)}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`${lang === "en" ? "/en" : ""}/citta/${c.slug}`}
                    className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                  >
                    {cityName(c, lang)}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="text-xs text-on-surface-variant text-center mt-8">
            {t.sourceLine(archive.startYear)}
          </p>
        </>
      ) : (
        <>
          <section className="m3-card p-6 mt-8 text-center">
            <p className="text-on-surface-variant">{t.loadingBody}</p>
          </section>

          {/* SEZIONE: STRUMENTI (la macchina del tempo funziona anche senza
              lo storico precalcolato in cache) */}
          <SectionHeader eyebrow={t.secToolsEyebrow} title={t.secTools} />
          <DayLookup slug={city.slug} lang={lang} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={shareHref}
              className="m3-chip bg-primary text-on-primary px-5 py-2.5 hover:scale-105 transition-transform"
            >
              {t.share(name)}
            </Link>
            <NotifyButton lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}

// Città collegate per la sezione di link interni: le altre città della stessa
// regione (max 8, le più vicine prima); se la regione ne ha meno di 4, si
// completa fino a 8 con le città più vicine per distanza lat/lon (distanza
// equirettangolare: sufficiente per ordinare città italiane, niente haversine).
function getRelatedCities(city: City): City[] {
  const dist2 = (a: City, b: City) => {
    const dLat = a.lat - b.lat;
    const dLon = (a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
    return dLat * dLat + dLon * dLon;
  };
  const byDistance = (a: City, b: City) => dist2(a, city) - dist2(b, city);
  const sameRegion = CITIES.filter(
    (c) => c.region === city.region && c.slug !== city.slug,
  )
    .sort(byDistance)
    .slice(0, 8);
  if (sameRegion.length >= 4) return sameRegion;
  const picked = new Set(sameRegion.map((c) => c.slug));
  const nearest = CITIES.filter(
    (c) => c.slug !== city.slug && !picked.has(c.slug),
  )
    .sort(byDistance)
    .slice(0, 8 - sameRegion.length);
  return [...sameRegion, ...nearest];
}

// Scala UV OMS -> indice nella tabella STR (0-2 · 3-5 · 6-7 · 8-10 · 11+) e
// colore associato (verde/giallo/arancio/rosso/viola, convenzione OMS). Il
// colore è usato solo come sfondo molto tenue (~17% alpha) del chip, così il
// testo resta leggibile con il normale colore on-surface in ogni tema.
const UV_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"] as const;
function uvSeverityIdx(uv: number): 0 | 1 | 2 | 3 | 4 {
  if (uv < 3) return 0;
  if (uv < 6) return 1;
  if (uv < 8) return 2;
  if (uv < 11) return 3;
  return 4;
}

// European AQI -> indice nella tabella STR (0-20 · 20-40 · 40-60 · 60-80 · 80-100 · 100+)
function aqiLevelIdx(aqi: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (aqi < 20) return 0;
  if (aqi < 40) return 1;
  if (aqi < 60) return 2;
  if (aqi < 80) return 3;
  if (aqi < 100) return 4;
  return 5;
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Intestazione di sezione riutilizzata in tutta la pagina: chip "eyebrow"
// (emoji + etichetta breve) sopra un h2 grande, con ampio respiro superiore
// (l'mt-12 collassa con l'mb-6 delle card precedenti -> 48px costanti).
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mt-12 mb-4">
      <span className="m3-chip bg-surface-container-high text-on-surface text-xs px-3 py-1">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight mt-2">{title}</h2>
    </div>
  );
}

function RecordCard({
  label,
  big,
  sub,
  color,
}: {
  label: string;
  big: React.ReactNode;
  sub: React.ReactNode;
  color: string;
}) {
  // min-w-0 + dimensione responsive: niente clipping nella griglia 2×2 mobile
  // anche con i valori Fahrenheit più lunghi (es. "+35.2"); tabular-nums per
  // allineare le cifre tra le quattro card.
  return (
    <div className="m3-card rise p-4 sm:p-5 flex flex-col gap-0.5 min-w-0">
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
        {label}
      </div>
      <div
        className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums leading-tight"
        style={{ color }}
      >
        {big}
      </div>
      <div className="text-xs text-on-surface-variant tabular-nums">{sub}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  // h3, non h2: i titoli delle card vivono sotto gli h2 di sezione.
  return (
    <section className="m3-card rise p-5 sm:p-6 mb-6">
      <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
        {subtitle}
      </p>
      {children}
    </section>
  );
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderCityPage(slug, "it");
}
