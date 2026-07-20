import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCity, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { WarmingStripes } from "@/components/WarmingStripes";
import { ShareButtons } from "@/components/ShareButtons";
import { PosterLink } from "@/components/PosterLink";
import { Temp } from "@/components/Temp";
import { fmtAnomaly } from "@/lib/format";
import { getCityCaption } from "@/lib/captions";
import { SITE_URL } from "@/lib/site";

const STR = {
  it: {
    chip: (name: string) => `📍 Il clima di ${name}`,
    title: (name: string, from: number, to: number) => `${name}, ${from}–${to}`,
    lede: (baseline: React.ReactNode, recent: React.ReactNode, direction: string) => (
      <>
        Da <strong>{baseline}</strong> (normale 1961–1990) a{" "}
        <strong>{recent}</strong> (normale 1991–2020): {direction}.
      </>
    ),
    warmer: "più calda",
    cooler: "più fredda",
    share: "Condividi",
    posterTitle: "Infografica completa",
    posterAlt: (name: string) => `Infografica del clima di ${name}`,
    posterDownload: "⬇️ Scarica l'infografica",
    cta: "🔎 Vedi tutti i dati →",
    dataUnavailable: "Dati non disponibili al momento.",
    metaTitle: (name: string, delta: string) => `${name}: ${delta} dal 1961–1990`,
    metaDesc: (name: string, region: string, delta: string) =>
      `Come è cambiata la temperatura di ${name} (${region}) dal 1940? Normale 1991–2020 vs 1961–1990: ${delta}. Dati ERA5/ECMWF.`,
    shareFallback: (name: string, delta: string) =>
      `${name}: ${delta} tra il 1961–1990 e il 1991–2020. I dati, senza narrativa 🔥`,
  },
  en: {
    chip: (name: string) => `📍 ${name}'s climate`,
    title: (name: string, from: number, to: number) => `${name}, ${from}–${to}`,
    lede: (baseline: React.ReactNode, recent: React.ReactNode, direction: string) => (
      <>
        From <strong>{baseline}</strong> (1961–1990 normal) to{" "}
        <strong>{recent}</strong> (1991–2020 normal): {direction}.
      </>
    ),
    warmer: "warmer",
    cooler: "cooler",
    share: "Share",
    posterTitle: "Full infographic",
    posterAlt: (name: string) => `${name}'s climate infographic`,
    posterDownload: "⬇️ Download the infographic",
    cta: "🔎 See all the data →",
    dataUnavailable: "Data not available right now.",
    metaTitle: (name: string, delta: string) => `${name}: ${delta} since 1961–1990`,
    metaDesc: (name: string, region: string, delta: string) =>
      `How has the temperature of ${name} (${region}) changed since 1940? 1991–2020 normal vs 1961–1990: ${delta}. ERA5/ECMWF data.`,
    shareFallback: (name: string, delta: string) =>
      `${name}: ${delta} between 1961–1990 and 1991–2020. Just the data, no narrative 🔥`,
  },
};

// Condivisione della città nel suo complesso (non legata a un anno di nascita):
// stessa metrica "ufficiale" mostrata nel Verdetto della pagina città —
// normale 1991–2020 vs 1961–1990 — così il numero condiviso è sempre coerente
// con quello che chi riceve il link troverà sulla pagina della città.
function compute(slug: string) {
  const city = getCity(slug);
  if (!city) return null;
  const archive = getArchiveStats(city);
  return { city, archive };
}

