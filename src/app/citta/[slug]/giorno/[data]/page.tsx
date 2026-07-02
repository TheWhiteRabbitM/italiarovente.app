// "Macchina del tempo": che tempo faceva in una data qualsiasi dal 1940 a
// pochi giorni fa. Pagina condivisibile (matrimoni, compleanni, ricordi).
// Il contenuto è immutabile per le date passate → revalidate lungo; la cache
// dura del fetch vive comunque in src/lib/dayweather.ts (fino a 1 anno).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCity, cityName, type City } from "@/lib/cities";
import { getDayWeather, isValidDayDate } from "@/lib/dayweather";
import { getArchiveStats } from "@/lib/weather";
import { Temp } from "@/components/Temp";
import { DayLookup } from "@/components/DayLookup";
import {
  fmtDate,
  weatherDesc,
  weatherDescEn,
  tempColor,
  anomalyColor,
} from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

const STR = {
  it: {
    chip: "🕰️ Macchina del tempo",
    headline: (date: string, city: string) => `Che tempo faceva il ${date} a ${city}?`,
    max: "Massima",
    mean: "Media",
    min: "Minima",
    precip: (mm: string) => `💧 Precipitazioni: ${mm} mm`,
    context: (month: string) => (
      <>rispetto alla media di {month} della serie storica (1940–oggi)</>
    ),
    back: (city: string) => `← Il clima di ${city}`,
    metaTitle: (date: string, city: string) => `Che tempo faceva il ${date} a ${city}?`,
    metaDesc: (date: string, city: string) =>
      `Temperatura e meteo del ${date} a ${city} dai dati ERA5: massima, minima, media e confronto con la serie storica dal 1940. Cerca qualsiasi data su Italia Rovente.`,
  },
  en: {
    chip: "🕰️ Time machine",
    headline: (date: string, city: string) =>
      `What was the weather like on ${date} in ${city}?`,
    max: "High",
    mean: "Mean",
    min: "Low",
    precip: (mm: string) => `💧 Precipitation: ${mm} mm`,
    context: (month: string) => <>vs the {month} average of the full series (1940–today)</>,
    back: (city: string) => `← ${city}'s climate`,
    metaTitle: (date: string, city: string) =>
      `What was the weather like on ${date} in ${city}?`,
    metaDesc: (date: string, city: string) =>
      `Temperature and weather on ${date} in ${city} from ERA5 data: high, low, mean and how it compares with the historical series since 1940. Look up any date on Italia Rovente.`,
  },
};

// Nome del mese per esteso ("luglio" / "July") per la frase di contesto.
function monthLong(date: string, lang: "it" | "en"): string {
  return new Date(date + "T00:00:00").toLocaleDateString(
    lang === "en" ? "en-US" : "it-IT",
    { month: "long" },
  );
}

function buildMetadata(slug: string, data: string, lang: "it" | "en"): Metadata {
  const city = getCity(slug);
  if (!city || !isValidDayDate(data)) return {};
  const t = STR[lang];
  const name = cityName(city, lang);
  const date = fmtDate(data, lang);
  const path =
    lang === "en" ? `/en/citta/${slug}/giorno/${data}` : `/citta/${slug}/giorno/${data}`;
  const url = `${SITE_URL}${path}`;
  const title = t.metaTitle(date, name);
  const description = t.metaDesc(date, name);
  // Spazio URL infinito (una pagina per ogni data dal 1940): pensate per la
  // condivisione, non per il ranking — noindex per non bruciare crawl budget.
  const robots = { index: false, follow: true };

  if (lang === "en") {
    return {
      title,
      description,
      robots,
      alternates: {
        canonical: path,
        languages: {
          it: `/citta/${slug}/giorno/${data}`,
          "x-default": `/citta/${slug}/giorno/${data}`,
        },
      },
      openGraph: { type: "article", url, title, description, siteName: "Italia Rovente", locale: "en_US" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: path,
      languages: { en: `/en/citta/${slug}/giorno/${data}` },
    },
    openGraph: { type: "article", url, title, description, siteName: "Italia Rovente", locale: "it_IT" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; data: string }>;
}): Promise<Metadata> {
  const { slug, data } = await params;
  return buildMetadata(slug, data, "it");
}

export async function generateMetadataEn({
  params,
}: {
  params: Promise<{ slug: string; data: string }>;
}): Promise<Metadata> {
  const { slug, data } = await params;
  return buildMetadata(slug, data, "en");
}

export async function renderGiornoPage(slug: string, data: string, lang: "it" | "en" = "it") {
  const city: City | undefined = getCity(slug);
  if (!city || !isValidDayDate(data)) notFound();

  // null = dato non disponibile per quel giorno; gli errori HTTP persistenti
  // (429 dopo i retry) invece LANCIANO -> niente 404 cachato per un rate-limit.
  const day = await getDayWeather(city, data);
  if (!day) notFound();

  const t = STR[lang];
  const name = cityName(city, lang);
  const date = fmtDate(data, lang);
  const wd = lang === "en" ? weatherDescEn(day.code) : weatherDesc(day.code);

  // Contesto: anomalia della media del giorno vs la climatologia di quel MESE
  // sull'intera serie storica (aggregati precalcolati, nessun fetch extra).
  const stats = getArchiveStats(city);
  const monthNum = Number(data.slice(5, 7));
  const clim = stats?.monthly.find((m) => m.month === monthNum);
  const anomaly =
    day.mean != null && clim ? day.mean - clim.mean : null;

  const cityHref = lang === "en" ? `/en/citta/${slug}` : `/citta/${slug}`;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="text-center">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mx-auto mb-4 inline-flex">
          {t.chip}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          {t.headline(date, name)}
        </h1>

        <div className="text-6xl mb-1" aria-hidden>
          {wd.icon}
        </div>
        <p className="text-lg font-bold text-on-surface-variant mb-6">{wd.label}</p>

        <div className="m3-card p-5 sm:p-6 mb-6">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                {t.max}
              </div>
              <div
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: tempColor(day.max) }}
              >
                <Temp value={day.max} digits={1} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                {t.mean}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <Temp value={day.mean} digits={1} />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                {t.min}
              </div>
              <div
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: tempColor(day.min) }}
              >
                <Temp value={day.min} digits={1} />
              </div>
            </div>
          </div>

          {day.precip != null && day.precip > 0 && (
            <p className="text-sm text-on-surface-variant mt-4">
              {t.precip(
                lang === "it"
                  ? day.precip.toFixed(1).replace(".", ",")
                  : day.precip.toFixed(1),
              )}
            </p>
          )}
        </div>

        {anomaly != null && (
          <p className="text-on-surface-variant mb-8">
            <strong style={{ color: anomalyColor(anomaly, 3) }}>
              <Temp value={anomaly} digits={1} delta locale={lang} />
            </strong>{" "}
            {t.context(monthLong(data, lang))}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Link
            href={cityHref}
            className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            {t.back(name)}
          </Link>
        </div>
      </div>

      <DayLookup slug={slug} lang={lang} />
    </div>
  );
}

export default async function GiornoPage({
  params,
}: {
  params: Promise<{ slug: string; data: string }>;
}) {
  const { slug, data } = await params;
  return renderGiornoPage(slug, data, "it");
}
