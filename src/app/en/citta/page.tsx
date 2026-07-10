import { CITIES, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { CityIndex, type CityIndexItem } from "@/components/CityIndex";
import { SITE_URL } from "@/lib/site";
import Link from "next/link";

export const metadata = {
  title: "All cities · Temperatures since 1940",
  description:
    "Explore the temperature of every Italian city covered by Italia Rovente: search your city and see how it has changed since 1940. ERA5/ECMWF data.",
  keywords: [
    "italian cities temperature",
    "italy cities climate",
    "search city climate",
    "list of italian weather cities",
  ],
  alternates: { canonical: "/en/citta", languages: { it: "/citta", "x-default": "/citta" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/citta`,
    title: "All Italian cities · Italia Rovente",
    description:
      "Search your city and see how its temperature has changed since 1940. ERA5/ECMWF data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishCittaIndexPage() {
  const items: CityIndexItem[] = CITIES.map((c) => {
    const s = getArchiveStats(c);
    const warming = s ? s.trend.recentNormal - s.trend.baselineMean : null;
    return {
      slug: c.slug,
      name: cityName(c, "en"),
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
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
      { "@type": "ListItem", position: 2, name: "Cities", item: `${SITE_URL}/en/citta` },
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
          href="/en"
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          ← Home
        </Link>
        <Link
          href="/en/regioni"
          className="m3-chip bg-primary-container text-on-primary-container hover:scale-105 transition-transform"
        >
          🗺️ Explore by region →
        </Link>
      </div>
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          All cities
        </h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {CITIES.length} Italian cities, <strong>grouped by zone</strong> and
          in alphabetical order. The colored box is the temperature change
          (1991–2020 normal vs 1961–1990) — red if rising, blue if falling.
          Search for yours or filter by zone. ⭐ = main cities.
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          {withData}/{CITIES.length} with history already loaded · the rest
          complete automatically.
        </p>
      </header>

      <CityIndex cities={items} lang="en" />
    </div>
  );
}
