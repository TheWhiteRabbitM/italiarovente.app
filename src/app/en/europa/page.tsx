import { SITE_URL } from "@/lib/site";
import { EuropaPageContent } from "@/app/europa/page";

export const metadata = {
  title: "Italy vs Europe · Who is warming faster?",
  description:
    "Is Rome warming faster than Paris? Italian cities compared with 14 European capitals on the same ERA5 dataset and the same method: 1991–2020 normal vs 1961–1990.",
  keywords: [
    "italy vs europe warming",
    "european cities temperature",
    "european capitals warming comparison",
    "rome paris climate",
  ],
  alternates: { canonical: "/en/europa", languages: { it: "/europa", "x-default": "/europa" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/europa`,
    title: "Italy vs Europe · Italia Rovente",
    description:
      "Italian cities against European capitals: same ERA5 dataset, same method, who is warming faster?",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishEuropaPage() {
  return <EuropaPageContent lang="en" />;
}
