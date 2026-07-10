import Link from "next/link";
import { getMonthlyBulletin, hotRank, publishedAnomaly, ordinalIt, ordinalEn } from "@/lib/monthlyCompare";
import { WarmingStripes } from "@/components/WarmingStripes";
import { AnomalyBarChart } from "@/components/charts";
import { Temp } from "@/components/Temp";
import { anomalyColor, readableTextOn } from "@/lib/format";
import { CITIES, cityDisplayName } from "@/lib/cities";
import { getHistoryMeta } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Bollettino mensile · Il mese appena concluso in Italia",
  description:
    "Quanto è stato caldo il mese appena concluso in Italia, e a che posto si piazza dal 1940. Anomalia rispetto alla normale 1961–1990, classifica storica e scomposizione città per città. Dati ERA5/ECMWF.",
  keywords: [
    "mese più caldo italia",
    "bollettino mensile clima italia",
    "anomalia mensile temperatura",
    "record mensile caldo italia",
    "copernicus italia mese",
  ],
  alternates: { canonical: "/mese", languages: { en: "/en/mese" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/mese`,
    title: "Bollettino mensile · Italia Rovente",
    description:
      "Il mese appena concluso in Italia: anomalia, classifica storica dal 1940 e dettaglio città per città.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bollettino mensile · Italia Rovente",
    description: "Quanto è stato caldo il mese appena concluso in Italia, e a che posto si piazza dal 1940.",
  },
};

const FULL_MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const FULL_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STR = {
  it: {
    backLink: "← Home",
    eyebrow: "📅 Bollettino mensile",
    unavailableTitle: "Bollettino non ancora disponibile",
    unavailableBody:
      "Lo snapshot storico non copre ancora abbastanza città per calcolare una media nazionale mensile affidabile. Torna tra poco: si completa automaticamente.",
    heading: (mese: string, year: number) => `${mese[0].toUpperCase()}${mese.slice(1)} ${year} in Italia`,
    intro: (mese: string, rank: string, kind: string, since: number, total: number) =>
      `È stato il ${rank} ${mese} ${kind} dal ${since}: ${total} anni di dati, un solo metodo, nessuna opinione. Ecco come si colloca nella storia climatica italiana.`,
    statAnomaly: "Anomalia",
    statAnomalySub: "rispetto alla normale 1961–1990",
    statMean: "Media del mese",
    statMeanSub: "media nazionale delle città monitorate",
    statNormal: "Normale 1961–1990",
    statNormalSub: "riferimento dello stesso mese",
    stripesTitle: (mese: string) => `Ogni ${mese} dal 1940`,
    stripesBody: (mese: string) => (
      <>
        Una striscia per ogni {mese} della serie:{" "}
        <span className="text-[#2166ac] font-semibold">blu</span> = più freddo della normale
        1961–1990, <span className="text-[#b2182b] font-semibold">rosso</span> = più caldo. Nessun
        altro mese è mescolato: si confrontano solo {mese} con {mese}.
      </>
    ),
    chartTitle: (mese: string) => `Anomalia di ogni ${mese}`,
    chartBody: "La linea tratteggiata è la tendenza di fondo su questo singolo mese.",
    rankingTitle: (mese: string) => `I ${mese} più caldi di sempre`,
    rankingBody: "Primi dieci, dal più caldo. In grassetto il mese appena concluso.",
    rankingTies:
      "I valori sono pubblicati a due decimali, e la classifica è calcolata su quelli: due mesi che mostrano la stessa anomalia condividono il posto. Separarli con decimali più fini sarebbe una differenza inventata dall'arrotondamento dei dati di partenza.",
    colYear: "Anno",
    colAnomaly: "Anomalia",
    colMean: "Media del mese",
    colCity: "Città",
    colPlace: "Posto",
    citiesTitle: (mese: string, year: number) => `${mese[0].toUpperCase()}${mese.slice(1)} ${year}, città per città`,
    citiesBody:
      "Ogni città confrontata con la propria normale 1961–1990 dello stesso mese, e il suo posto nella propria classifica storica. Ordinate dall'anomalia più alta.",
    cityRankLabel: (rank: number, total: number) => `${rank}° su ${total}`,
    methodTitle: "Nota di metodo",
    methodBody: (contributors: number, monitored: number) => (
      <>
        Fonte: rianalisi <strong>ERA5 (ECMWF/Copernicus C3S)</strong> via Open-Meteo, dal 1940.
        Per ogni città calcoliamo la media giornaliera del mese, poi la confrontiamo con la
        normale 1961–1990 di quello stesso mese di calendario. Il dato nazionale qui sopra è la
        media di <strong>{contributors}</strong> città (delle {monitored} monitorate dal sito: lo
        storico mensile si popola progressivamente, quindi il numero cresce nel tempo). Un mese
        entra nel confronto solo con almeno 24 giorni validi: mai un mese a metà spacciato per
        concluso.
      </>
    ),
    copernicusTitle: "Perché i nostri numeri non coincidono con quelli di Copernicus",
    copernicusBody: (
      <>
        Copernicus pubblica ogni mese un bollettino globale ed europeo. Questa pagina{" "}
        <strong>non lo replica e non lo verifica</strong>: usa la stessa fonte primaria (ERA5) ma
        un dominio diverso — solo le città italiane monitorate qui, non un&apos;area geografica
        completa — e una baseline diversa (Copernicus usa spesso il 1991–2020 o l&apos;era
        preindustriale). Numeri diversi non significano che uno dei due sbagli: misurano cose
        diverse. Il ranking di questa pagina vale per l&apos;Italia delle nostre città, e per
        nient&apos;altro.
      </>
    ),
    provenance: (generatedAt: string) => `Snapshot dei dati generato il ${generatedAt}.`,
    breadcrumb: "Bollettino mensile",
    seeCity: "Vedi la città →",
    hot: "più caldo",
    cold: "più freddo",
  },
  en: {
    backLink: "← Home",
    eyebrow: "📅 Monthly bulletin",
    unavailableTitle: "Bulletin not available yet",
    unavailableBody:
      "The historical snapshot doesn't yet cover enough cities to compute a reliable national monthly average. Check back shortly: it completes automatically.",
    heading: (mese: string, year: number) => `${mese} ${year} in Italy`,
    intro: (mese: string, rank: string, kind: string, since: number, total: number) =>
      `It was the ${rank} ${kind} ${mese} since ${since}: ${total} years of data, one method, no opinions. Here is where it sits in Italy's climate record.`,
    statAnomaly: "Anomaly",
    statAnomalySub: "vs the 1961–1990 normal",
    statMean: "Month's average",
    statMeanSub: "national mean of the monitored cities",
    statNormal: "1961–1990 normal",
    statNormalSub: "reference for the same month",
    stripesTitle: (mese: string) => `Every ${mese} since 1940`,
    stripesBody: (mese: string) => (
      <>
        One stripe per {mese} in the series:{" "}
        <span className="text-[#2166ac] font-semibold">blue</span> = colder than the 1961–1990
        normal, <span className="text-[#b2182b] font-semibold">red</span> = warmer. No other month
        is mixed in: only {mese} is compared with {mese}.
      </>
    ),
    chartTitle: (mese: string) => `Anomaly of every ${mese}`,
    chartBody: "The dashed line is the underlying trend for this single month.",
    rankingTitle: (mese: string) => `The hottest ${mese}s on record`,
    rankingBody: "Top ten, hottest first. The month just ended is in bold.",
    rankingTies:
      "Values are published to two decimals, and the ranking is computed on those: two months showing the same anomaly share a place. Separating them with finer decimals would be a difference invented by the rounding of the source data.",
    colYear: "Year",
    colAnomaly: "Anomaly",
    colMean: "Month's average",
    colCity: "City",
    colPlace: "Rank",
    citiesTitle: (mese: string, year: number) => `${mese} ${year}, city by city`,
    citiesBody:
      "Each city compared with its own 1961–1990 normal for the same month, and its place in its own historical ranking. Sorted by the highest anomaly.",
    cityRankLabel: (rank: number, total: number) => `${ordinalEn(rank)} of ${total}`,
    methodTitle: "Method note",
    methodBody: (contributors: number, monitored: number) => (
      <>
        Source: <strong>ERA5 reanalysis (ECMWF/Copernicus C3S)</strong> via Open-Meteo, since 1940.
        For each city we compute the month&apos;s daily mean, then compare it with the 1961–1990
        normal of that same calendar month. The national figure above is the average of{" "}
        <strong>{contributors}</strong> cities (out of the {monitored} the site monitors: the
        monthly history fills in progressively, so this number grows over time). A month enters
        the comparison only with at least 24 valid days: never a half month passed off as
        complete.
      </>
    ),
    copernicusTitle: "Why our numbers don't match Copernicus'",
    copernicusBody: (
      <>
        Copernicus publishes a global and European bulletin every month. This page{" "}
        <strong>does not replicate it and does not verify it</strong>: it uses the same primary
        source (ERA5) but a different domain — only the Italian cities monitored here, not a
        complete geographic area — and a different baseline (Copernicus often uses 1991–2020 or
        the pre-industrial era). Different numbers don&apos;t mean one of the two is wrong: they
        measure different things. This page&apos;s ranking holds for the Italy of our cities, and
        for nothing else.
      </>
    ),
    provenance: (generatedAt: string) => `Data snapshot generated on ${generatedAt}.`,
    breadcrumb: "Monthly bulletin",
    seeCity: "See the city →",
    hot: "hottest",
    cold: "coldest",
  },
} as const;

