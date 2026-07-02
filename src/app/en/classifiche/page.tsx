import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import { ClassifichePageContent } from "@/app/classifiche/page";

export const metadata = {
  title: "Rankings · The cities of warming",
  description:
    `Rankings across the ${CITIES.length} monitored Italian cities: where warming is strongest, the pace per decade, all-time records and tropical nights. ERA5/ECMWF data since 1940.`,
  keywords: [
    "hottest italian cities ranking",
    "italian cities warming",
    "italy temperature records",
    "tropical nights italy",
  ],
  alternates: { canonical: "/en/classifiche", languages: { it: "/classifiche", "x-default": "/classifiche" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/classifiche`,
    title: "Rankings · Italia Rovente",
    description:
      "The fastest-warming cities, all-time records, tropical nights. ERA5/ECMWF data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishClassifichePage() {
  return <ClassifichePageContent lang="en" />;
}
