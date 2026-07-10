import { CITIES, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { CityIndex, type CityIndexItem } from "@/components/CityIndex";
import { SITE_URL } from "@/lib/site";
import Link from "next/link";

export const metadata = {
  title: "Tutte le città · Temperature dal 1940",
  description:
    "Esplora la temperatura di tutte le città italiane coperte da Italia Rovente: cerca la tua città e scopri come è cambiata dal 1940. Dati ERA5/ECMWF.",
  keywords: [
    "temperature città italiane",
    "clima città italiane",
    "cerca città clima",
    "elenco città meteo italia",
  ],
  alternates: { canonical: "/citta", languages: { en: "/en/citta" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/citta`,
    title: "Tutte le città italiane · Italia Rovente",
    description:
      "Cerca la tua città e scopri come è cambiata la sua temperatura dal 1940. Dati ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

export default function CittaIndexPage() {
  const items: CityIndexItem[] = CITIES.map((c) => {
    const s = getArchiveStats(c);
    const warming = s ? s.trend.recentNormal - s.trend.baselineMean : null;
    return {
      slug: c.slug,
      name: cityName(c, "it"),
      region: c.region,
      zone: c.zone,
      main: c.main,
      warming,
      perDecade: s ? s.trend.perDecade : null,
    };
  }).sort((a, b) => (b.warming ?? -99) - (a.warming ?? -99));

  const withData = items.filter((i) => i.warming != null).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Città", item: `${SITE_URL}/citta` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <Link
          href="/"
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          ← Home
        </Link>
        <Link
          href="/regioni"
          className="m3-chip bg-primary-container text-on-primary-container hover:scale-105 transition-transform"
        >
          🗺️ Esplora per regione →
        </Link>
      </div>
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Tutte le città
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {CITIES.length} città italiane, <strong>raggruppate per zona</strong> e
          in ordine alfabetico. Il riquadro colorato è il cambiamento di
          temperatura (normale 1991–2020 vs 1961–1990) — rosso se in aumento,
          blu se in diminuzione. Cerca la tua o filtra per zona. ⭐ = città
          principali.
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          {withData}/{CITIES.length} con storico già caricato · le altre si
          completano automaticamente.
        </p>
      </header>

      <CityIndex cities={items} />
    </div>
  );
}
