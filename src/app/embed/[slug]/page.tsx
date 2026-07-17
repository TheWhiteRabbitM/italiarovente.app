import { notFound } from "next/navigation";
import { getCity, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { WarmingStripes } from "@/components/WarmingStripes";
import { Logo } from "@/components/Logo";
import { anomalyColor } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const STR = {
  it: {
    metaTitle: (name: string) => `${name} · warming stripes`,
    metaFallback: "Warming stripes",
    dataUnavailable: (name: string) => `Dati non disponibili per ${name}.`,
    dataSince: (year: number) => `Dati: ERA5/ECMWF, dal ${year}`,
    cta: (name: string) => `Tutti i dati di ${name} →`,
  },
  en: {
    metaTitle: (name: string) => `${name} · warming stripes`,
    metaFallback: "Warming stripes",
    dataUnavailable: (name: string) => `Data not available for ${name}.`,
    dataSince: (year: number) => `Data: ERA5/ECMWF, since ${year}`,
    cta: (name: string) => `All the data for ${name} →`,
  },
};

function buildMetadata(slug: string, lang: "it" | "en") {
  const city = getCity(slug);
  const t = STR[lang];
  const name = city ? cityName(city, lang) : null;
  const path = lang === "en" ? `/en/embed/${slug}` : `/embed/${slug}`;
  const altLangs =
    lang === "en"
      ? { it: `/embed/${slug}`, "x-default": `/embed/${slug}` }
      : { en: `/en/embed/${slug}` };
  return {
    title: name ? t.metaTitle(name) : t.metaFallback,
    robots: { index: false, follow: true },
    alternates: { canonical: path, languages: altLangs },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return buildMetadata(slug, "it");
}

export async function generateMetadataEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return buildMetadata(slug, "en");
}

// Widget isolato (nessun header/footer del sito, vedi ChromeGate) pensato per
// essere incorporato via <iframe> su siti terzi. Mantiene sempre un link di
// attribuzione visibile verso italiarovente.app.
export async function renderEmbedPage(slug: string, lang: "it" | "en" = "it") {
  const city = getCity(slug);
  if (!city) notFound();
  const t = STR[lang];
  const name = cityName(city, lang);

  const archive = getArchiveStats(city);
  if (!archive) {
    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif", color: "var(--on-surface-variant)" }}>
        {t.dataUnavailable(name)}
      </div>
    );
  }

  const warming = archive.trend.recentNormal - archive.trend.baselineMean;
  const color = anomalyColor(warming, 1.5);
  // UTM: il widget vive dentro siti terzi, quindi il referrer che arriva è il
  // loro. Con gli UTM sappiamo quanti lettori l'embed porta davvero sul sito
  // (Vercel Analytics li mostra nella scheda "UTM Parameters").
  const url =
    `${SITE_URL}${lang === "en" ? "/en" : ""}/citta/${city.slug}` +
    `?utm_source=embed&utm_medium=widget&utm_content=${city.slug}`;

  return (
    <div
      style={{
        padding: "16px 18px",
        fontFamily: "var(--font-sans, system-ui), sans-serif",
        background: "var(--surface, #f6efe6)",
        color: "var(--on-surface, #29241f)",
      }}
    >
      <a
        href={url}
        target="_top"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", marginBottom: 10 }}
      >
        <Logo size={22} />
        <span style={{ fontWeight: 800, fontSize: 15 }}>{name}</span>
        <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 22, color }}>
          <Temp value={warming} digits={1} delta locale={lang === "it" ? "it" : "en"} />
        </span>
      </a>

      <WarmingStripes data={archive.anomalies} height={54} showAxis={false} lang={lang} />

      {/* Fonte a sinistra (discreta), invito a destra. Nessun a-capo: gli host
          incorporano l'iframe con altezza fissa, una riga in più taglierebbe il
          widget — su larghezze strette si accorcia la fonte, mai il CTA. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "nowrap",
          gap: 10,
          marginTop: 8,
          fontSize: 11,
        }}
      >
        <span
          style={{
            opacity: 0.65,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {t.dataSince(archive.startYear)}
        </span>
        <a
          href={url}
          target="_top"
          rel="noopener noreferrer"
          style={{
            color: "var(--secondary, #c2410c)",
            fontWeight: 800,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {t.cta(name)}
        </a>
      </div>
    </div>
  );
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderEmbedPage(slug, "it");
}
