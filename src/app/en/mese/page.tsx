import { MesePageContent } from "@/app/mese/page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Monthly bulletin · The month just ended in Italy",
  description:
    "How hot the month just ended was in Italy, and where it ranks since 1940. Anomaly vs the 1961–1990 normal, historical ranking and a city-by-city breakdown. ERA5/ECMWF data.",
  keywords: [
    "hottest month italy",
    "italy monthly climate bulletin",
    "monthly temperature anomaly",
    "italy monthly heat record",
    "copernicus italy month",
  ],
  alternates: { canonical: "/en/mese", languages: { it: "/mese", "x-default": "/mese" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/en/mese`,
    title: "Monthly bulletin · Italia Rovente",
    description:
      "The month just ended in Italy: anomaly, historical ranking since 1940 and a city-by-city breakdown.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monthly bulletin · Italia Rovente",
    description: "How hot the month just ended was in Italy, and where it ranks since 1940.",
  },
};

export default function EnglishMesePage() {
  return <MesePageContent lang="en" />;
}
