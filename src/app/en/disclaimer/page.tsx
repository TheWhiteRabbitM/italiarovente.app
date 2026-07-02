import { DisclaimerContent } from "@/app/disclaimer/page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Disclaimer, methodology and license",
  description:
    "Usage warnings for Italia Rovente's data, methodology (ERA5/ECMWF, anomalies, climate normals) and the MIT open source license.",
  alternates: {
    canonical: "/en/disclaimer",
    languages: { it: "/disclaimer", "x-default": "/disclaimer" },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/en/disclaimer`,
    title: "Disclaimer, methodology and license · Italia Rovente",
    description:
      "Usage warnings, methodology and MIT open source license for the Italia Rovente project.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishDisclaimerPage() {
  return <DisclaimerContent lang="en" homeHref="/en" />;
}
