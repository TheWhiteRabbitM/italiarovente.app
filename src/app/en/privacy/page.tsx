import { PrivacyPageContent } from "@/app/privacy/page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Privacy policy",
  description:
    "How Italia Rovente handles data: no account, no personal data sold. Only anonymous aggregated counts, cookieless analytics and optional push notifications.",
  alternates: {
    canonical: "/en/privacy",
    languages: { it: "/privacy", "x-default": "/privacy" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/privacy`,
    title: "Privacy policy · Italia Rovente",
    description: "No account, no personal data sold: only anonymous aggregated counts.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishPrivacyPage() {
  return <PrivacyPageContent lang="en" />;
}
