import Link from "next/link";
import { MAIN_CITIES, cityDisplayName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { getLifetimeData } from "@/lib/lifetime";
import { EURO_CITIES, euroName, euroWarming } from "@/lib/europe";
import { anomalyColor, readableTextOn } from "@/lib/format";
import { Temp } from "@/components/Temp";
import { EuropeVersus } from "@/components/EuropeVersus";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Italia vs Europa · Chi si scalda di più?",
  description:
    "Roma si scalda più di Parigi? Le città italiane a confronto con 14 capitali europee sullo stesso dataset ERA5 e lo stesso metodo: normale 1991–2020 vs 1961–1990.",
  keywords: [
    "italia vs europa riscaldamento",
    "città europee temperatura",
    "confronto riscaldamento capitali europee",
    "roma parigi clima",
  ],
  alternates: { canonical: "/europa", languages: { en: "/en/europa" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/europa`,
    title: "Italia vs Europa · Italia Rovente",
    description:
      "Le città italiane contro le capitali europee: stesso dataset ERA5, stesso metodo, chi si scalda di più?",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

const STR = {
  it: {
    backLink: "← Confronto città",
    backHref: "/confronto",
    eyebrow: "🌍 Italia vs Europa",
    heading: "Roma si scalda più di Parigi?",
    intro:
      "Le città italiane a confronto con 14 capitali europee. Stesso dataset ERA5 (ECMWF/Copernicus) e stesso metodo per tutte: differenza tra la normale climatica 1991–2020 e quella 1961–1990. È questo che rende il confronto scientificamente corretto — nessun mix di fonti o periodi diversi. I dati europei sono un'istantanea statica: medie annue fino all'ultimo anno completo.",
    rankingTitle: "🌍 La classifica del riscaldamento",
    rankingSub:
      "Capitali europee e città principali italiane insieme, ordinate per differenza tra le due normali (1991–2020 vs 1961–1990). Il set europeo è una selezione curata di 14 capitali.",
    loadingTitle: "Dati europei in caricamento",
    loadingBody:
      "Le serie storiche delle capitali europee non sono ancora disponibili. Riprova tra poco.",
    home: "← Home",
    methodTitle: "Nota di metodo",
    methodBody:
      "Fonte: rianalisi ERA5 (ECMWF/Copernicus) via Open-Meteo, dal 1940. Per ogni città — italiana o europea — il riscaldamento è la differenza tra la normale climatica 1991–2020 e quella 1961–1990, calcolate sulle medie giornaliere. Le serie europee sono un'istantanea statica scaricata una tantum (medie annue dei soli anni completi, fino all'ultimo anno concluso), non aggiornata in tempo reale; i dati italiani seguono il ricalcolo periodico del resto del sito.",
    breadcrumb: "Italia vs Europa",
  },
  en: {
    backLink: "← City comparison",
    backHref: "/en/confronto",
    eyebrow: "🌍 Italy vs Europe",
    heading: "Is Rome warming faster than Paris?",
    intro:
      "Italian cities compared with 14 European capitals. Same ERA5 dataset (ECMWF/Copernicus) and same method for every city: difference between the 1991–2020 climate normal and the 1961–1990 one. That is what makes the comparison scientifically fair — no mixing of sources or periods. The European data is a static snapshot: annual means through the last complete year.",
    rankingTitle: "🌍 The warming ranking",
    rankingSub:
      "European capitals and main Italian cities together, sorted by the difference between the two normals (1991–2020 vs 1961–1990). The European set is a curated selection of 14 capitals.",
    loadingTitle: "European data loading",
    loadingBody:
      "The historical series for the European capitals are not available yet. Try again shortly.",
    home: "← Home",
    methodTitle: "Method note",
    methodBody:
      "Source: ERA5 reanalysis (ECMWF/Copernicus) via Open-Meteo, since 1940. For every city — Italian or European — warming is the difference between the 1991–2020 climate normal and the 1961–1990 one, computed on daily means. The European series are a static snapshot downloaded once (annual means of complete years only, through the last finished year), not updated in real time; the Italian data follows the site's periodic recalculation.",
    breadcrumb: "Italy vs Europe",
  },
} as const;

type RankEntry = {
  key: string;
  name: string;
  flag: string;
  warming: number;
  href: string | null; // solo le città italiane hanno una pagina dedicata
};

export function EuropaPageContent({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  const hasEuro = EURO_CITIES.length > 0;

  // Classifica unificata: capitali europee + città principali italiane,
  // stesso numero (differenza tra le due normali) per tutte.
  const euRows: RankEntry[] = EURO_CITIES.map((c) => ({
    key: `eu-${c.slug}`,
    name: euroName(c, lang),
    flag: c.country,
    warming: euroWarming(c),
    href: null,
  }));
  const itRows: RankEntry[] = MAIN_CITIES.flatMap((city) => {
    const s = getArchiveStats(city);
    if (!s) return [];
    const warming = s.trend.recentNormal - s.trend.baselineMean;
    if (!Number.isFinite(warming)) return [];
    return [
      {
        key: `it-${city.slug}`,
        name: cityDisplayName(city.slug, city.name, lang),
        flag: "🇮🇹",
        warming,
        href: `${base}/citta/${city.slug}`,
      },
    ];
  });
  const ranking = [...euRows, ...itRows].sort((a, b) => b.warming - a.warming);

  const pageUrl = `${SITE_URL}${base}/europa`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
      { "@type": "ListItem", position: 2, name: t.breadcrumb, item: pageUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={t.backHref}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.backLink}
      </Link>
      <header className="rise mb-10">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mb-5">
          {t.eyebrow}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.heading}</h1>
        <p className="text-on-surface-variant mt-2 max-w-2xl leading-relaxed">{t.intro}</p>
      </header>

      {hasEuro ? (
        <>
          {/* TESTA A TESTA Italia–Europa (interattivo) */}
          <div className="mb-12">
            <EuropeVersus
              itCities={getLifetimeData().cities}
              euroCities={EURO_CITIES}
              lang={lang}
            />
          </div>

          {/* CLASSIFICA unificata */}
          <section className="mb-12">
            <div className="mb-3">
              <h2 className="text-2xl font-extrabold tracking-tight">{t.rankingTitle}</h2>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                {t.rankingSub}
              </p>
            </div>
            <div className="space-y-2.5">
              {ranking.map((r, i) => {
                const col = anomalyColor(r.warming, 1.5);
                const inner = (
                  <>
                    <span className="w-6 text-right text-xs font-extrabold text-on-surface-variant tabular-nums shrink-0">
                      {i + 1}
                    </span>
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
                      style={{ background: col, color: readableTextOn(col) }}
                    >
                      <Temp value={r.warming} digits={1} delta showUnit={false} locale={lang} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
                        {r.name} {r.flag}
                      </div>
                    </div>
                  </>
                );
                return r.href ? (
                  <Link
                    key={r.key}
                    href={r.href}
                    className="m3-card m3-card-interactive p-3 flex items-center gap-3 group"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={r.key} className="m3-card p-3 flex items-center gap-3">
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        // europe.json ancora vuoto: card di cortesia al posto delle sezioni,
        // stesso stile del blocco "dati non disponibili" di /confronto.
        <div className="m3-card p-10 mb-12 text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h2 className="text-3xl font-extrabold mb-2">{t.loadingTitle}</h2>
          <p className="text-on-surface-variant">{t.loadingBody}</p>
          <Link
            href={base || "/"}
            className="m3-chip bg-primary text-on-primary px-6 py-3 mt-6 inline-flex"
          >
            {t.home}
          </Link>
        </div>
      )}

      {/* NOTA DI METODO */}
      <section className="m3-card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight mb-2">{t.methodTitle}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">{t.methodBody}</p>
      </section>
    </div>
  );
}

export default function EuropaPage() {
  return <EuropaPageContent lang="it" />;
}