function Stat({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="m3-card p-4">
      <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-extrabold tabular-nums mt-1">{children}</div>
      <div className="text-xs text-on-surface-variant mt-1">{sub}</div>
    </div>
  );
}

export function MesePageContent({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  const bulletin = getMonthlyBulletin();
  const meta = getHistoryMeta();

  const pageUrl = `${SITE_URL}${base}/mese`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
      { "@type": "ListItem", position: 2, name: t.breadcrumb, item: pageUrl },
    ],
  };

  if (!bulletin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h1 className="text-3xl font-extrabold mb-2">{t.unavailableTitle}</h1>
        <p className="text-on-surface-variant">{t.unavailableBody}</p>
        <Link
          href={base || "/"}
          className="m3-chip bg-primary text-on-primary px-6 py-3 mt-6 inline-flex"
        >
          {t.backLink}
        </Link>
      </div>
    );
  }

  const { national, series, cities } = bulletin;
  const mese = (lang === "en" ? FULL_MONTHS_EN : FULL_MONTHS_IT)[national.month - 1];
  const rankStr = lang === "en" ? ordinalEn(national.rank) : ordinalIt(national.rank);
  const kind = national.direction === "hot" ? t.hot : t.cold;

  // Ordina sull'anomalia pubblicata (2 decimali), non sul float grezzo, così la
  // sequenza a schermo combacia con i numeri a schermo; i pari merito restano in
  // ordine cronologico invece che in un ordine deciso da decimali invisibili.
  const allAnomalies = series.map((s) => s.anomaly);
  const hottest = [...series]
    .sort((a, b) => publishedAnomaly(b.anomaly) - publishedAnomaly(a.anomaly) || a.year - b.year)
    .slice(0, 10);
  const heroColor = anomalyColor(national.anomaly, 2);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href={base || "/"}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.backLink}
      </Link>

      <header className="rise mb-8">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mb-5">{t.eyebrow}</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          {t.heading(mese, national.year)}
        </h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl text-lg leading-relaxed">
          {t.intro(mese, rankStr, kind, national.sinceYear, national.total)}
        </p>
      </header>

      {/* I TRE NUMERI */}
      <section className="grid gap-3 sm:grid-cols-3 mb-10">
        <Stat label={t.statAnomaly} sub={t.statAnomalySub}>
          <span style={{ color: heroColor }}>
            <Temp value={national.anomaly} digits={2} delta locale={lang} />
          </span>
        </Stat>
        <Stat label={t.statMean} sub={t.statMeanSub}>
          <Temp value={national.value} digits={2} locale={lang} />
        </Stat>
        <Stat label={t.statNormal} sub={t.statNormalSub}>
          <Temp value={national.normal} digits={2} locale={lang} />
        </Stat>
      </section>

      {/* STRISCE DI QUESTO MESE */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.stripesTitle(mese)}</h2>
        <p className="text-sm text-on-surface-variant mb-4">{t.stripesBody(mese)}</p>
        <WarmingStripes
          data={series.map((s) => ({ year: s.year, anomaly: s.anomaly }))}
          lang={lang}
        />
      </section>

      {/* ANOMALIA ANNO PER ANNO */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.chartTitle(mese)}</h2>
        <p className="text-sm text-on-surface-variant mb-3">{t.chartBody}</p>
        <AnomalyBarChart
          data={series.map((s) => ({ year: s.year, anomaly: s.anomaly }))}
          lang={lang}
        />
      </section>

      {/* CLASSIFICA STORICA DI QUESTO MESE */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.rankingTitle(mese)}</h2>
        <p className="text-sm text-on-surface-variant mb-1">{t.rankingBody}</p>
        <p className="text-xs text-on-surface-variant mb-4">{t.rankingTies}</p>
        <div className="flex items-center gap-3 px-2 pb-1.5 mb-1 border-b border-[var(--outline-variant)] text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          <span className="w-6 shrink-0" />
          <span className="w-16">{t.colYear}</span>
          <span className="shrink-0">{t.colAnomaly}</span>
          <span className="ml-auto">{t.colMean}</span>
        </div>
        <div className="space-y-1.5">
          {hottest.map((y) => {
            const col = anomalyColor(y.anomaly, 2);
            const isCurrent = y.year === national.year;
            return (
              <div
                key={y.year}
                className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
                  isCurrent ? "bg-surface-container-high" : ""
                }`}
              >
                <span className="w-6 text-right text-xs font-extrabold text-on-surface-variant tabular-nums shrink-0">
                  {hotRank(allAnomalies, y.anomaly)}
                </span>
                <span
                  className={`w-16 tabular-nums ${isCurrent ? "font-extrabold" : "font-semibold"}`}
                >
                  {y.year}
                </span>
                <div
                  className="rounded-lg px-2.5 py-1 text-xs font-extrabold tabular-nums shrink-0"
                  style={{ background: col, color: readableTextOn(col) }}
                >
                  <Temp value={y.anomaly} digits={2} delta locale={lang} />
                </div>
                <span className="text-xs text-on-surface-variant tabular-nums ml-auto">
                  <Temp value={y.mean} digits={2} locale={lang} />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CITTÀ PER CITTÀ */}
      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-xl font-extrabold tracking-tight mb-1">
          {t.citiesTitle(mese, national.year)}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4">{t.citiesBody}</p>
        <div className="flex items-center gap-3 px-2 pb-1.5 mb-1 border-b border-[var(--outline-variant)] text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          <span className="w-14 text-center shrink-0">{t.colAnomaly}</span>
          <span className="flex-1">{t.colCity}</span>
          <span className="shrink-0">{t.colPlace}</span>
        </div>
        <div className="space-y-1.5">
          {cities.map((c) => {
            const col = anomalyColor(c.anomaly, 2);
            return (
              <Link
                key={c.slug}
                href={`${base}/citta/${c.slug}`}
                className="flex items-center gap-3 group rounded-xl px-2 py-1.5 hover:bg-surface-container-high transition-colors"
              >
                <div
                  className="w-14 rounded-lg px-2 py-1 text-xs font-extrabold tabular-nums shrink-0 text-center"
                  style={{ background: col, color: readableTextOn(col) }}
                >
                  <Temp value={c.anomaly} digits={2} delta showUnit={false} locale={lang} />
                </div>
                <span className="font-semibold text-sm flex-1 min-w-0 truncate group-hover:text-primary transition-colors">
                  {cityDisplayName(c.slug, c.name, lang)}
                </span>
                <span className="text-xs text-on-surface-variant tabular-nums shrink-0">
                  {t.cityRankLabel(c.rank, c.total)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* NOTA SU COPERNICUS — perché i numeri possono non coincidere */}
      <section className="m3-card p-5 sm:p-6 mb-5">
        <h2 className="text-lg font-extrabold tracking-tight mb-2">{t.copernicusTitle}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">{t.copernicusBody}</p>
      </section>

      {/* NOTA DI METODO */}
      <section className="m3-card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight mb-2">{t.methodTitle}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t.methodBody(national.contributors, CITIES.length)}
        </p>
        {meta?.generatedAt ? (
          <p className="text-xs text-on-surface-variant mt-3">{t.provenance(meta.generatedAt)}</p>
        ) : null}
      </section>
    </div>
  );
}

export default function MesePage() {
  return <MesePageContent lang="it" />;
}
