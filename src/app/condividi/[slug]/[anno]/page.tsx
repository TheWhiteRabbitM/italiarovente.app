import type { Metadata } from "next";
import Link from "next/link";
import { getLifetimeData } from "@/lib/lifetime";
import { WarmingStripes } from "@/components/WarmingStripes";
import { ShareButtons } from "@/components/ShareButtons";
import { Temp } from "@/components/Temp";
import { fmtAnomaly, anomalyColor } from "@/lib/format";
import { getBirthYearCaption } from "@/lib/captions";
import { SITE_URL } from "@/lib/site";

const STR = {
  it: {
    chip: "🎂 Il mio clima",
    title: (name: string, year: number) => `${name}, dal ${year} a oggi`,
    lede: (year: number, then: React.ReactNode, span: string, now: React.ReactNode) => (
      <>
        {year}: <strong>{then}</strong> → {span}: <strong>{now}</strong>
      </>
    ),
    share: "Condividi",
    cta: "🔎 Calcola il tuo clima →",
    metaTitle: (name: string, year: number, delta: string) => `${name}: ${delta} dal ${year}`,
    metaDesc: (name: string, year: number, delta: string, warmed: boolean) =>
      `Da quando sono nato/a nel ${year}, ${name} si è ${warmed ? "scaldata" : "raffreddata"} di ${delta}. Calcola il tuo clima su Italia Rovente.`,
  },
  en: {
    chip: "🎂 My climate",
    title: (name: string, year: number) => `${name}, from ${year} to today`,
    lede: (year: number, then: React.ReactNode, span: string, now: React.ReactNode) => (
      <>
        {year}: <strong>{then}</strong> → {span}: <strong>{now}</strong>
      </>
    ),
    share: "Share",
    cta: "🔎 Calculate your climate →",
    metaTitle: (name: string, year: number, delta: string) => `${name}: ${delta} since ${year}`,
    metaDesc: (name: string, year: number, delta: string, warmed: boolean) =>
      `Since I was born in ${year}, ${name} has ${warmed ? "warmed" : "cooled"} by ${delta}. Calculate your own climate on Italia Rovente.`,
  },
};

function compute(slug: string, anno: string) {
  const data = getLifetimeData();
  const city = data.cities.find((c) => c.slug === slug) ?? data.cities[0];
  const year = Math.max(data.minYear, Math.min(data.maxYear - 1, Number(anno) || 1990));
  const wavg = (a: number, b: number) => {
    const w = city.years.filter((x) => x.y >= a && x.y <= b);
    return w.length ? w.reduce((s, x) => s + x.m, 0) / w.length : null;
  };
  const lastYear = city.years[city.years.length - 1]?.y ?? data.maxYear;
  const thenAvg = wavg(year - 2, year + 2);
  const nowAvg = wavg(lastYear - 4, lastYear);
  const delta = thenAvg != null && nowAvg != null ? nowAvg - thenAvg : 0;
  const stripes = city.years
    .filter((x) => x.y >= year)
    .map((x) => ({ year: x.y, anomaly: x.m - city.baseline }));
  return { city, year, thenAvg, nowAvg, delta, lastYear, stripes };
}

function buildMetadata(slug: string, anno: string, lang: "it" | "en"): Metadata {
  const { city, year, delta } = compute(slug, anno);
  const t = STR[lang];
  const path = lang === "en" ? `/en/condividi/${slug}/${anno}` : `/condividi/${slug}/${anno}`;
  const url = `${SITE_URL}${path}`;
  const title = t.metaTitle(city.name, year, fmtAnomaly(delta, 1, "c", { locale: lang }));
  const description = t.metaDesc(city.name, year, fmtAnomaly(delta, 1, "c", { locale: lang }), delta >= 0);
  // Una pagina per ogni anno di nascita: spazio quasi infinito e contenuto
  // thin, pensato per la condivisione social — noindex, follow.
  const robots = { index: false, follow: true };

  if (lang === "en") {
    return {
      title,
      description,
      robots,
      alternates: {
        canonical: path,
        languages: { it: `/condividi/${slug}/${anno}`, "x-default": `/condividi/${slug}/${anno}` },
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
      languages: { en: `/en/condividi/${slug}/${anno}` },
    },
    openGraph: { type: "article", url, title, description, siteName: "Italia Rovente", locale: "it_IT" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>;
}): Promise<Metadata> {
  const { slug, anno } = await params;
  return buildMetadata(slug, anno, "it");
}

export async function generateMetadataEn({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>;
}): Promise<Metadata> {
  const { slug, anno } = await params;
  return buildMetadata(slug, anno, "en");
}

export async function renderCondividiAnnoPage(slug: string, anno: string, lang: "it" | "en" = "it") {
  const { city, year, thenAvg, nowAvg, delta, lastYear, stripes } = compute(slug, anno);
  const t = STR[lang];
  const accent = anomalyColor(delta, 1.5);
  const shareUrl =
    lang === "en" ? `${SITE_URL}/en/condividi/${slug}/${anno}` : `${SITE_URL}/condividi/${slug}/${anno}`;
  const shareText = await getBirthYearCaption(city.name, year, delta, lang);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
      <div className="m3-chip bg-tertiary-container text-on-tertiary-container mx-auto mb-4">
        {t.chip}
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        {t.title(city.name, year)}
      </h1>
      <div
        className="text-7xl sm:text-8xl font-extrabold tracking-tighter my-4"
        style={{ color: accent }}
      >
        <Temp value={delta} digits={1} delta locale={lang} />
      </div>
      <p className="text-on-surface-variant mb-6">
        {t.lede(
          year,
          <Temp value={thenAvg} digits={1} />,
          `${lastYear - 4}–${lastYear}`,
          <Temp value={nowAvg} digits={1} />,
        )}
      </p>
      <div className="m3-card p-5 mb-6">
        <WarmingStripes data={stripes} height={90} lang={lang} />
      </div>

      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
        {t.share}
      </p>
      <div className="mb-8">
        <ShareButtons
          url={shareUrl}
          text={shareText}
          storyUrl={`/condividi/${slug}/${anno}/story${lang === "en" ? "?lang=en" : ""}`}
          downloadName={`italia-rovente-${slug}-${anno}.png`}
          lang={lang}
        />
      </div>

      <Link
        href={lang === "en" ? "/en" : "/"}
        className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform inline-flex"
      >
        {t.cta}
      </Link>
    </div>
  );
}

export default async function CondividiPage({
  params,
}: {
  params: Promise<{ slug: string; anno: string }>;
}) {
  const { slug, anno } = await params;
  return renderCondividiAnnoPage(slug, anno, "it");
}