function buildMetadata(slug: string, lang: "it" | "en"): Metadata {
  const path = lang === "en" ? `/en/condividi/${slug}` : `/condividi/${slug}`;
  const itPath = `/condividi/${slug}`;
  // Canonical esplicito anche nei rami degradati: senza, la pagina
  // erediterebbe quello del layout e si dichiarerebbe duplicato della home.
  const selfCanonical: Metadata = {
    alternates: {
      canonical: path,
      languages: lang === "en" ? { it: itPath, "x-default": itPath } : { en: `/en${itPath}` },
    },
  };

  const data = compute(slug);
  if (!data) return selfCanonical;
  const { city, archive } = data;
  const t = STR[lang];
  const name = cityName(city, lang);
  // Città senza archivio: pagina vuota, niente da indicizzare.
  if (!archive) return { ...selfCanonical, title: name, robots: { index: false, follow: true } };

  const url = `${SITE_URL}${path}`;
  const delta = archive.trend.recentNormal - archive.trend.baselineMean;
  const title = t.metaTitle(name, fmtAnomaly(delta, 1, "c", { locale: lang }));
  const description = t.metaDesc(name, city.region, fmtAnomaly(delta, 1, "c", { locale: lang }));

  if (lang === "en") {
    return {
      title,
      description,
      alternates: {
        canonical: path,
        languages: { it: `/condividi/${slug}`, "x-default": `/condividi/${slug}` },
      },
      openGraph: { type: "article", url, title, description, siteName: "Italia Rovente", locale: "en_US" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { en: `/en/condividi/${slug}` },
    },
    openGraph: { type: "article", url, title, description, siteName: "Italia Rovente", locale: "it_IT" },
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

export async function renderCondividiCittaPage(slug: string, lang: "it" | "en" = "it") {
  const data = compute(slug);
  if (!data) notFound();
  const { city, archive } = data;
  const t = STR[lang];
  const name = cityName(city, lang);
  const cityHref = `${lang === "en" ? "/en" : ""}/citta/${city.slug}`;

  if (!archive) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
        <h1 className="text-3xl font-extrabold mb-2">{name}</h1>
        <p className="text-on-surface-variant">{t.dataUnavailable}</p>
      </div>
    );
  }

  const delta = archive.trend.recentNormal - archive.trend.baselineMean;
  // Colore del tema, non anomalyColor: quella scala sfuma verso il quasi
  // bianco per scarti piccoli (es. Cosenza +0.2°C), illeggibile in dark mode.
  const accent = delta >= 0 ? "var(--primary)" : "var(--secondary)";
  const direction = delta >= 0 ? t.warmer : t.cooler;
  const shareUrl = lang === "en" ? `${SITE_URL}/en/condividi/${city.slug}` : `${SITE_URL}/condividi/${city.slug}`;
  const shareText = await getCityCaption(
    city.slug,
    t.shareFallback(name, fmtAnomaly(delta, 1, "c", { locale: lang })),
    lang,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
      <div className="m3-chip bg-tertiary-container text-on-tertiary-container mx-auto mb-4">
        {t.chip(name)}
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        {t.title(name, archive.startYear, archive.trend.lastYear)}
      </h1>
      <div
        className="text-7xl sm:text-8xl font-extrabold tracking-tighter my-4"
        style={{ color: accent }}
      >
        <Temp value={delta} digits={1} delta locale={lang} />
      </div>
      <p className="text-on-surface-variant mb-6">
        {t.lede(
          <Temp value={archive.trend.baselineMean} digits={1} />,
          <Temp value={archive.trend.recentNormal} digits={1} />,
          direction,
        )}
      </p>
      <div className="m3-card p-5 mb-6">
        <WarmingStripes data={archive.anomalies} height={90} lang={lang} />
      </div>

      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
        {t.share}
      </p>
      <div className="mb-8">
        <ShareButtons
          url={shareUrl}
          text={shareText}
          storyUrl={`/condividi/${city.slug}/story${lang === "en" ? "?lang=en" : ""}`}
          downloadName={`italia-rovente-${city.slug}.png`}
          lang={lang}
        />
      </div>

      {/* POSTER: infografica completa con mappa della regione evidenziata */}
      <div className="m3-card p-4 sm:p-5 mb-8 text-left">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3 text-center">
          {t.posterTitle}
        </p>
        <PosterLink
          posterUrl={`/condividi/${city.slug}/poster`}
          downloadName={`italia-rovente-${city.slug}-poster.png`}
          alt={t.posterAlt(name)}
          label={t.posterDownload}
          lang={lang}
        />
      </div>

      <Link
        href={cityHref}
        className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform inline-flex"
      >
        {t.cta}
      </Link>
    </div>
  );
}

export default async function CondividiCittaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderCondividiCittaPage(slug, "it");
}
