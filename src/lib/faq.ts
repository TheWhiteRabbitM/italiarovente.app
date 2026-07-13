// FAQ / AEO condivise: risposte secche e machine-readable alle domande
// fattuali sul riscaldamento (nazionale e regionale), usate insieme come
// FAQPage JSON-LD e come sezione "Domande e risposte" visibile su più pagine
// (home, regioni, clima). Numeri sempre in °C canonico — risposta stabile e
// citabile, non un racconto. La scheda città ha il proprio builder analogo.

export type Faq = { q: string; a: string };
type Lang = "it" | "en";

export function fmtSignedC(n: number, lang: Lang): string {
  const s = (n >= 0 ? "+" : "") + n.toFixed(1);
  return lang === "it" ? s.replace(".", ",") : s;
}

// Oggetto FAQPage (schema.org) da innestare nel @graph JSON-LD di una pagina.
export function faqPageJsonLd(faq: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export type NationalFaqCtx = {
  warming: number; // media città, normale 1991-2020 vs 1961-1990
  startYear: number;
  citiesCount: number;
  fastestName?: string;
  fastestWarming?: number;
};

export function nationalFaq(lang: Lang, c: NationalFaqCtx): Faq[] {
  if (lang === "en") {
    const f: Faq[] = [
      {
        q: "How much has Italy warmed since 1940?",
        a: `The Italian cities monitored here have warmed by ${fmtSignedC(c.warming, "en")}°C on average: the 1991–2020 climate normal is ${fmtSignedC(c.warming, "en")}°C higher than the 1961–1990 one. Source: ERA5 reanalysis (ECMWF/Copernicus), ${c.citiesCount} cities, series since ${c.startYear}.`,
      },
      {
        q: "Is Italy getting warmer?",
        a: `Yes. Comparing the 1961–1990 and 1991–2020 climate normals, the average temperature of the monitored Italian cities rose by ${fmtSignedC(c.warming, "en")}°C — measured data, not a projection.`,
      },
    ];
    if (c.fastestName && c.fastestWarming != null) {
      f.push({
        q: "Which Italian city is warming the fastest?",
        a: `Among the monitored cities, ${c.fastestName}, with ${fmtSignedC(c.fastestWarming, "en")}°C between the same two 30-year normals.`,
      });
    }
    return f;
  }
  const f: Faq[] = [
    {
      q: "Di quanto si è scaldata l'Italia dal 1940?",
      a: `Le città italiane monitorate si sono scaldate in media di ${fmtSignedC(c.warming, "it")}°C: la normale climatica 1991–2020 è più alta di ${fmtSignedC(c.warming, "it")}°C rispetto a quella 1961–1990. Fonte: rianalisi ERA5 (ECMWF/Copernicus), ${c.citiesCount} città, serie dal ${c.startYear}.`,
    },
    {
      q: "L'Italia si sta scaldando?",
      a: `Sì. Confrontando le normali climatiche 1961–1990 e 1991–2020, la temperatura media delle città italiane monitorate è aumentata di ${fmtSignedC(c.warming, "it")}°C — dati misurati, non una proiezione.`,
    },
  ];
  if (c.fastestName && c.fastestWarming != null) {
    f.push({
      q: "Quale città italiana si scalda più in fretta?",
      a: `Tra quelle monitorate, ${c.fastestName}, con ${fmtSignedC(c.fastestWarming, "it")}°C tra le stesse due normali trentennali.`,
    });
  }
  return f;
}

export type RegionFaqCtx = {
  region: string;
  warming: number; // media regione
  fastestName?: string;
  fastestWarming?: number;
};

export function regionFaq(lang: Lang, c: RegionFaqCtx): Faq[] {
  if (lang === "en") {
    const f: Faq[] = [
      {
        q: `How much has ${c.region} warmed since 1940?`,
        a: `On average across its monitored cities, ${c.region} has warmed by ${fmtSignedC(c.warming, "en")}°C (1991–2020 climate normal vs 1961–1990). Source: ERA5 reanalysis (ECMWF/Copernicus).`,
      },
    ];
    if (c.fastestName && c.fastestWarming != null) {
      f.push({
        q: `Which city warms the most in ${c.region}?`,
        a: `${c.fastestName}, with ${fmtSignedC(c.fastestWarming, "en")}°C between the two 30-year normals.`,
      });
    }
    return f;
  }
  const f: Faq[] = [
    {
      q: `Di quanto si è scaldata ${c.region} dal 1940?`,
      a: `In media tra le sue città monitorate, ${c.region} si è scaldata di ${fmtSignedC(c.warming, "it")}°C (normale climatica 1991–2020 rispetto alla 1961–1990). Fonte: rianalisi ERA5 (ECMWF/Copernicus).`,
    },
  ];
  if (c.fastestName && c.fastestWarming != null) {
    f.push({
      q: `Quale città si scalda di più in ${c.region}?`,
      a: `${c.fastestName}, con ${fmtSignedC(c.fastestWarming, "it")}°C tra le due normali trentennali.`,
    });
  }
  return f;
}
