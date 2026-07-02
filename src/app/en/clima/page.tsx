import ClimaPage from "@/app/clima/page";
import { SITE_URL } from "@/lib/site";

// Usa solo lo snapshot storico (build): pagina statica, istantanea.
export const metadata = {
  title: "Italy's climate · Data since 1940",
  description:
    "How the climate has changed in the main Italian cities: temperature anomalies, warming stripes and trends from 1940 to today. ERA5/ECMWF data.",
  keywords: [
    "italy global warming",
    "temperature anomalies",
    "warming stripes",
    "italy climate change",
    "temperature trend",
  ],
  alternates: { canonical: "/en/clima", languages: { it: "/clima", "x-default": "/clima" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/en/clima`,
    title: "Italy's climate · Data since 1940",
    description:
      "Anomalies, warming stripes and national temperature trends since 1940. ERA5/ECMWF data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Italy's climate · Data since 1940",
    description: "Anomalies and warming stripes of Italian temperature since 1940.",
  },
};

export default function EnglishClimaPage() {
  return <ClimaPage lang="en" />;
}
