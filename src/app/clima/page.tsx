import { CITIES } from "@/lib/cities";
import { getArchiveStats, linreg } from "@/lib/weather";
import { AnomalyBarChart, DecadeBars } from "@/components/charts";
import { WarmingStripes } from "@/components/WarmingStripes";
import { Verdict } from "@/components/Verdict";
import { Methodology } from "@/components/Methodology";
import type { AnomalyPoint, DecadePoint, YearlyPoint } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";

const STR = {
  it: {
    chip: "🌍 Le prove, dai dati",
    title: "C'è davvero il riscaldamento?",
    intro: (n: number) => (
      <>
        Mettiamo alla prova la domanda con i dati misurati dal 1940 in{" "}
        {n} città italiane. Niente opinioni: solo temperature,
        anomalie e tendenze.
      </>
    ),
    dataUnavailableTitle: "Dati storici non disponibili",
    dataUnavailableBody:
      "La fonte (Open-Meteo / ERA5) è temporaneamente irraggiungibile. I dati tornano disponibili automaticamente a breve.",
    scope: "Italia (media città)",
    stripesTitle: (from: number, to: number) =>
      `Le "strisce del riscaldamento", ${from}–${to}`,
    stripesBody: (
      <>
        Ogni striscia è un anno: <span className="text-[#2166ac] font-semibold">blu</span> = più
        freddo della normale 1961–1990,{" "}
        <span className="text-[#b2182b] font-semibold">rosso</span> = più caldo.
        Il colore dominante, a colpo d&apos;occhio, racconta come è cambiata la
        temperatura nel tempo.
      </>
    ),
    anomalyTitle: "Anomalia annua rispetto al 1961–1990",
    anomalyBody: (warmestYear: number) => (
      <>
        Quanto ogni anno è stato più caldo (rosso) o più freddo (blu) della
        normale. La linea tratteggiata è la tendenza di fondo. L&apos;anno più
        caldo è stato il <strong>{warmestYear}</strong>.
      </>
    ),
    decadeTitle: "Media per decennio",
    decadeBody:
      "Aggregando per decennio il rumore annuale sparisce: la scala sale in modo netto e progressivo.",
  },
  en: {
    chip: "🌍 The evidence, from the data",
    title: "Is warming really happening?",
    intro: (n: number) => (
      <>
        We put the question to the test with data measured since 1940 in{" "}
        {n} Italian cities. No opinions: just temperatures, anomalies
        and trends.
      </>
    ),
    dataUnavailableTitle: "Historical data unavailable",
    dataUnavailableBody:
      "The source (Open-Meteo / ERA5) is temporarily unreachable. Data will be available again automatically shortly.",
    scope: "Italy (city average)",
    stripesTitle: (from: number, to: number) =>
      `The "warming stripes", ${from}–${to}`,
    stripesBody: (
      <>
        Each stripe is a year: <span className="text-[#2166ac] font-semibold">blue</span> = colder
        than the 1961–1990 normal,{" "}
        <span className="text-[#b2182b] font-semibold">red</span> = warmer.
        The dominant color, at a glance, tells how the temperature has
        changed over time.
      </>
    ),
    anomalyTitle: "Annual anomaly vs 1961–1990",
    anomalyBody: (warmestYear: number) => (
      <>
        How much each year was warmer (red) or colder (blue) than normal. The
        dashed line is the underlying trend. The warmest year was{" "}
        <strong>{warmestYear}</strong>.
      </>
    ),
    decadeTitle: "Average by decade",
    decadeBody:
      "Aggregating by decade, the yearly noise disappears: the trend rises clearly and progressively.",
  },
} as const;

