import Link from "next/link";
import { CITIES, cityName, type City } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { anomalyColor, readableTextOn, tempColor, fmtDate } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { SITE_URL } from "@/lib/site";

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

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
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
    ],
  };

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
      <header className="rise mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.heading}</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {t.subtitle(stats.length)}
        </p>
      </header>

      {/* 🔥 Riscaldamento maggiore */}
      <section className="mb-12">
        <SectionHeader title={t.warmingTitle} sub={t.warmingSub} />
        <div className="space-y-2.5">
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
        </div>
      </section>

      {/* 🧊 Le più contenute */}
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

      {/* ⏱️ Ritmo per decennio */}
      <section className="mb-12">
        <SectionHeader title={t.paceTitle} sub={t.paceSub} />
        <div className="space-y-2.5">
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
        </div>
      </section>

      {/* 🌡️ Record assoluti */}
      <section className="mb-12">
        <SectionHeader title={t.recordsTitle} sub={t.recordsSub} />
        <div className="grid gap-8 md:grid-cols-2 md:gap-6 items-start">
          <div>
            <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wide mb-2.5">
              {t.recordsHot}
            </h3>
            <div className="space-y-2.5">
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
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wide mb-2.5">
              {t.recordsCold}
            </h3>
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

      {/* 🥵 Giorni roventi (caldo africano) */}
      <section className="mb-12">
        <SectionHeader title={t.hdTitle} sub={t.hdSub} />
        <div className="space-y-2.5">
          {/* Conteggi di giorni, non temperature: nessuna conversione C/F. */}
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
        </div>
      </section>

      {/* 🌙 Notti tropicali */}
      <section className="mb-12">
        <SectionHeader title={t.tnTitle} sub={t.tnSub} />
        <div className="space-y-2.5">
          {/* Conteggi di notti, non temperature: nessuna conversione C/F. */}
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
        </div>
      </section>

      {/* ↕️ Escursione termica */}
      <section className="mb-4">
        <SectionHeader title={t.swingTitle} sub={t.swingSub} />
        <div className="space-y-2.5 mb-8">
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
    </div>
  );
}

export default function ClassifichePage() {
  return <ClassifichePageContent lang="it" />;
}
