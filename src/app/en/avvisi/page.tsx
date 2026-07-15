import { AvvisiPageContent } from "@/app/avvisi/page";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alerts",
  description:
    "The alerts sent by Italia Rovente: heat and cold records broken, incoming heatwaves, the monthly recap. Only real events detected in the data, never marketing.",
  alternates: {
    canonical: "/en/avvisi",
    languages: { it: "/avvisi", "x-default": "/avvisi" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/avvisi`,
    title: "Alerts · Italia Rovente",
    description: "Records, heatwaves and the monthly recap: only real events, from the data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishAvvisiPage() {
  return <AvvisiPageContent lang="en" />;
}
