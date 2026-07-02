// Fatti precisi per la hero, dai dati storici — tutti mostrati insieme e in
// modo deterministico (niente selezione casuale a ogni caricamento: la hero
// deve dare informazione densa e verificabile, non un titolo diverso a ogni
// refresh solo per attirare l'attenzione).
import type { LifetimeData } from "./lifetime";
import { fmtAnomaly, type Unit } from "./format";
import { cityDisplayName } from "./cities";

export type HeroFact = {
  headline: string;
  value: string;
  caption: string;
  color: string;
  // Presente solo per i fatti che sono un DELTA di temperatura (°C): permette
  // al client di riformattare il valore nell'unità scelta (toggle C/F) — la
  // stringa `value` resta il fallback server-side in Celsius.
  deltaC?: number;
};

export type HeroFacts = {
  primary: HeroFact;
  secondary: HeroFact[];
};

// Colori dei token del tema (non anomalyColor): quella scala è tarata per
// riempimenti di grafici, non per testo — vicino allo zero sfuma verso il
// quasi bianco (illeggibile) e i suoi rossi non hanno contrasto garantito in
// dark mode. I token --primary/--secondary sono invece tarati per la
// leggibilità del testo in entrambi i temi.
const WARM = "var(--primary)";
const COOL = "var(--secondary)";

function slope(pts: [number, number][]): number {
  const n = pts.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const d = n * sxx - sx * sx;
  return d ? (n * sxy - sx * sy) / d : 0;
}

const STR = {
  it: {
    national: "Come è cambiata la temperatura in Italia?",
    nationalCaption: "normale 1991–2020 vs 1961–1990",
    hottestYear: "L'anno più caldo di sempre?",
    hottestYearCaption: (from: number) => `il più caldo in Italia dal ${from}`,
    dominance: "Gli anni più caldi?",
    dominanceValue: (n: number) => `${n} su 10`,
    dominanceCaption: "dei 10 più caldi di sempre sono dopo il 2010",
    topCity: "Dove il cambiamento è più marcato?",
    topCityCaption: (name: string) => `${name}, il riscaldamento maggiore tra le città monitorate`,
    pace: "A che ritmo cambia?",
    paceCaption: "ogni 10 anni, in media in Italia",
  },
  en: {
    national: "How has Italy's temperature changed?",
    nationalCaption: "1991–2020 normal vs 1961–1990",
    hottestYear: "The hottest year on record?",
    hottestYearCaption: (from: number) => `the warmest in Italy since ${from}`,
    dominance: "The hottest years ever?",
    dominanceValue: (n: number) => `${n} of 10`,
    dominanceCaption: "of the 10 hottest years ever were after 2010",
    topCity: "Where has the change been biggest?",
    topCityCaption: (name: string) => `${name}, the strongest warming among monitored cities`,
    pace: "How fast is it changing?",
    paceCaption: "every 10 years, on average in Italy",
  },
} as const;

export function buildHeroFacts(
  data: LifetimeData,
  lang: "it" | "en" = "it",
  unit: Unit = "c",
): HeroFacts | null {
  const t = STR[lang];
  const fmtD = (n: number) => fmtAnomaly(n, 1, unit, { locale: lang });
  const cities = data.cities;
  const italia = cities.find((c) => c.slug === "italia");
  // Stesso metodo "a due trentenni" (1991-2020 vs 1961-1990) usato ovunque
  // sul sito (Verdetto, confronto, poster) — mai una media degli ultimi anni,
  // che sarebbe più rumorosa e darebbe un numero diverso da quello mostrato
  // sulle pagine città per la stessa città. La hero è il biglietto da visita
  // del sito: deve essere calcolata col metodo più robusto, non il più vistoso.
  const warmingOf = (c: (typeof cities)[number]) => c.recentNormal - c.baseline;

  // Riscaldamento nazionale: sempre il dato principale della hero (fisso,
  // non scelto a caso — è il numero più rappresentativo del sito).
  const nationalWarming = italia ? warmingOf(italia) : null;
  if (nationalWarming == null) return null;
  const primary: HeroFact = {
    headline: t.national,
    value: fmtD(nationalWarming),
    caption: t.nationalCaption,
    color: nationalWarming >= 0 ? WARM : COOL,
    deltaC: nationalWarming,
  };

  const secondary: HeroFact[] = [];

  // Anno più caldo nazionale
  if (italia && italia.years.length) {
    const top = [...italia.years].sort((a, b) => b.m - a.m)[0];
    secondary.push({
      headline: t.hottestYear,
      value: String(top.y),
      caption: t.hottestYearCaption(italia.years[0].y),
      color: WARM,
    });
  }

  // Dominio degli anni recenti
  if (italia && italia.years.length >= 10) {
    const after = [...italia.years].sort((a, b) => b.m - a.m).slice(0, 10).filter((x) => x.y > 2010).length;
    secondary.push({
      headline: t.dominance,
      value: t.dominanceValue(after),
      caption: t.dominanceCaption,
      color: WARM,
    });
  }

  // Città col cambiamento più marcato (in valore assoluto: non presuppone
  // la direzione, se una città si fosse raffreddata più delle altre si sono
  // scaldate comparirebbe comunque qui).
  const real = cities.filter((c) => c.slug !== "italia");
  const ranked = real
    .map((c) => ({ c, w: warmingOf(c) }))
    .filter((x): x is { c: (typeof real)[number]; w: number } => x.w != null)
    .sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
  if (ranked.length) {
    const top = ranked[0];
    secondary.push({
      headline: t.topCity,
      value: fmtD(top.w),
      caption: t.topCityCaption(cityDisplayName(top.c.slug, top.c.name, lang)),
      color: top.w >= 0 ? WARM : COOL,
      deltaC: top.w,
    });
  }

  // Ritmo per decennio
  if (italia && italia.years.length) {
    const perDec = slope(italia.years.map((x) => [x.y, x.m])) * 10;
    secondary.push({
      headline: t.pace,
      value: fmtD(perDec),
      caption: t.paceCaption,
      color: perDec >= 0 ? WARM : COOL,
      deltaC: perDec,
    });
  }

  return { primary, secondary };
}
