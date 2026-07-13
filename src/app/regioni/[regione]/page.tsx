import { notFound } from "next/navigation";
import Link from "next/link";
import { getCitiesByRegionSlug, cityName, type City } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { anomalyColor, readableTextOn, fmtAnomaly } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { SITE_URL } from "@/lib/site";
import { regionFaq, faqPageJsonLd } from "@/lib/faq";
import { FaqBlock } from "@/components/FaqBlock";
import type { Metadata } from "next";

const STR = {
  it: {
    backLink: "← Tutte le regioni",
    backHref: "/regioni",
    cityLabel: (n: number) => (n === 1 ? "città monitorata" : "città monitorate"),
    description: (n: number, region: string) =>
      `${n} ${STR.it.cityLabel(n)} in ${region}. Riscaldamento (normale 1991–2020 vs 1961–1990) di ciascuna, dalla più calda alla più fresca.`,
    loading: "dati in caricamento",
    perDecadeSuffix: "/decennio",
  },
  en: {
    backLink: "← All regions",
    backHref: "/en/regioni",
    cityLabel: (n: number) => (n === 1 ? "city monitored" : "cities monitored"),
    description: (n: number, region: string) =>
      `${n} ${STR.en.cityLabel(n)} in ${region}. Warming (1991–2020 normal vs 1961–1990) for each, from hottest to coolest.`,
    loading: "loading data",
    perDecadeSuffix: "/decade",
  },
} as const;

// Riscaldamento medio (normale 1991–2020 vs 1961–1990) tra le città della
// regione che hanno lo snapshot precalcolato; null se nessuna ce l'ha.
function regionAvgWarming(cities: City[]): number | null {
  const warmings = cities
    .map((c) => {
      const s = getArchiveStats(c);
      return s ? s.trend.recentNormal - s.trend.baselineMean : null;
    })
    .filter((w): w is number => w != null);
  return warmings.length
    ? warmings.reduce((sum, w) => sum + w, 0) / warmings.length
    : null;
}

export async function generateRegioneMetadata(
  { params }: { params: Promise<{ regione: string }> },
  lang: "it" | "en" = "it",
): Promise<Metadata> {
  const { regione } = await params;
  const data = getCitiesByRegionSlug(regione);
  if (!data) return {};
  const base = lang === "en" ? "/en/regioni" : "/regioni";
  const title =
    lang === "en"
      ? `${data.region} · Temperatures since 1940`
      : `${data.region} · Temperature dal 1940`;
  // Riscaldamento medio regionale (stesso calcolo della pagina: normale
  // 1991–2020 vs 1961–1990, media tra le città con snapshot): quando
  // disponibile arricchisce la description con il numero reale. Celsius
  // "piatti" per i crawler, virgola decimale in italiano.
  const avgWarming = regionAvgWarming(data.cities);
  const description =
    lang === "en"
      ? avgWarming != null
        ? `${data.region} has warmed by ${fmtAnomaly(avgWarming, 1)} on average (1991–2020 normal vs 1961–1990) across its monitored cities. How temperature has changed since 1940: anomalies, trends and records. ERA5/ECMWF data.`
        : `How temperature has changed in the monitored cities of ${data.region} since 1940: anomalies, trends and records. ERA5/ECMWF data.`
      : avgWarming != null
        ? `In ${data.region} la temperatura è salita in media di ${fmtAnomaly(avgWarming, 1, "c", { locale: "it" })} (normale 1991–2020 vs 1961–1990) tra le città monitorate. Come è cambiata dal 1940: anomalie, tendenze e record. Dati ERA5/ECMWF.`
        : `Come è cambiata la temperatura nelle città monitorate in ${data.region} dal 1940: anomalie, tendenze e record. Dati ERA5/ECMWF.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${regione}`,
      languages:
        lang === "en"
          ? { it: `/regioni/${regione}`, "x-default": `/regioni/${regione}` }
          : { en: `/en/regioni/${regione}` },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${base}/${regione}`,
      title,
      description,
      siteName: "Italia Rovente",
      locale: lang === "en" ? "en_US" : "it_IT",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ regione: string }>;
}): Promise<Metadata> {
  return generateRegioneMetadata({ params }, "it");
}

export async function RegionePageContent({
  params,
  lang = "it",
}: {
  params: Promise<{ regione: string }>;
  lang?: "it" | "en";
}) {
  const { regione } = await params;
  const data = getCitiesByRegionSlug(regione);
  if (!data) notFound();
  const t = STR[lang];

  const items = data.cities
    .map((c) => {
      const s = getArchiveStats(c);
      return {
        slug: c.slug,
        name: cityName(c, lang),
        main: c.main,
        warming: s ? s.trend.recentNormal - s.trend.baselineMean : null,
        perDecade: s ? s.trend.perDecade : null,
      };
    })
    .sort((a, b) => (b.warming ?? -99) - (a.warming ?? -99));

  // FAQ / AEO: riscaldamento medio della regione e città che si scalda di più.
  const regWarmings = items.map((c) => c.warming).filter((w): w is number => w != null);
  const regionAvg = regWarmings.length
    ? regWarmings.reduce((s, w) => s + w, 0) / regWarmings.length
    : null;
  const fastestInRegion = items.find((c) => c.warming != null);
  const faq =
    regionAvg != null
      ? regionFaq(lang, {
          region: data.region,
          warming: regionAvg,
          fastestName: fastestInRegion?.name,
          fastestWarming: fastestInRegion?.warming ?? undefined,
        })
      : [];

  // BreadcrumbList (Home → Regioni → {Regione}) + FAQPage, in un unico @graph.
  const base = lang === "en" ? "/en" : "";
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
            name: lang === "en" ? "Regions" : "Regioni",
            item: `${SITE_URL}${base}/regioni`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.region,
            item: `${SITE_URL}${base}/regioni/${regione}`,
          },
        ],
      },
      ...(faq.length ? [faqPageJsonLd(faq)] : []),
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
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{data.region}</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {t.description(items.length, data.region)}
        </p>
      </header>

      <div className="space-y-2.5">
        {items.map((c) => {
          const col = c.warming != null ? anomalyColor(c.warming, 1.5) : "var(--outline)";
          return (
            <Link
              key={c.slug}
              href={`${lang === "en" ? "/en" : ""}/citta/${c.slug}`}
              className="m3-card m3-card-interactive p-3 flex items-center gap-3 group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
                style={{ background: col, color: c.warming != null ? readableTextOn(col) : "#241b16" }}
              >
                {c.warming != null ? (
                  <Temp value={c.warming} digits={1} delta showUnit={false} locale={lang} />
                ) : (
                  "–"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                  {c.name}
                  {c.main && <span className="ml-1 text-[10px]">⭐</span>}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {c.perDecade != null ? (
                    <>
                      <Temp value={c.perDecade} digits={2} delta locale={lang} />
                      {t.perDecadeSuffix}
                    </>
                  ) : (
                    t.loading
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <FaqBlock
        faq={faq}
        title={lang === "en" ? `Frequently asked about ${data.region}` : `Domande frequenti su ${data.region}`}
      />
    </div>
  );
}

export default async function RegionePage({
  params,
}: {
  params: Promise<{ regione: string }>;
}) {
  return <RegionePageContent params={params} lang="it" />;
}
