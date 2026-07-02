import Link from "next/link";
import { CITIES, REGIONS, slugifyRegion } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { anomalyColor, readableTextOn } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Regioni · Temperature dal 1940",
  description:
    "Il riscaldamento regione per regione: scopri come è cambiata la temperatura nelle città più rilevanti di ciascuna delle 20 regioni italiane, dal 1940.",
  keywords: [
    "temperature per regione",
    "clima regioni italiane",
    "riscaldamento regione italia",
  ],
  alternates: { canonical: "/regioni", languages: { en: "/en/regioni" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/regioni`,
    title: "Regioni · Italia Rovente",
    description: "Il riscaldamento regione per regione, dal 1940. Dati ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

const STR = {
  it: {
    backLink: "← Tutte le città",
    backHref: "/citta",
    heading: "Regioni",
    subtitle:
      "Il riscaldamento (normale 1991–2020 vs 1961–1990) medio tra le città monitorate di ciascuna regione. Tocca una regione per vedere le sue città.",
    cityCount: (n: number) => `${n} ${n === 1 ? "città monitorata" : "città monitorate"}`,
  },
  en: {
    backLink: "← All cities",
    backHref: "/en/citta",
    heading: "Regions",
    subtitle:
      "Average warming (1991–2020 normal vs 1961–1990) across the monitored cities of each region. Tap a region to see its cities.",
    cityCount: (n: number) => `${n} ${n === 1 ? "city" : "cities"} monitored`,
  },
} as const;

export function RegioniPageContent({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  // BreadcrumbList (Home → Regioni), stesso pattern JSON-LD della pagina città.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: lang === "en" ? "Regions" : "Regioni",
        item: `${SITE_URL}${base}/regioni`,
      },
    ],
  };
  const rows = REGIONS.map((region) => {
    const cities = CITIES.filter((c) => c.region === region);
    const warmings = cities
      .map((c) => {
        const s = getArchiveStats(c);
        return s ? s.trend.recentNormal - s.trend.baselineMean : null;
      })
      .filter((w): w is number => w != null);
    const avgWarming = warmings.length
      ? warmings.reduce((sum, w) => sum + w, 0) / warmings.length
      : null;
    return { region, slug: slugifyRegion(region), cityCount: cities.length, avgWarming };
  }).sort((a, b) => (b.avgWarming ?? -99) - (a.avgWarming ?? -99));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
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
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.heading}</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Link
            key={r.region}
            href={`${lang === "en" ? "/en" : ""}/regioni/${r.slug}`}
            className="m3-card m3-card-interactive p-4 flex items-center gap-3 group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
              style={{
                background: r.avgWarming != null ? anomalyColor(r.avgWarming, 1.5) : "var(--outline)",
                color: r.avgWarming != null ? readableTextOn(anomalyColor(r.avgWarming, 1.5)) : "#241b16",
              }}
            >
              {r.avgWarming != null ? (
                <Temp value={r.avgWarming} digits={1} delta showUnit={false} locale={lang} />
              ) : (
                "–"
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                {r.region}
              </div>
              <div className="text-xs text-on-surface-variant truncate">
                {t.cityCount(r.cityCount)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RegioniPage() {
  return <RegioniPageContent lang="it" />;
}
