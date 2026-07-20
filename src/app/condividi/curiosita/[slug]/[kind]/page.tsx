import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCity, cityName } from "@/lib/cities";
import { getCuriosity, CURIOSITY_KINDS, type CuriosityKind } from "@/lib/curiosities";
import { ShareButtons } from "@/components/ShareButtons";
import { SITE_URL } from "@/lib/site";

const STR = {
  it: {
    home: "← Torna alla scheda città",
    share: "Condividi",
    cta: "🔎 Vedi tutti i dati →",
    dataUnavailable: "Questo dato non è disponibile al momento per questa città.",
  },
  en: {
    home: "← Back to the city page",
    share: "Share",
    cta: "🔎 See all the data →",
    dataUnavailable: "This fact isn't available right now for this city.",
  },
};

function isCuriosityKind(k: string): k is CuriosityKind {
  return (CURIOSITY_KINDS as string[]).includes(k);
}

function compute(slug: string, kind: string, lang: "it" | "en") {
  if (!isCuriosityKind(kind)) return null;
  const city = getCity(slug);
  if (!city) return null;
  return { city, kind };
}

function buildPath(slug: string, kind: string, lang: "it" | "en") {
  return lang === "en"
    ? `/en/condividi/curiosita/${slug}/${kind}`
    : `/condividi/curiosita/${slug}/${kind}`;
}

async function buildMetadata(slug: string, kind: string, lang: "it" | "en"): Promise<Metadata> {
  const path = buildPath(slug, kind, lang);
  const url = `${SITE_URL}${path}`;
  const itPath = `/condividi/curiosita/${slug}/${kind}`;

  // Base SEMPRE presente, anche quando il dato non c'è: queste pagine servono
  // solo alla condivisione (noindex), e senza un `canonical` esplicito
  // erediterebbero quello della home dichiarandosene duplicati — è ciò che
  // Search Console segnalava come "Duplicate without user-selected canonical".
  const base: Metadata = {
    alternates: {
      canonical: path,
      languages:
        lang === "en"
          ? { it: itPath, "x-default": itPath }
          : { en: `/en${itPath}` },
    },
    robots: { index: false, follow: true },
  };

  const data = compute(slug, kind, lang);
  if (!data) return base;
  const c = await getCuriosity(slug, data.kind, lang);
  if (!c) return { ...base, title: cityName(data.city, lang) };

  return {
    ...base,
    title: c.metaTitle,
    description: c.metaDescription,
    openGraph: {
      type: "article",
      url,
      title: c.metaTitle,
      description: c.metaDescription,
      siteName: "Italia Rovente",
      locale: lang === "en" ? "en_US" : "it_IT",
    },
    twitter: { card: "summary_large_image", title: c.metaTitle, description: c.metaDescription },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}): Promise<Metadata> {
  const { slug, kind } = await params;
  return buildMetadata(slug, kind, "it");
}

export async function generateMetadataEn({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}): Promise<Metadata> {
  const { slug, kind } = await params;
  return buildMetadata(slug, kind, "en");
}

export async function renderCuriosityPage(slug: string, kind: string, lang: "it" | "en" = "it") {
  const data = compute(slug, kind, lang);
  if (!data) notFound();
  const t = STR[lang];
  const name = cityName(data.city, lang);
  const cityHref = `${lang === "en" ? "/en" : ""}/citta/${data.city.slug}`;
  const c = await getCuriosity(slug, data.kind, lang);

  if (!c) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
        <h1 className="text-3xl font-extrabold mb-2">{name}</h1>
        <p className="text-on-surface-variant">{t.dataUnavailable}</p>
        <Link href={cityHref} className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform inline-flex mt-6">
          {t.cta}
        </Link>
      </div>
    );
  }

  const shareUrl = `${SITE_URL}${buildPath(slug, kind, lang)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
      <div className="m3-chip bg-tertiary-container text-on-tertiary-container mx-auto mb-4">
        {c.eyebrow}
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{c.pageTitle}</h1>
      <div
        className="text-6xl sm:text-7xl font-extrabold tracking-tighter my-4"
        style={{ color: c.bigColor }}
      >
        {c.bigText}
      </div>
      <p className="text-on-surface-variant mb-8">{c.subLine}</p>

      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
        {t.share}
      </p>
      <div className="mb-8">
        <ShareButtons
          url={shareUrl}
          text={c.shareText}
          storyUrl={`${lang === "en" ? "/en" : ""}/condividi/curiosita/${slug}/${kind}/opengraph-image`}
          downloadName={`italia-rovente-${slug}-${kind}.png`}
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

export default async function CondividiCuriositaPage({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}) {
  const { slug, kind } = await params;
  return renderCuriosityPage(slug, kind, "it");
}
