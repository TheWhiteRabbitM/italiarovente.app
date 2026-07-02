import Link from "next/link";
import { MAIN_CITIES, cityName, type City } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { fmtDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { ClimateQuiz, type QuizQuestion } from "@/components/ClimateQuiz";

// Il quiz è DETERMINISTICO per giorno: il seed è la data UTC, quindi tutti
// vedono le stesse 5 domande nello stesso giorno ("il quiz di oggi") e i
// punteggi sono confrontabili/condivisibili. La revalidazione oraria fa
// scattare il cambio di giorno senza rendere la pagina dinamica (i dati
// vengono dallo snapshot storico precalcolato: nessun fetch a runtime).
export const revalidate = 3600;

export const metadata = {
  title: "Quiz del clima · Quanto conosci le temperature italiane?",
  description:
    "5 domande al giorno sui numeri veri del clima italiano: anni record, riscaldamento città per città, notti tropicali e decenni più caldi. Dati ERA5/ECMWF dal 1940 — nuovo quiz ogni giorno.",
  keywords: [
    "quiz clima italia",
    "quiz riscaldamento globale",
    "temperature italiane quiz",
    "quiz cambiamento climatico",
  ],
  alternates: { canonical: "/quiz", languages: { en: "/en/quiz" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/quiz`,
    title: "Quiz del clima · Italia Rovente",
    description:
      "Quanto conosci le temperature italiane? 5 domande al giorno sui dati veri ERA5/ECMWF.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

type Lang = "it" | "en";
type Snap = NonNullable<ReturnType<typeof getArchiveStats>>;
type Entry = { city: City; s: Snap };

const QUESTION_COUNT = 5;
const TYPES = [
  "warmestYear",
  "warmingDelta",
  "whichCity",
  "tropicalNights",
  "decade",
] as const;

// --- PRNG deterministico -----------------------------------------------------
// Hash FNV-1a della data (YYYY-MM-DD) -> seed di mulberry32. Stesso giorno =
// stessa sequenza di numeri = stesse domande, in entrambe le lingue (la lingua
// non tocca mai il generatore: cambia solo le etichette).
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Costruttori delle domande ----------------------------------------------

// "Qual è stato l'anno più caldo di sempre a {città}?" — distrattori: altri
// anni molto caldi della stessa serie (plausibili, non a caso).
function qWarmestYear(e: Entry, rnd: () => number, lang: Lang, dateStr: string): QuizQuestion | null {
  const full = e.s.yearly.filter((y) => y.count >= 360);
  const wy = e.s.records.warmestYear;
  if (!wy || full.length < 8) return null;
  const candidates = [...full]
    .sort((a, b) => b.mean - a.mean)
    .slice(0, 12)
    .map((y) => y.year)
    .filter((y) => y !== wy.year);
  if (candidates.length < 3) return null;
  const years = shuffle([wy.year, ...shuffle(candidates, rnd).slice(0, 3)], rnd);
  return {
    id: `${dateStr}-warmestYear-${e.city.slug}`,
    type: "warmestYear",
    textParams: { city: cityName(e.city, lang) },
    options: years.map((y) => ({ label: String(y) })),
    correctIndex: years.indexOf(wy.year),
    explain: { year: wy.year, anomalyC: wy.mean - e.s.trend.baselineMean },
  };
}

// "Di quanto si è scaldata {città}?" — corretta arrotondata a 0,1°, distrattori
// a ±0,4/±0,8. Le opzioni viaggiano come deltaC: il client le formatta
// nell'unità corrente (C/F) con la matematica da delta.
const DELTA_OFFSET_SETS: readonly (readonly number[])[] = [
  [-0.8, -0.4, 0.4],
  [-0.4, 0.4, 0.8],
  [-0.8, -0.4, 0.8],
  [-0.8, 0.4, 0.8],
];

function qWarmingDelta(e: Entry, rnd: () => number, lang: Lang, dateStr: string): QuizQuestion | null {
  const d = e.s.trend.recentNormal - e.s.trend.baselineMean;
  if (!Number.isFinite(d)) return null;
  const r = Math.round(d * 10) / 10;
  const offsets = DELTA_OFFSET_SETS[Math.floor(rnd() * DELTA_OFFSET_SETS.length)];
  const opts = shuffle(
    [
      { deltaC: r, ok: true },
      ...offsets.map((o) => ({ deltaC: Math.round((r + o) * 10) / 10, ok: false })),
    ],
    rnd,
  );
  return {
    id: `${dateStr}-warmingDelta-${e.city.slug}`,
    type: "warmingDelta",
    textParams: { city: cityName(e.city, lang) },
    options: opts.map((o) => ({ deltaC: o.deltaC })),
    correctIndex: opts.findIndex((o) => o.ok),
    explain: { deltaC: d },
  };
}

// "Quale città si è scaldata di più?" — 2 opzioni, solo coppie con scarto
// >= 0.3°C (la risposta deve essere difendibile, non un testa-o-croce).
const WHICH_CITY_MIN_GAP = 0.3;

function qWhichCity(
  pool: Entry[],
  used: Set<string>,
  rnd: () => number,
  lang: Lang,
  dateStr: string,
): QuizQuestion | null {
  const list = pool
    .map((e) => ({ e, w: e.s.trend.recentNormal - e.s.trend.baselineMean }))
    .filter((x) => Number.isFinite(x.w));
  const findPair = (arr: typeof list) => {
    const sh = shuffle(arr, rnd);
    for (let i = 0; i < sh.length; i++) {
      for (let j = i + 1; j < sh.length; j++) {
        if (Math.abs(sh[i].w - sh[j].w) >= WHICH_CITY_MIN_GAP) return [sh[i], sh[j]];
      }
    }
    return null;
  };
  // Prima si prova con città non ancora usate da altre domande; se non basta,
  // si consente il riuso pur di avere la domanda.
  const pair =
    findPair(list.filter((x) => !used.has(x.e.city.slug))) ?? findPair(list);
  if (!pair) return null;
  const [a, b] = shuffle(pair, rnd);
  const winner = a.w > b.w ? a : b;
  const loser = winner === a ? b : a;
  used.add(a.e.city.slug);
  used.add(b.e.city.slug);
  return {
    id: `${dateStr}-whichCity-${a.e.city.slug}-${b.e.city.slug}`,
    type: "whichCity",
    textParams: {},
    options: [a, b].map((x) => ({ label: cityName(x.e.city, lang) })),
    correctIndex: winner === a ? 0 : 1,
    explain: {
      city: cityName(winner.e.city, lang),
      deltaC: winner.w,
      city2: cityName(loser.e.city, lang),
      deltaC2: loser.w,
    },
  };
}

// "Quante notti tropicali fa in media {città} oggi?" — media degli ultimi 5
// anni completi, solo città con minime reali (precise). Conteggi, non
// temperature: nessuna conversione C/F.
const TN_OFFSET_SETS_HI: readonly (readonly number[])[] = [
  [-12, -6, 7],
  [-6, 7, 14],
  [-12, 7, 15],
];
const TN_OFFSET_SETS_LO: readonly (readonly number[])[] = [
  [5, 11, 18],
  [4, 9, 15],
  [6, 12, 20],
];

function qTropicalNights(e: Entry, rnd: () => number, lang: Lang, dateStr: string): QuizQuestion | null {
  if (e.s.precise === false) return null;
  const tnYears = e.s.yearly.filter((y) => y.count >= 360 && y.tn != null);
  if (tnYears.length < 5) return null;
  const last5 = tnYears.slice(-5);
  const avg = Math.round(last5.reduce((sum, y) => sum + (y.tn ?? 0), 0) / last5.length);
  // Con media >= 13 i distrattori possono stare anche sotto (restano >= 1);
  // con medie piccole solo sopra, per non collassare tutti su 0.
  const sets = avg >= 13 ? TN_OFFSET_SETS_HI : TN_OFFSET_SETS_LO;
  const offsets = sets[Math.floor(rnd() * sets.length)];
  const opts = shuffle(
    [{ nights: avg, ok: true }, ...offsets.map((o) => ({ nights: avg + o, ok: false }))],
    rnd,
  );
  return {
    id: `${dateStr}-tropicalNights-${e.city.slug}`,
    type: "tropicalNights",
    textParams: { city: cityName(e.city, lang) },
    options: opts.map((o) => ({ nights: Math.max(0, o.nights) })),
    correctIndex: opts.findIndex((o) => o.ok),
    explain: { nights: avg },
  };
}

// "In che decennio {città} ha avuto la media più alta?" — solo decenni con
// almeno 5 anni completi; opzioni in ordine cronologico.
function qDecade(e: Entry, rnd: () => number, lang: Lang, dateStr: string): QuizQuestion | null {
  const decs = e.s.decades.filter((d) => d.count >= 5);
  if (decs.length < 4) return null;
  const top = decs.reduce((acc, d) => (d.mean > acc.mean ? d : acc), decs[0]);
  const others = shuffle(decs.filter((d) => d.decade !== top.decade), rnd).slice(0, 3);
  const chosen = [top, ...others].sort((a, b) => a.decade - b.decade);
  return {
    id: `${dateStr}-decade-${e.city.slug}`,
    type: "decade",
    textParams: { city: cityName(e.city, lang) },
    options: chosen.map((d) => ({ decade: d.decade })),
    correctIndex: chosen.findIndex((d) => d.decade === top.decade),
    explain: { decade: top.decade, anomalyC: top.anomaly },
  };
}

// --- Composizione del quiz ----------------------------------------------------
// 5 domande, una per tipo, su città principali distinte (quando possibile).
// Tutte le scelte casuali passano dallo stesso PRNG seedato dalla data.
function buildQuestions(dateStr: string, lang: Lang): QuizQuestion[] {
  const rnd = mulberry32(hashSeed(dateStr));
  const pool: Entry[] = MAIN_CITIES.flatMap((city) => {
    const s = getArchiveStats(city);
    return s ? [{ city, s }] : [];
  });
  if (!pool.length) return [];

  const cityOrder = shuffle(pool, rnd);
  const types = shuffle(TYPES, rnd);
  const used = new Set<string>();
  const questions: QuizQuestion[] = [];

  const withCity = (
    build: (e: Entry, rnd: () => number, lang: Lang, dateStr: string) => QuizQuestion | null,
  ): QuizQuestion | null => {
    for (const e of cityOrder) {
      if (used.has(e.city.slug)) continue;
      const q = build(e, rnd, lang, dateStr);
      if (q) {
        used.add(e.city.slug);
        return q;
      }
    }
    return null;
  };

  for (const type of types) {
    const q =
      type === "whichCity"
        ? qWhichCity(cityOrder, used, rnd, lang, dateStr)
        : type === "warmestYear"
          ? withCity(qWarmestYear)
          : type === "warmingDelta"
            ? withCity(qWarmingDelta)
            : type === "tropicalNights"
              ? withCity(qTropicalNights)
              : withCity(qDecade);
    if (q) questions.push(q);
  }

  // Se qualche tipo non è costruibile (dati mancanti), completa fino a 5 con
  // altre domande "anno più caldo" su città non ancora usate.
  for (const e of cityOrder) {
    if (questions.length >= QUESTION_COUNT) break;
    if (used.has(e.city.slug)) continue;
    const q = qWarmestYear(e, rnd, lang, dateStr);
    if (q) {
      used.add(e.city.slug);
      questions.push(q);
    }
  }

  return questions.slice(0, QUESTION_COUNT);
}

// --- Pagina --------------------------------------------------------------------
const STR = {
  it: {
    backLink: "← Home",
    backHref: "/",
    today: (d: string) => `Il quiz di oggi · ${d}`,
    heading: "Quanto conosci il clima italiano?",
    subtitle:
      "5 domande sui numeri veri delle città italiane: anni record, riscaldamento, notti tropicali. È lo stesso quiz per tutti, oggi — confronta il punteggio con chi vuoi. Domani cambia.",
    method:
      "Le risposte vengono dagli aggregati storici ERA5 (ECMWF/Copernicus) dal 1940, gli stessi delle pagine città e delle classifiche: periodi e metodo dichiarati, niente numeri inventati.",
  },
  en: {
    backLink: "← Home",
    backHref: "/en",
    today: (d: string) => `Today's quiz · ${d}`,
    heading: "How well do you know Italy's climate?",
    subtitle:
      "5 questions about the real numbers of Italian cities: record years, warming, tropical nights. It's the same quiz for everyone today — compare scores with anyone. Tomorrow it changes.",
    method:
      "Answers come from the ERA5 (ECMWF/Copernicus) historical aggregates since 1940, the same ones behind the city pages and the rankings: stated periods and method, no made-up numbers.",
  },
} as const;

export function QuizPageContent({ lang = "it" }: { lang?: Lang }) {
  const t = STR[lang];
  const dateStr = new Date().toISOString().slice(0, 10);
  const questions = buildQuestions(dateStr, lang);
  const base = lang === "en" ? "/en" : "";
  const pageUrl = `${SITE_URL}${base}/quiz`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: lang === "en" ? "Climate quiz" : "Quiz del clima",
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
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
      <header className="rise mb-8">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mb-4">
          🗓️ {t.today(fmtDate(dateStr, lang))}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.heading}</h1>
        <p className="text-on-surface-variant mt-3 leading-relaxed">{t.subtitle}</p>
      </header>

      <ClimateQuiz questions={questions} lang={lang} />

      <p className="text-xs text-on-surface-variant mt-6 leading-relaxed">{t.method}</p>
    </div>
  );
}

export default function QuizPage() {
  return <QuizPageContent lang="it" />;
}