// Usa solo lo snapshot storico (build): pagina statica, istantanea.
export const metadata = {
  title: "Il clima in Italia · I dati dal 1940",
  description:
    "Come è cambiato il clima nelle principali città italiane: anomalie di temperatura, warming stripes e tendenze dal 1940 a oggi. Dati ERA5/ECMWF.",
  keywords: [
    "riscaldamento globale italia",
    "anomalie temperatura",
    "warming stripes",
    "cambiamento climatico italia",
    "tendenza temperatura",
  ],
  alternates: { canonical: "/clima", languages: { en: "/en/clima" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/clima`,
    title: "Il clima in Italia · I dati dal 1940",
    description:
      "Anomalie, warming stripes e tendenze della temperatura nazionale dal 1940. Dati ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Il clima in Italia · I dati dal 1940",
    description: "Anomalie e warming stripes della temperatura italiana dal 1940.",
  },
};

export default async function ClimaPage({
  lang = "it",
}: {
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const archives = CITIES.map((c) => getArchiveStats(c)).filter(
    (a): a is NonNullable<ReturnType<typeof getArchiveStats>> => a !== null,
  );

  if (archives.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-3xl font-extrabold mb-2">{t.dataUnavailableTitle}</h1>
        <p className="text-on-surface-variant">{t.dataUnavailableBody}</p>
      </div>
    );
  }

  // Serie nazionale: media delle città, solo anni completi.
  const byYear = new Map<number, { sum: number; n: number }>();
  for (const a of archives) {
    for (const y of a.yearly) {
      if (y.count < 360) continue;
      const e = byYear.get(y.year) ?? { sum: 0, n: 0 };
      e.sum += y.mean;
      e.n += 1;
      byYear.set(y.year, e);
    }
  }
  // tieni gli anni in cui c'è almeno metà delle città
  const minCities = Math.ceil(archives.length / 2);
  const national: YearlyPoint[] = [...byYear.entries()]
    .filter(([, e]) => e.n >= minCities)
    .map(([year, e]) => ({ year, mean: e.sum / e.n, max: 0, min: 0, count: 365 }))
    .sort((a, b) => a.year - b.year);

  const inRange = (from: number, to: number) =>
    national.filter((y) => y.year >= from && y.year <= to);
  const avg = (arr: YearlyPoint[]) =>
    arr.reduce((s, y) => s + y.mean, 0) / (arr.length || 1);

  const baseline = avg(inRange(1961, 1990));
  const recentNormal = avg(inRange(1991, 2020));
  const normalsDelta = recentNormal - baseline;

  const anomalies: AnomalyPoint[] = national.map((y) => ({
    year: y.year,
    anomaly: y.mean - baseline,
  }));

  const decAgg = new Map<number, { s: number; n: number }>();
  for (const y of national) {
    const dec = Math.floor(y.year / 10) * 10;
    const e = decAgg.get(dec) ?? { s: 0, n: 0 };
    e.s += y.mean;
    e.n += 1;
    decAgg.set(dec, e);
  }
  const decades: DecadePoint[] = [...decAgg.entries()]
    .map(([decade, e]) => ({
      decade,
      mean: e.s / e.n,
      anomaly: e.s / e.n - baseline,
      count: e.n,
    }))
    .sort((a, b) => a.decade - b.decade);

  const reg = linreg(national.map((y) => [y.year, y.mean]));
  const firstYear = national[0].year;
  const lastYear = national[national.length - 1].year;
  const warmestYear = national.reduce((a, b) => (b.mean > a.mean ? b : a));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <header className="rise mb-8">
        <div className="m3-chip bg-primary-container text-on-primary-container mb-4">
          {t.chip}
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter">
          {t.title}
        </h1>
        <p className="text-on-surface-variant mt-3 max-w-2xl text-lg leading-relaxed">
          {t.intro(archives.length)}
        </p>
      </header>

      {/* VERDETTO NAZIONALE */}
      <Verdict
        scope={t.scope}
        normalsDelta={normalsDelta}
        perDecade={reg.slope * 10}
        ci95={reg.ciMargin * 10}
        r2={reg.r2}
        firstYear={firstYear}
        lastYear={lastYear}
        baseline={baseline}
        recentNormal={recentNormal}
        lang={lang}
      />

      {/* WARMING STRIPES */}
      <section className="m3-card rise p-5 sm:p-6 mb-6">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t.stripesTitle(firstYear, lastYear)}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
          {t.stripesBody}
        </p>
        <WarmingStripes data={anomalies} height={130} lang={lang} />
      </section>

      {/* ANOMALIE ANNUE */}
      <section className="m3-card rise p-5 sm:p-6 mb-6">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t.anomalyTitle}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
          {t.anomalyBody(warmestYear.year)}
        </p>
        <AnomalyBarChart data={anomalies} lang={lang} />
      </section>

      {/* DECENNI */}
      <section className="m3-card rise p-5 sm:p-6 mb-6">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t.decadeTitle}
        </h2>
        <p className="text-sm text-on-surface-variant mb-4 mt-1 leading-relaxed">
          {t.decadeBody}
        </p>
        <DecadeBars data={decades} lang={lang} />
      </section>

      <Methodology lang={lang} />
    </div>
  );
}
