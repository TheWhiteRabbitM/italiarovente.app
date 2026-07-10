import { ApiPageContent } from "@/app/dati/api/page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Public API · Italian climate data, no key required",
  description:
    "Free, unauthenticated public API with historical temperatures for Italian cities (ERA5 since 1940) and a daily sea archive. JSON and CSV, CORS enabled, OpenAPI spec.",
  keywords: [
    "italy climate api",
    "italian temperature api",
    "open data weather api",
    "era5 api italy",
    "italia rovente api",
  ],
  alternates: { canonical: "/en/dati/api", languages: { it: "/dati/api", "x-default": "/dati/api" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/en/dati/api`,
    title: "Public API · Italia Rovente",
    description:
      "Italian historical temperatures via API: JSON, CSV, OpenAPI. No key, CORS enabled, with a SHA-256 fingerprint so you can verify the data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishApiPage() {
  return <ApiPageContent lang="en" />;
}
