import Link from "next/link";
import { CITIES, cityName, cityDisplayName, type City } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { anomalyColor, readableTextOn, tempColor, fmtDate } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { ExpandableList } from "@/components/ExpandableList";
import { YearExtremes } from "@/components/YearExtremes";
import { gradiGiorno, ggZone } from "@/lib/degreedays";
import { getSummerFeelsRanking } from "@/lib/summerfeels";
import { getLifetimeData } from "@/lib/lifetime";
import { SITE_URL } from "@/lib/site";
import { faqPageJsonLd, fmtSignedC, type Faq } from "@/lib/faq";
import { FaqBlock } from "@/components/FaqBlock";

export const metadata = {
  title: "Classifiche · Le città del riscaldamento",
  description:
    `Le graduatorie delle ${CITIES.length} città monitorate: dove ci si scalda di più, il ritmo per decennio, i record assoluti, i giorni di caldo africano e le notti tropicali. Dati ERA5/ECMWF dal 1940.`,
  keywords: [
    "classifica città più calde italia",
    "riscaldamento città italiane",
    "record temperatura italia",
    "giorni di caldo africano",
    "giorni roventi città italiane",
    "notti tropicali",
    "quali città hanno più giorni di caldo estremo",
  ],
  alternates: { canonical: "/classifiche", languages: { en: "/en/classifiche" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/classifiche`,
    title: "Classifiche · Italia Rovente",
    description:
      "Le città che si scaldano di più, i record assoluti, le notti tropicali. Dati ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

const STR = {
  it: {
    backLink: "← Tutte le città",
    backHref: "/citta",
    heading: "Classifiche",
    subtitle: (n: number) =>
      `Le graduatorie delle ${n} città monitorate, calcolate dagli aggregati storici ERA5 (ECMWF/Copernicus) dal 1940 e aggiornate a ogni ricalcolo dei dati. Solo numeri, periodi e metodo dichiarato.`,
    warmingTitle: "🔥 Le città che si scaldano di più",
    warmingSub:
      "Differenza tra la normale climatica 1991–2020 e quella 1961–1990: le prime 10.",
    coolTitle: "🧊 Le più «fresche»",
    coolSub:
      "Dove il cambiamento è più contenuto: le 5 città con la differenza minore tra le due normali (1991–2020 vs 1961–1990).",
    paceTitle: "⏱️ Il ritmo più veloce",
    paceSub:
      "Pendenza della regressione lineare sulle medie annue dell'intera serie, in gradi per decennio: le prime 10.",
    recordsTitle: "🌡️ I record assoluti",
    recordsSub:
      "Le massime e le minime giornaliere più estreme dell'intera serie (solo città con max/min reali).",
    recordsHot: "Le massime più alte",
    recordsCold: "Le minime più basse",
    hdTitle: "🥵 I giorni più roventi",
    hdSub:
      "Giorni con massima ≥30° — la soglia comunemente chiamata «caldo africano»: media annua degli ultimi 5 anni completi, con l'aumento rispetto alla media 1961–1990 tra parentesi.",
    hotDaysPerYear: "giorni/anno",
    tnTitle: "🌙 Le notti tropicali",
    tnSub:
      "Notti con minima ≥20°: media annua degli ultimi 5 anni completi, con l'aumento rispetto alla media 1961–1990 tra parentesi.",
    perDecadeSuffix: "/decennio",
    nightsPerYear: "notti/anno",
    vsBaseline: "vs 1961–1990",
    swingTitle: "↕️ L'escursione termica maggiore",
    swingSub:
      "Differenza tra le massime medie e le minime medie (media degli ultimi 5 anni completi): clima più «continentale», con giorni caldi e notti fresche.",
    swingLowTitle: "🌊 L'escursione termica minore",
    swingLowSub:
      "Dove il divario giorno/notte è più piccolo: spesso segnale di clima mite, costiero o insulare.",
    heatwaveTitle: "🔥📅 L'ondata di calore più lunga di sempre",
    heatwaveSub:
      "Il record assoluto di giorni consecutivi con massima ≥35°, città per città (solo dove il dato è già stato ricalcolato).",
    daysUnit: "giorni",
    coldSnapTitle: "🥶📅 La sequenza di gelo più lunga di sempre",
    coldSnapSub:
      "Il record assoluto di notti consecutive con minima ≤0°, città per città.",
    reliabilityTitle: "📊 Il segnale di riscaldamento più chiaro",
    reliabilitySub:
      "R² della regressione lineare sull'intera serie storica: più è vicino a 1, più la tendenza è netta e poco rumorosa — non quanto si scalda, ma quanto è leggibile il segnale.",
    noisyTitle: "🎲 Il segnale più rumoroso",
    noisySub:
      "Dove l'andamento anno per anno oscilla di più rispetto alla tendenza di fondo: un R² basso non significa che il riscaldamento non ci sia, solo che è meno regolare.",
    ggTitle: "🏠 Dove si riscalda di più in inverno",
    ggSub:
      "Gradi giorno (DPR 412/93, stima dalla climatologia mensile): più alto è il numero, più fabbisogno di riscaldamento ha un edificio in quella città. Tra parentesi la zona climatica (A–F).",
    ggLowTitle: "☀️ Dove si riscalda di meno in inverno",
    ggLowSub: "Le città con il fabbisogno di riscaldamento stimato più basso.",
    feelsTitle: "🥵 L'estate più opprimente",
    feelsSub: (n: number) =>
      `Temperatura percepita media (giugno–agosto, normale 1991–2020) — quanto si sente davvero il caldo, con umidità e vento. Solo le ${n} città principali con la percepita disponibile; la percepita è una stima modellistica, meno solida della temperatura misurata.`,
    gapTitle: "💧 Dove l'umidità pesa di più",
    gapSub:
      "Quanto l'afa (umidità e assenza di vento) aggiunge oggi in media alla temperatura reale d'estate. Le coste tendono a stare sopra l'entroterra.",
    feelsDeltaTitle: "📈 Dove l'afa estiva è cresciuta di più",
    feelsDeltaSub: "Aumento della percepita estiva media tra le normali 1961–1990 e 1991–2020.",
    jumpTo: "Salta a:",
    navReheat: "Riscaldamento",
    navRecords: "Record",
    navFelt: "Caldo percepito",
    navWinter: "Inverno",
    navYears: "Anni estremi",
    famReheat: "🔥 Quanto, e quanto in fretta",
    famReheatSub:
      "Di quanto sono salite le temperature e con che ritmo — e quanto è netto il segnale.",
    famRecords: "🌡️ Record e durate",
    famRecordsSub:
      "Gli estremi assoluti mai registrati e le sequenze più lunghe di caldo e di gelo.",
    famFelt: "🥵 Il caldo che si sente",
    famFeltSub:
      "Non solo i gradi: giorni roventi, notti tropicali e la percepita con l'umidità.",
    famWinter: "❄️ Inverno ed escursione",
    famWinterSub: "Fabbisogno di riscaldamento invernale e divario tra giorno e notte.",
    famYears: "🏆 Gli anni più estremi",
    showAll: (n: number) => `Mostra tutte le ${n} →`,
    showLess: "Riduci ↑",
  },
  en: {
    backLink: "← All cities",
    backHref: "/en/citta",
    heading: "Rankings",
    subtitle: (n: number) =>
      `Rankings across the ${n} monitored cities, computed from the ERA5 (ECMWF/Copernicus) historical aggregates since 1940 and refreshed at every data recalculation. Just numbers, periods and a stated method.`,
    warmingTitle: "🔥 The fastest-warming cities",
    warmingSub:
      "Difference between the 1991–2020 climate normal and the 1961–1990 one: the top 10.",
    coolTitle: "🧊 The “coolest” ones",
    coolSub:
      "Where the change is smallest: the 5 cities with the lowest difference between the two normals (1991–2020 vs 1961–1990).",
    paceTitle: "⏱️ The fastest pace",
    paceSub:
      "Linear-regression slope of the yearly means over the whole series, in degrees per decade: the top 10.",
    recordsTitle: "🌡️ The all-time records",
    recordsSub:
      "The most extreme daily highs and lows of the whole series (only cities with real max/min data).",
    recordsHot: "Highest maximums",
    recordsCold: "Lowest minimums",
    hdTitle: "🥵 The most scorching days",
    hdSub:
      "Days with a high ≥30° — the threshold commonly called «African heat»: yearly average over the last 5 full years, with the increase vs the 1961–1990 normal in parentheses.",
    hotDaysPerYear: "days/year",
    tnTitle: "🌙 Tropical nights",
    tnSub:
      "Nights with a minimum ≥20°: yearly average over the last 5 full years, with the increase vs the 1961–1990 normal in parentheses.",
    perDecadeSuffix: "/decade",
    nightsPerYear: "nights/year",
    vsBaseline: "vs 1961–1990",
    swingTitle: "↕️ The widest day/night swing",
    swingSub:
      "Difference between average daily highs and lows (average of the last 5 full years): a more «continental» climate, with hot days and cool nights.",
    swingLowTitle: "🌊 The narrowest day/night swing",
    swingLowSub:
      "Where the day/night gap is smallest: often a sign of a mild, coastal or island climate.",
    heatwaveTitle: "🔥📅 The longest heatwave on record",
    heatwaveSub:
      "The all-time record of consecutive days with a high ≥35°, city by city (only where this field has already been recalculated).",
    daysUnit: "days",
    coldSnapTitle: "🥶📅 The longest cold snap on record",
    coldSnapSub:
      "The all-time record of consecutive nights with a low ≤0°, city by city.",
    reliabilityTitle: "📊 The clearest warming signal",
    reliabilitySub:
      "R² of the linear regression over the whole historical series: the closer to 1, the clearer and less noisy the trend — not how much it's warming, but how readable the signal is.",
    noisyTitle: "🎲 The noisiest signal",
    noisySub:
      "Where year-to-year swings around the underlying trend are largest: a low R² doesn't mean the warming isn't real, just that it's less regular.",
    ggTitle: "🏠 Where winter heating demand is highest",
    ggSub:
      "Heating degree days (DPR 412/93, estimated from monthly climatology): the higher the number, the more heating a building needs in that city. Climate zone (A–F) in parentheses.",
    ggLowTitle: "☀️ Where winter heating demand is lowest",
    ggLowSub: "The cities with the lowest estimated heating demand.",
    feelsTitle: "🥵 The most oppressive summer",
    feelsSub: (n: number) =>
      `Mean apparent temperature (June–August, 1991–2020 normal) — how hot it really feels, with humidity and wind. Only the ${n} main cities with apparent temperature available; it's a model estimate, less solid than the measured temperature.`,
    gapTitle: "💧 Where humidity weighs most",
    gapSub:
      "How much mugginess (humidity and lack of wind) adds on average to the actual summer temperature today. Coasts tend to sit above the inland cities.",
    feelsDeltaTitle: "📈 Where summer mugginess grew most",
    feelsDeltaSub: "Rise in the mean summer apparent temperature between the 1961–1990 and 1991–2020 normals.",
    jumpTo: "Jump to:",
    navReheat: "Warming",
    navRecords: "Records",
    navFelt: "Felt heat",
    navWinter: "Winter",
    navYears: "Extreme years",
    famReheat: "🔥 How much, and how fast",
    famReheatSub:
      "How far temperatures have risen and at what pace — and how clear the signal is.",
    famRecords: "🌡️ Records & streaks",
    famRecordsSub:
      "The all-time extremes ever recorded and the longest heat and frost streaks.",
    famFelt: "🥵 The heat you feel",
    famFeltSub:
      "Not just degrees: scorching days, tropical nights and humidity-driven apparent heat.",
    famWinter: "❄️ Winter & day/night swing",
    famWinterSub: "Winter heating demand and the gap between day and night.",
    famYears: "🏆 The most extreme years",
    showAll: (n: number) => `Show all ${n} →`,
    showLess: "Show less ↑",
  },
} as const;

type CityStats = NonNullable<ReturnType<typeof getArchiveStats>>;

function cityHref(slug: string, lang: "it" | "en"): string {
  return `${lang === "en" ? "/en" : ""}/citta/${slug}`;
}

function RankRow({
  href,
  rank,
  name,
  badge,
  badgeBg,
  badgeText,
  sub,
}: {
  href: string;
  rank: number;
  name: string;
  badge: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  sub: React.ReactNode;
}) {
  return (
    <Link href={href} className="m3-card m3-card-interactive p-3 flex items-center gap-3 group">
      <span className="w-6 text-right text-xs font-extrabold text-on-surface-variant tabular-nums shrink-0">
        {rank}
      </span>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
        style={{ background: badgeBg, color: badgeText }}
      >
        {badge}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
          {name}
        </div>
        <div className="text-xs text-on-surface-variant">{sub}</div>
      </div>
    </Link>
  );
}

// Intestazione di famiglia (livello alto, h2): raggruppa più classifiche affini
// sotto un unico titolo, e fa da bersaglio per l'indice a chip in cima. `first`
// evita il doppio filo (l'indice ha già un bordo inferiore) sulla prima famiglia.
function FamilyHeader({
  id,
  title,
  sub,
  first = false,
}: {
  id: string;
  title: string;
  sub: string;
  first?: boolean;
}) {
  return (
    <div
      id={id}
      className={`scroll-mt-32 mb-6 ${first ? "pt-2" : "border-t border-[var(--outline-variant)] pt-8"}`}
    >
      <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">{sub}</p>
    </div>
  );
}

// Intestazione della singola classifica (livello sotto la famiglia, h3).
function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{sub}</p>
    </div>
  );
}

