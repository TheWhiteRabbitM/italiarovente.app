import { Suspense } from "react";
import { CITIES, MAIN_CITIES, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { AnomalyCompareChart, PALETTE } from "@/components/charts";
import { WarmingStripes } from "@/components/WarmingStripes";
import { CityVersus } from "@/components/CityVersus";
import { getLifetimeData } from "@/lib/lifetime";
import { anomalyColor } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { Temp } from "@/components/Temp";
import Link from "next/link";

const STR = {
  it: {
    title: "Confronto città",
    intro:
      "Come è cambiata la temperatura delle città italiane dal 1940. Le anomalie (scarto dalla normale 1961–1990) permettono di paragonare città con climi diversi sulla stessa scala.",
    dataUnavailableTitle: "Dati non disponibili",
    dataUnavailableBody: "Riprova tra poco.",
    home: "← Home",
    headToHeadFallback: "Testa a testa ⚔️",
    anomalyCompareTitle: "Anomalie a confronto · città principali",
    anomalyCompareBody: (lastYear: number) => (
      <>
        Anomalia della media annua rispetto alla normale 1961–1990, fino al{" "}
        {lastYear}. Stessa scala per tutte le città.
      </>
    ),
    stripesTitle: "Warming stripes · città principali",
    stripesBody: (
      <>
        Una striscia per anno:{" "}
        <span className="text-[#2166ac] font-semibold">blu</span> sotto la
        normale 1961–1990, <span className="text-[#b2182b] font-semibold">rosso</span> sopra.
      </>
    ),
    rankingTitle: (n: number) => `Classifica del cambiamento · ${n} città`,
    rankingBody:
      "Differenza tra la normale 1991–2020 e la 1961–1990 (confronto tra due trentenni, il metodo più robusto). In rosso chi si è scaldata, in blu un eventuale raffreddamento.",
    perDecade: "/decennio",
    europeLink: "E rispetto all'Europa? →",
    locale: "it" as const,
  },
  en: {
    title: "City comparison",
    intro:
      "How the temperature of Italian cities has changed since 1940. Anomalies (deviation from the 1961–1990 normal) let you compare cities with different climates on the same scale.",
    dataUnavailableTitle: "Data unavailable",
    dataUnavailableBody: "Try again shortly.",
    home: "← Home",
    headToHeadFallback: "Head to head ⚔️",
    anomalyCompareTitle: "Anomalies compared · main cities",
    anomalyCompareBody: (lastYear: number) => (
      <>
        Anomaly of the annual mean vs the 1961–1990 normal, up to {lastYear}.
        Same scale for every city.
      </>
    ),
    stripesTitle: "Warming stripes · main cities",
    stripesBody: (
      <>
        One stripe per year:{" "}
        <span className="text-[#2166ac] font-semibold">blue</span> below the
        1961–1990 normal, <span className="text-[#b2182b] font-semibold">red</span> above.
      </>
    ),
    rankingTitle: (n: number) => `Change ranking · ${n} cities`,
    rankingBody:
      "Difference between the 1991–2020 normal and the 1961–1990 normal (comparison between two thirty-year periods, the most robust method). Red for cities that warmed, blue for any cooling.",
    perDecade: "/decade",
    europeLink: "And compared to Europe? →",
    locale: "en" as const,
  },
} as const;

export const metadata = {
  title: "Confronto temperature · Città italiane (1940–oggi)",
  description:
    "Confronto del clima tra le città italiane dal 1940: anomalie a confronto, warming stripes e classifica completa del cambiamento. Dati ERA5/ECMWF.",
  keywords: [
    "confronto temperature città italiane",
    "anomalie",
    "warming stripes",
    "classifica cambiamento clima città",
  ],
  alternates: { canonical: "/confronto", languages: { en: "/en/confronto" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/confronto`,
    title: "Confronto temperature · Città italiane (1940–oggi)",
    description:
      "Anomalie e classifica del cambiamento climatico tra le città italiane, dal 1940. Dati ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Confronto temperature · Città italiane (1940–oggi)",
    description: "Le città italiane a confronto sul cambiamento climatico, dal 1940.",
  },
};

type Stat = NonNullable<ReturnType<typeof getArchiveStats>>;

export default function ConfrontoPage({
  lang = "it",
}: {
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const withStats = (list: typeof CITIES) =>
    list
      .map((city) => ({ city, archive: getArchiveStats(city) }))
      .filter((x): x is { city: (typeof CITIES)[number]; archive: Stat } => x.archive !== null);

  const mainItems = withStats(MAIN_CITIES);
  const allItems = withStats(CITIES);

  if (allItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-3xl font-extrabold mb-2">{t.dataUnavailableTitle}</h1>
        <p className="text-on-surface-variant">{t.dataUnavailableBody}</p>
        <Link
          href={lang === "en" ? "/en" : "/"}
          className="m3-chip bg-primary text-on-primary px-6 py-3 mt-6 inline-flex"
        >
          {t.home}
        </Link>
      </div>
    );
  }

  const fullYears = (a: Stat) => a.yearly.filter((y) => y.count >= 360);
  const cityAnoms = (a: Stat) =>
    fullYears(a).map((y) => ({ year: y.year, anomaly: y.mean - a.trend.baselineMean }));
  const warmOf = (a: Stat) => a.trend.recentNormal - a.trend.baselineMean;

  const anomalySeries = mainItems.map(({ city, archive }) => ({
    name: city.name,
    data: cityAnoms(archive),
  }));

  const lastYear = Math.max(
    ...mainItems.map((x) => x.archive.trend.lastYear ?? 1940),
  );

  const ranking = allItems
    .map(({ city, archive }) => ({
      city,
      warming: warmOf(archive),
      perDecade: archive.trend.perDecade,
    }))
    .sort((a, b) => b.warming - a.warming);
  // Scala delle barre sul valore assoluto massimo, non sul primo: se una
  // città si fosse raffreddata più di quanto le altre si sono scaldate, la
  // barra deve comunque riflettere la sua reale intensità (in negativo).
  const maxAbsW = Math.max(1, ...ranking.map((r) => Math.abs(r.warming)));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          {t.title}
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {t.intro}
        </p>
      </header>

      {/* TESTA A TESTA (interattivo, tutte le città) */}
      <div className="mb-8">
        <Suspense
          fallback={
            <section className="m3-card rise p-5 sm:p-6 min-h-[220px] flex items-center justify-center">
              <h2 className="text-xl font-extrabold tracking-tight text-on-surface-variant">
                {t.headToHeadFallback}
              </h2>
            </section>
          }
        >
          <CityVersus data={getLifetimeData()} lang={lang} />
        </Suspense>
      </div>

      {/* ANOMALIE A CONFRONTO — solo principali, per leggibilità */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">
          {t.anomalyCompareTitle}
        </h2>
        <p className="text-sm text-on-surface-variant mb-3">
          {t.anomalyCompareBody(lastYear)}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {mainItems.map(({ city }, i) => (
            <span
              key={city.slug}
              className="m3-chip bg-surface-container-high text-on-surface text-xs"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              {cityName(city, lang)}
            </span>
          ))}
        </div>
        <AnomalyCompareChart series={anomalySeries} lang={lang} />
      </section>

      {/* WARMING STRIPES — principali */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">
          {t.stripesTitle}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4">
          {t.stripesBody}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {mainItems.map(({ city, archive }) => (
            <Link key={city.slug} href={`${lang === "en" ? "/en" : ""}/citta/${city.slug}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold group-hover:text-primary transition-colors">
                  {cityName(city, lang)}
                </span>
                <span className="text-xs text-on-surface-variant">
                  <Temp value={warmOf(archive)} digits={1} delta locale={t.locale} />
                </span>
              </div>
              <WarmingStripes data={cityAnoms(archive)} height={44} showAxis={false} lang={lang} />
            </Link>
          ))}
        </div>
      </section>

      {/* CLASSIFICA — tutte le città */}
      <section className="m3-card rise p-5 sm:p-6">
        <h2 className="text-xl font-extrabold mb-1">
          {t.rankingTitle(ranking.length)}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4">
          {t.rankingBody}
        </p>
        <div className="space-y-1.5">
          {ranking.map((r, i) => {
            const pct = Math.max(5, (Math.abs(r.warming) / maxAbsW) * 100);
            return (
              <Link
                key={r.city.slug}
                href={`${lang === "en" ? "/en" : ""}/citta/${r.city.slug}`}
                className="flex items-center gap-2.5 group"
              >
                <span className="w-6 text-xs font-bold text-on-surface-variant text-right">
                  {i + 1}
                </span>
                <span className="w-24 sm:w-28 font-semibold text-sm shrink-0 truncate group-hover:text-primary transition-colors">
                  {cityName(r.city, lang)}
                </span>
                <div className="flex-1 h-6 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end px-2.5 text-xs font-extrabold text-white"
                    style={{ width: `${pct}%`, minWidth: "4.5rem", background: anomalyColor(r.warming, 1.5) }}
                  >
                    <Temp value={r.warming} digits={1} delta locale={t.locale} />
                  </div>
                </div>
                <span className="w-24 text-right text-xs text-on-surface-variant shrink-0 hidden sm:block">
                  <Temp value={r.perDecade} digits={2} delta locale={t.locale} showUnit={false} />
                  {t.perDecade}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CROSS-LINK verso il confronto Italia vs Europa */}
      <div className="mt-6 text-center">
        <Link
          href={`${lang === "en" ? "/en" : ""}/europa`}
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors inline-flex"
        >
          🌍 {t.europeLink}
        </Link>
      </div>
    </div>
  );
}
