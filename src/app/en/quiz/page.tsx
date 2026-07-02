import { SITE_URL } from "@/lib/site";
import { QuizPageContent } from "@/app/quiz/page";

// Stessa revalidazione oraria della pagina IT: il quiz cambia col giorno UTC.
export const revalidate = 3600;

export const metadata = {
  title: "Climate quiz · How well do you know Italian temperatures?",
  description:
    "5 questions a day about the real numbers of Italy's climate: record years, city-by-city warming, tropical nights and the hottest decades. ERA5/ECMWF data since 1940 — a new quiz every day.",
  keywords: [
    "italy climate quiz",
    "global warming quiz",
    "italian temperatures quiz",
    "climate change quiz",
  ],
  alternates: { canonical: "/en/quiz", languages: { it: "/quiz", "x-default": "/quiz" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en/quiz`,
    title: "Climate quiz · Italia Rovente",
    description:
      "How well do you know Italian temperatures? 5 questions a day on real ERA5/ECMWF data.",
    siteName: "Italia Rovente",
    locale: "en_US",
  },
};

export default function EnglishQuizPage() {
  return <QuizPageContent lang="en" />;
}
