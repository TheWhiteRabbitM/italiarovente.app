import { DatiPageContent } from "@/app/dati/page";
import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Open data",
  description:
    `Download the historical aggregates (climate normals, warming, trend) for the ${CITIES.length} Italian cities monitored by Italia Rovente, as CSV. ERA5/ECMWF data, free use with attribution.`,
  alternates: {
    canonical: "/en/dati",
    languages: { it: "/dati", "x-default": "/dati" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/dati`,
    title: "Open data · Italia Rovente",
    description: "Historical aggregates for Italian cities as CSV, free use with attribution.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishDatiPage() {
  return <DatiPageContent lang="en" />;
}
