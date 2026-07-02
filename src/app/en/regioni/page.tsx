import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import { RegioniPageContent } from "@/app/regioni/page";

export const metadata = {
  title: "Regions · Temperatures since 1940",
  description:
    "Warming region by region: see how temperature has changed in the most relevant cities of each of Italy's 20 regions, since 1940.",
  keywords: ["temperatures by region", "italian regions climate", "regional warming italy"],
  alternates: { canonical: "/en/regioni", languages: { it: "/regioni", "x-default": "/regioni" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/regioni`,
    title: "Regions · Italia Rovente",
    description: `Warming region by region, since 1940, across ${CITIES.length} Italian cities. ERA5/ECMWF data.`,
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishRegioniPage() {
  return <RegioniPageContent lang="en" />;
}