export function ClassifichePageContent({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];

  // Solo le città con snapshot già calcolato (alcune possono essere null
  // mentre i dati sono in caricamento: si escludono senza rompere nulla).
  const stats: { city: City; s: CityStats }[] = CITIES.flatMap((city) => {
    const s = getArchiveStats(city);
    return s ? [{ city, s }] : [];
  });

  // --- Riscaldamento: normale 1991–2020 vs 1961–1990 -----------------------
  const warmingRanking = stats
    .map(({ city, s }) => ({
      city,
      warming: s.trend.recentNormal - s.trend.baselineMean,
      perDecade: s.trend.perDecade,
    }))
    .filter((r) => Number.isFinite(r.warming))
    .sort((a, b) => b.warming - a.warming);
  const topWarming = warmingRanking.slice(0, 10);
  const coolest = warmingRanking.slice(-5).reverse();

  // --- Ritmo: °C/decennio (pendenza regressione su tutta la serie) ---------
  const pace = stats
    .map(({ city, s }) => ({ city, perDecade: s.trend.perDecade, r2: s.trend.r2 }))
    .filter((r) => Number.isFinite(r.perDecade))
    .sort((a, b) => b.perDecade - a.perDecade)
    .slice(0, 10);

  // --- Record assoluti (solo città con max/min reali) -----------------------
  const withRecords = stats.filter(
    ({ s }) =>
      s.precise !== false &&
      Number.isFinite(s.records?.hottest?.value) &&
      Number.isFinite(s.records?.coldest?.value),
  );
  const hottestRecords = [...withRecords]
    .sort((a, b) => b.s.records.hottest.value - a.s.records.hottest.value)
    .slice(0, 10);
  const coldestRecords = [...withRecords]
    .sort((a, b) => a.s.records.coldest.value - b.s.records.coldest.value)
    .slice(0, 5);

  // --- Giorni roventi (≥30°, "caldo africano"): media ultimi 5 anni + delta vs 1961–1990 ---
  const hotDays = stats
    .flatMap(({ city, s }) => {
      if (s.precise === false) return [];
      const hdYears = s.yearly.filter((y) => y.count >= 360 && y.hd != null);
      if (hdYears.length === 0) return [];
      const last5 = hdYears.slice(-5);
      const avg = last5.reduce((sum, y) => sum + (y.hd ?? 0), 0) / last5.length;
      const baseYears = hdYears.filter((y) => y.year >= 1961 && y.year <= 1990);
      const baseAvg = baseYears.length
        ? baseYears.reduce((sum, y) => sum + (y.hd ?? 0), 0) / baseYears.length
        : null;
      return [{ city, avg, delta: baseAvg != null ? avg - baseAvg : null }];
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // --- Notti tropicali: media ultimi 5 anni completi + delta vs 1961–1990 ---
  const tropical = stats
    .flatMap(({ city, s }) => {
      if (s.precise === false) return [];
      const tnYears = s.yearly.filter((y) => y.count >= 360 && y.tn != null);
      if (tnYears.length === 0) return [];
      const last5 = tnYears.slice(-5);
      const avg = last5.reduce((sum, y) => sum + (y.tn ?? 0), 0) / last5.length;
      const baseYears = tnYears.filter((y) => y.year >= 1961 && y.year <= 1990);
      const baseAvg = baseYears.length
        ? baseYears.reduce((sum, y) => sum + (y.tn ?? 0), 0) / baseYears.length
        : null;
      return [{ city, avg, delta: baseAvg != null ? avg - baseAvg : null }];
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // --- Escursione termica: media (massime - minime) sugli ultimi 5 anni completi ---
  const swing = stats
    .flatMap(({ city, s }) => {
      if (s.precise === false) return [];
      const fy = s.yearly.filter((y) => y.count >= 360);
      if (fy.length === 0) return [];
      const last5 = fy.slice(-5);
      const avg = last5.reduce((sum, y) => sum + (y.max - y.min), 0) / last5.length;
      return [{ city, avg }];
    })
    .sort((a, b) => b.avg - a.avg);
  const topSwing = swing.slice(0, 10);
  const lowSwing = swing.slice(-5).reverse();

  // --- Ondata di calore più lunga di sempre (record assoluto, per città) ---
  const heatwaveRanking = stats
    .filter(({ s }) => Number.isFinite(s.records?.longestHeatwave?.days))
    .sort((a, b) => b.s.records.longestHeatwave!.days - a.s.records.longestHeatwave!.days)
    .slice(0, 10);

  // --- Sequenza di gelo più lunga di sempre (record assoluto, per città) ---
  const coldSnapRanking = stats
    .filter(({ s }) => Number.isFinite(s.records?.longestColdSnap?.days))
    .sort((a, b) => b.s.records.longestColdSnap!.days - a.s.records.longestColdSnap!.days)
    .slice(0, 10);

  // --- Affidabilità del trend: R² della regressione (segnale più chiaro / più rumoroso) ---
  const reliabilityRanking = stats
    .map(({ city, s }) => ({ city, r2: s.trend.r2, perDecade: s.trend.perDecade }))
    .filter((r) => Number.isFinite(r.r2))
    .sort((a, b) => b.r2 - a.r2);
  const topReliability = reliabilityRanking.slice(0, 10);
  const noisiest = reliabilityRanking.slice(-5).reverse();

  // --- Gradi giorno (fabbisogno di riscaldamento invernale, DPR 412/93) ---
  const degreeDaysRanking = stats
    .flatMap(({ city, s }) => {
      const gg = gradiGiorno(s.monthly);
      return gg != null ? [{ city, gg }] : [];
    })
    .sort((a, b) => b.gg - a.gg);
  const topDegreeDays = degreeDaysRanking.slice(0, 10);
  const lowDegreeDays = degreeDaysRanking.slice(-5).reverse();

  // --- Afa d'estate (solo città principali con temperatura percepita) ---
  const feelsRows = getSummerFeelsRanking();
  const feelsCount = feelsRows.length;
  const feelsTop = [...feelsRows].sort((a, b) => b.feelsRecent - a.feelsRecent).slice(0, 10);
  const gapTop = [...feelsRows].sort((a, b) => b.gapRecent - a.gapRecent).slice(0, 10);
  const feelsDeltaTop = [...feelsRows].sort((a, b) => b.feelsDelta - a.feelsDelta).slice(0, 10);

  // --- Anni più estremi in assoluto (media nazionale, riuso getLifetimeData) ---
  const lifetimeData = getLifetimeData();

  // FAQ / AEO: le città che si scaldano di più (top 3), la media nazionale e
  // il record di caldo tra le monitorate — come FAQPage + sezione visibile.
  const top3 = topWarming.slice(0, 3);
  const natAvg = warmingRanking.length
    ? warmingRanking.reduce((s, r) => s + r.warming, 0) / warmingRanking.length
    : null;
  const rec0 = hottestRecords[0];
  const rankFaq: Faq[] = [];
  if (top3.length >= 3) {
    rankFaq.push(
      lang === "en"
        ? {
            q: "Which Italian cities are warming the most?",
            a: `Leading the ranking: ${cityName(top3[0].city, "en")} (${fmtSignedC(top3[0].warming, "en")}°C), ${cityName(top3[1].city, "en")} (${fmtSignedC(top3[1].warming, "en")}°C) and ${cityName(top3[2].city, "en")} (${fmtSignedC(top3[2].warming, "en")}°C), difference between the 1991–2020 and 1961–1990 climate normals (ERA5/Copernicus).`,
          }
        : {
            q: "Quali città italiane si scaldano di più?",
            a: `In testa: ${cityName(top3[0].city, "it")} (${fmtSignedC(top3[0].warming, "it")}°C), ${cityName(top3[1].city, "it")} (${fmtSignedC(top3[1].warming, "it")}°C) e ${cityName(top3[2].city, "it")} (${fmtSignedC(top3[2].warming, "it")}°C), differenza tra le normali climatiche 1991–2020 e 1961–1990 (dati ERA5/Copernicus).`,
          },
    );
  }
  if (natAvg != null) {
    rankFaq.push(
      lang === "en"
        ? {
            q: "How much has Italy warmed on average since 1940?",
            a: `Across the ${warmingRanking.length} monitored cities, ${fmtSignedC(natAvg, "en")}°C on average (1991–2020 vs 1961–1990 climate normal).`,
          }
        : {
            q: "Di quanto si è scaldata l'Italia in media dal 1940?",
            a: `Sulle ${warmingRanking.length} città monitorate, in media ${fmtSignedC(natAvg, "it")}°C (normale climatica 1991–2020 vs 1961–1990).`,
          },
    );
  }
  if (rec0 && Number.isFinite(rec0.s.records?.hottest?.value)) {
    const v = rec0.s.records.hottest.value.toFixed(1).replace(".", lang === "it" ? "," : ".");
    rankFaq.push(
      lang === "en"
        ? {
            q: "What is the highest temperature ever recorded among the monitored cities?",
            a: `${v}°C in ${cityName(rec0.city, "en")}, on ${fmtDate(rec0.s.records.hottest.date, "en")}.`,
          }
        : {
            q: "Qual è la temperatura più alta mai registrata tra le città monitorate?",
            a: `${v}°C a ${cityName(rec0.city, "it")}, il ${fmtDate(rec0.s.records.hottest.date, "it")}.`,
          },
    );
  }

  // JSON-LD: BreadcrumbList (Home → Classifiche) + ItemList della classifica
  // principale (top 10 riscaldamento) — i motori di ricerca prediligono
  // ItemList per le pagine di graduatorie. Stesso pattern della pagina città.
  const base = lang === "en" ? "/en" : "";
  const pageUrl = `${SITE_URL}${base}/classifiche`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: lang === "en" ? "Rankings" : "Classifiche",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        name:
          lang === "en"
            ? "The fastest-warming Italian cities"
            : "Le città italiane che si scaldano di più",
        description:
          lang === "en"
            ? "Difference between the 1991–2020 climate normal and the 1961–1990 one: the top 10. ERA5/ECMWF data."
            : "Differenza tra la normale climatica 1991–2020 e quella 1961–1990: le prime 10. Dati ERA5/ECMWF.",
        url: pageUrl,
        inLanguage: lang === "en" ? "en-US" : "it-IT",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: topWarming.length,
        itemListElement: topWarming.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: cityName(r.city, lang),
          url: `${SITE_URL}${cityHref(r.city.slug, lang)}`,
        })),
      },
      ...(rankFaq.length ? [faqPageJsonLd(rankFaq)] : []),
    ],
  };

  const navItems = [
    ["fam-reheat", t.navReheat],
    ["fam-records", t.navRecords],
    ["fam-felt", t.navFelt],
    ["fam-winter", t.navWinter],
    ["fam-years", t.navYears],
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={t.backHref}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.backLink}
      </Link>
      <header className="rise mb-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.heading}</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {t.subtitle(stats.length)}
        </p>
      </header>

      {/* Indice a chip: salta alla famiglia. Sticky sotto l'header del sito (h-16). */}
      <nav className="sticky top-16 z-40 -mx-4 sm:-mx-6 mb-8 border-b border-[var(--outline-variant)] bg-[var(--surface)]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs font-semibold text-on-surface-variant">{t.jumpTo}</span>
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="m3-chip shrink-0 whitespace-nowrap bg-surface-container-high text-sm text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ══════════ FAMIGLIA 1 · Riscaldamento ══════════ */}
      <FamilyHeader id="fam-reheat" title={t.famReheat} sub={t.famReheatSub} first />

      <section className="mb-12">
        <SectionHeader title={t.warmingTitle} sub={t.warmingSub} />
        <ExpandableList moreLabel={t.showAll(topWarming.length)} lessLabel={t.showLess}>
          {topWarming.map((r, i) => {
            const col = anomalyColor(r.warming, 1.5);
            return (
              <RankRow
                key={r.city.slug}
                href={cityHref(r.city.slug, lang)}
                rank={i + 1}
                name={cityName(r.city, lang)}
                badge={<Temp value={r.warming} digits={1} delta showUnit={false} locale={lang} />}
                badgeBg={col}
                badgeText={readableTextOn(col)}
                sub={
                  <>
                    <Temp value={r.perDecade} digits={2} delta locale={lang} />
                    {t.perDecadeSuffix}
                  </>
                }
              />
            );
          })}
        </ExpandableList>
      </section>

      <section className="mb-12">
        <SectionHeader title={t.coolTitle} sub={t.coolSub} />
        <div className="space-y-2.5">
          {coolest.map((r, i) => {
            const col = anomalyColor(r.warming, 1.5);
            return (
              <RankRow
                key={r.city.slug}
                href={cityHref(r.city.slug, lang)}
                rank={i + 1}
                name={cityName(r.city, lang)}
                badge={<Temp value={r.warming} digits={1} delta showUnit={false} locale={lang} />}
                badgeBg={col}
                badgeText={readableTextOn(col)}
                sub={
                  <>
                    <Temp value={r.perDecade} digits={2} delta locale={lang} />
                    {t.perDecadeSuffix}
                  </>
                }
              />
            );
          })}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader title={t.paceTitle} sub={t.paceSub} />
        <ExpandableList moreLabel={t.showAll(pace.length)} lessLabel={t.showLess}>
          {pace.map((r, i) => {
            const col = anomalyColor(r.perDecade, 0.5);
            return (
              <RankRow
                key={r.city.slug}
                href={cityHref(r.city.slug, lang)}
                rank={i + 1}
                name={cityName(r.city, lang)}
                badge={<Temp value={r.perDecade} digits={2} delta showUnit={false} locale={lang} />}
                badgeBg={col}
                badgeText={readableTextOn(col)}
                sub={
                  <>
                    <Temp value={r.perDecade} digits={2} delta locale={lang} />
                    {t.perDecadeSuffix} · R² {r.r2.toFixed(2)}
                  </>
                }
              />
            );
          })}
        </ExpandableList>
      </section>

      <section className="mb-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-6 items-start">
          <div>
            <SectionHeader title={t.reliabilityTitle} sub={t.reliabilitySub} />
            <ExpandableList moreLabel={t.showAll(topReliability.length)} lessLabel={t.showLess}>
              {topReliability.map((r, i) => (
                <RankRow
                  key={r.city.slug}
                  href={cityHref(r.city.slug, lang)}
                  rank={i + 1}
                  name={cityName(r.city, lang)}
                  badge={r.r2.toFixed(2)}
                  badgeBg="var(--primary-container)"
                  badgeText="var(--on-primary-container)"
                  sub={<Temp value={r.perDecade} digits={2} delta locale={lang} />}
                />
              ))}
            </ExpandableList>
          </div>
          <div>
            <SectionHeader title={t.noisyTitle} sub={t.noisySub} />
            <div className="space-y-2.5">
              {noisiest.map((r, i) => (
                <RankRow
                  key={r.city.slug}
                  href={cityHref(r.city.slug, lang)}
                  rank={i + 1}
                  name={cityName(r.city, lang)}
                  badge={r.r2.toFixed(2)}
                  badgeBg="var(--surface-container-high)"
                  badgeText="var(--on-surface)"
                  sub={<Temp value={r.perDecade} digits={2} delta locale={lang} />}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAMIGLIA 2 · Record e durate ══════════ */}
      <FamilyHeader id="fam-records" title={t.famRecords} sub={t.famRecordsSub} />

      <section className="mb-12">
        <SectionHeader title={t.recordsTitle} sub={t.recordsSub} />
        <div className="grid gap-8 md:grid-cols-2 md:gap-6 items-start">
          <div>
            <h4 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wide mb-2.5">
              {t.recordsHot}
            </h4>
            <ExpandableList moreLabel={t.showAll(hottestRecords.length)} lessLabel={t.showLess}>
              {hottestRecords.map(({ city, s }, i) => {
                const col = tempColor(s.records.hottest.value);
                return (
                  <RankRow
                    key={city.slug}
                    href={cityHref(city.slug, lang)}
                    rank={i + 1}
                    name={cityName(city, lang)}
                    badge={<Temp value={s.records.hottest.value} digits={1} showUnit={false} />}
                    badgeBg={col}
                    badgeText={readableTextOn(col)}
                    sub={fmtDate(s.records.hottest.date, lang)}
                  />
                );
              })}
            </ExpandableList>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wide mb-2.5">
              {t.recordsCold}
            </h4>
            <div className="space-y-2.5">
              {coldestRecords.map(({ city, s }, i) => {
                const col = tempColor(s.records.coldest.value);
                return (
                  <RankRow
                    key={city.slug}
                    href={cityHref(city.slug, lang)}
                    rank={i + 1}
                    name={cityName(city, lang)}
                    badge={<Temp value={s.records.coldest.value} digits={1} showUnit={false} />}
                    badgeBg={col}
                    badgeText={readableTextOn(col)}
                    sub={fmtDate(s.records.coldest.date, lang)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {heatwaveRanking.length > 0 && (
        <section className="mb-12">
          <SectionHeader title={t.heatwaveTitle} sub={t.heatwaveSub} />
          <ExpandableList moreLabel={t.showAll(heatwaveRanking.length)} lessLabel={t.showLess}>
            {heatwaveRanking.map(({ city, s }, i) => {
              const rec = s.records.longestHeatwave!;
              return (
                <RankRow
                  key={city.slug}
                  href={cityHref(city.slug, lang)}
                  rank={i + 1}
                  name={cityName(city, lang)}
                  badge={rec.days}
                  badgeBg="#ff8a5c"
                  badgeText={readableTextOn("#ff8a5c")}
                  sub={
                    <>
                      {rec.days} {t.daysUnit} · {fmtDate(rec.start, lang)}–{fmtDate(rec.end, lang)} ·{" "}
                      <Temp value={rec.peak} digits={1} />
                    </>
                  }
                />
              );
            })}
          </ExpandableList>
        </section>
      )}

      {coldSnapRanking.length > 0 && (
        <section className="mb-12">
          <SectionHeader title={t.coldSnapTitle} sub={t.coldSnapSub} />
          <ExpandableList moreLabel={t.showAll(coldSnapRanking.length)} lessLabel={t.showLess}>
            {coldSnapRanking.map(({ city, s }, i) => {
              const rec = s.records.longestColdSnap!;
              return (
                <RankRow
                  key={city.slug}
                  href={cityHref(city.slug, lang)}
                  rank={i + 1}
                  name={cityName(city, lang)}
                  badge={rec.days}
                  badgeBg="#7fb3ff"
                  badgeText={readableTextOn("#7fb3ff")}
                  sub={
                    <>
                      {rec.days} {t.daysUnit} · {fmtDate(rec.start, lang)}–{fmtDate(rec.end, lang)} ·{" "}
                      <Temp value={rec.low} digits={1} />
                    </>
                  }
                />
              );
            })}
          </ExpandableList>
        </section>
      )}

      {/* ══════════ FAMIGLIA 3 · Il caldo che si sente ══════════ */}
      <FamilyHeader id="fam-felt" title={t.famFelt} sub={t.famFeltSub} />

      <section className="mb-12">
        <SectionHeader title={t.hdTitle} sub={t.hdSub} />
        {/* Conteggi di giorni, non temperature: nessuna conversione C/F. */}
        <ExpandableList moreLabel={t.showAll(hotDays.length)} lessLabel={t.showLess}>
          {hotDays.map((r, i) => (
            <RankRow
              key={r.city.slug}
              href={cityHref(r.city.slug, lang)}
              rank={i + 1}
              name={cityName(r.city, lang)}
              badge={Math.round(r.avg)}
              badgeBg="var(--primary-container)"
              badgeText="var(--on-primary-container)"
              sub={
                <>
                  ≈ {Math.round(r.avg)} {t.hotDaysPerYear}
                  {r.delta != null && (
                    <>
                      {" "}
                      ({r.delta >= 0 ? "+" : ""}
                      {Math.round(r.delta)} {t.vsBaseline})
                    </>
                  )}
                </>
              }
            />
          ))}
        </ExpandableList>
      </section>

      <section className="mb-12">
        <SectionHeader title={t.tnTitle} sub={t.tnSub} />
        {/* Conteggi di notti, non temperature: nessuna conversione C/F. */}
        <ExpandableList moreLabel={t.showAll(tropical.length)} lessLabel={t.showLess}>
          {tropical.map((r, i) => (
            <RankRow
              key={r.city.slug}
              href={cityHref(r.city.slug, lang)}
              rank={i + 1}
              name={cityName(r.city, lang)}
              badge={Math.round(r.avg)}
              badgeBg="var(--tertiary-container)"
              badgeText="var(--on-tertiary-container)"
              sub={
                <>
                  ≈ {Math.round(r.avg)} {t.nightsPerYear}
                  {r.delta != null && (
                    <>
                      {" "}
                      ({r.delta >= 0 ? "+" : ""}
                      {Math.round(r.delta)} {t.vsBaseline})
                    </>
                  )}
                </>
              }
            />
          ))}
        </ExpandableList>
      </section>

      {feelsCount > 0 && (
        <>
          <section className="mb-12">
            <SectionHeader title={t.feelsTitle} sub={t.feelsSub(feelsCount)} />
            <div className="space-y-2.5">
              {feelsTop.map((r, i) => {
                const bg = tempColor(r.feelsRecent);
                return (
                  <RankRow
                    key={r.slug}
                    href={cityHref(r.slug, lang)}
                    rank={i + 1}
                    name={cityDisplayName(r.slug, r.name, lang)}
                    badge={<Temp value={r.feelsRecent} digits={0} locale={lang} />}
                    badgeBg={bg}
                    badgeText={readableTextOn(bg)}
                    sub={
                      <>
                        {lang === "en" ? "actual" : "reale"} <Temp value={r.dryRecent} digits={1} locale={lang} /> ·{" "}
                        {lang === "en" ? "mugginess" : "afa"} <Temp value={r.gapRecent} digits={1} delta locale={lang} />
                      </>
                    }
                  />
                );
              })}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeader title={t.gapTitle} sub={t.gapSub} />
            <div className="space-y-2.5">
              {gapTop.map((r, i) => (
                <RankRow
                  key={r.slug}
                  href={cityHref(r.slug, lang)}
                  rank={i + 1}
                  name={cityDisplayName(r.slug, r.name, lang)}
                  badge={<Temp value={r.gapRecent} digits={1} delta showUnit={false} locale={lang} />}
                  badgeBg="#0891b2"
                  badgeText={readableTextOn("#0891b2")}
                  sub={
                    <>
                      {lang === "en" ? "felt" : "percepita"} <Temp value={r.feelsRecent} digits={1} locale={lang} /> ·{" "}
                      {lang === "en" ? "actual" : "reale"} <Temp value={r.dryRecent} digits={1} locale={lang} />
                    </>
                  }
                />
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeader title={t.feelsDeltaTitle} sub={t.feelsDeltaSub} />
            <div className="space-y-2.5">
              {feelsDeltaTop.map((r, i) => {
                const bg = anomalyColor(r.feelsDelta, 2);
                return (
                  <RankRow
                    key={r.slug}
                    href={cityHref(r.slug, lang)}
                    rank={i + 1}
                    name={cityDisplayName(r.slug, r.name, lang)}
                    badge={<Temp value={r.feelsDelta} digits={1} delta showUnit={false} locale={lang} />}
                    badgeBg={bg}
                    badgeText={readableTextOn(bg)}
                    sub={
                      <>
                        {lang === "en" ? "summer felt temp today" : "percepita estiva oggi"}{" "}
                        <Temp value={r.feelsRecent} digits={1} locale={lang} />
                      </>
                    }
                  />
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ══════════ FAMIGLIA 4 · Inverno ed escursione ══════════ */}
      <FamilyHeader id="fam-winter" title={t.famWinter} sub={t.famWinterSub} />

      <section className="mb-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-6 items-start">
          <div>
            <SectionHeader title={t.ggTitle} sub={t.ggSub} />
            <ExpandableList moreLabel={t.showAll(topDegreeDays.length)} lessLabel={t.showLess}>
              {topDegreeDays.map((r, i) => (
                <RankRow
                  key={r.city.slug}
                  href={cityHref(r.city.slug, lang)}
                  rank={i + 1}
                  name={cityName(r.city, lang)}
                  badge={r.gg}
                  badgeBg="var(--tertiary-container)"
                  badgeText="var(--on-tertiary-container)"
                  sub={ggZone(r.gg)}
                />
              ))}
            </ExpandableList>
          </div>
          <div>
            <SectionHeader title={t.ggLowTitle} sub={t.ggLowSub} />
            <div className="space-y-2.5">
              {lowDegreeDays.map((r, i) => (
                <RankRow
                  key={r.city.slug}
                  href={cityHref(r.city.slug, lang)}
                  rank={i + 1}
                  name={cityName(r.city, lang)}
                  badge={r.gg}
                  badgeBg="var(--tertiary-container)"
                  badgeText="var(--on-tertiary-container)"
                  sub={ggZone(r.gg)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader title={t.swingTitle} sub={t.swingSub} />
        <div className="mb-8">
          <ExpandableList moreLabel={t.showAll(topSwing.length)} lessLabel={t.showLess}>
            {topSwing.map((r, i) => (
              <RankRow
                key={r.city.slug}
                href={cityHref(r.city.slug, lang)}
                rank={i + 1}
                name={cityName(r.city, lang)}
                badge={<Temp value={r.avg} digits={1} delta showUnit={false} locale={lang} />}
                badgeBg="var(--secondary-container)"
                badgeText="var(--on-secondary-container)"
                sub={<Temp value={r.avg} digits={1} delta locale={lang} />}
              />
            ))}
          </ExpandableList>
        </div>
        <SectionHeader title={t.swingLowTitle} sub={t.swingLowSub} />
        <div className="space-y-2.5">
          {lowSwing.map((r, i) => (
            <RankRow
              key={r.city.slug}
              href={cityHref(r.city.slug, lang)}
              rank={i + 1}
              name={cityName(r.city, lang)}
              badge={<Temp value={r.avg} digits={1} delta showUnit={false} locale={lang} />}
              badgeBg="var(--secondary-container)"
              badgeText="var(--on-secondary-container)"
              sub={<Temp value={r.avg} digits={1} delta locale={lang} />}
            />
          ))}
        </div>
      </section>

      {/* ══════════ FAMIGLIA 5 · Gli anni più estremi ══════════ */}
      <div id="fam-years" className="scroll-mt-32 border-t border-[var(--outline-variant)] pt-8">
        <YearExtremes years={lifetimeData.cities[0].years} baseline={lifetimeData.cities[0].baseline} lang={lang} count={10} />
      </div>

      <FaqBlock
        faq={rankFaq}
        title={lang === "en" ? "Frequently asked about the rankings" : "Domande frequenti sulle classifiche"}
      />
    </div>
  );
}

export default function ClassifichePage() {
  return <ClassifichePageContent lang="it" />;
}
