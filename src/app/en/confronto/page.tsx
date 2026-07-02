import ConfrontoPage from "@/app/confronto/page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Temperature comparison · Italian cities (1940–today)",
  description:
    "Compare the climate of Italian cities since 1940: anomalies side by side, warming stripes and a full ranking of the change. ERA5/ECMWF data.",
  keywords: [
    "italian cities temperature comparison",
    "anomalies",
    "warming stripes",
    "city climate change ranking",
  ],
  alternates: { canonical: "/en/confronto", languages: { it: "/confronto", "x-default": "/confronto" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/en/confronto`,
    title: "Temperature comparison · Italian cities (1940–today)",
    description:
      "Anomalies and climate change ranking among Italian cities, since 1940. ERA5/ECMWF data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Temperature comparison · Italian cities (1940–today)",
    description: "Italian cities compared on climate change, since 1940.",
  },
};

export default function EnglishConfrontoPage() {
  return <ConfrontoPage lang="en" />;
}
