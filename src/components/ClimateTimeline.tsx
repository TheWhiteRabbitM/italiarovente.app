import type { ReactNode } from "react";
import { fmtDate } from "@/lib/format";
import { Temp } from "./Temp";

// Linea del tempo del clima di una città: SOLO eventi reali e datati, presi
// dagli aggregati già calcolati (record assoluti, anni estremi, sequenze più
// lunghe). Niente "cambi di trend" inventati: un changepoint richiederebbe
// un'analisi statistica dedicata, e senza quella sarebbe un numero fabbricato.

type Extreme = { date: string; value: number };
type YearPoint = { year: number; mean: number };
type Streak = { days: number; start: string; end: string; peak?: number; low?: number };

type Records = {
  hottest: Extreme;
  coldest: Extreme;
  warmestYear: YearPoint;
  coolestYear: YearPoint;
  longestHeatwave?: Streak | null;
  longestColdSnap?: Streak | null;
};

const STR = {
  it: {
    title: "🕰️ La linea del tempo del clima",
    subtitle: (name: string) =>
      `Le tappe reali della storia climatica di ${name}, in ordine cronologico: solo record misurati e anni estremi, dai dati ERA5.`,
    start: "Inizio delle misurazioni",
    startBody: "Da qui parte la serie storica ERA5.",
    coolestYear: "L'anno più fresco",
    warmestYear: "L'anno più caldo",
    yearMean: (v: ReactNode) => <>media annua {v}</>,
    coldRecord: "Record di freddo assoluto",
    hotRecord: "Record di caldo assoluto",
    heatwave: "L'ondata di calore più lunga",
    coldsnap: "La sequenza di gelo più lunga",
    daysAbove: (n: number, peak: ReactNode) => (
      <>
        {n} giorni consecutivi sopra i 35°, picco {peak}
      </>
    ),
    daysBelow: (n: number, low: ReactNode) => (
      <>
        {n} notti consecutive sotto lo zero, minima {low}
      </>
    ),
  },
  en: {
    title: "🕰️ The climate timeline",
    subtitle: (name: string) =>
      `The real milestones of ${name}'s climate history, in chronological order: only measured records and extreme years, from ERA5 data.`,
    start: "Measurements begin",
    startBody: "Where the ERA5 historical series starts.",
    coolestYear: "The coolest year",
    warmestYear: "The warmest year",
    yearMean: (v: ReactNode) => <>annual mean {v}</>,
    coldRecord: "All-time cold record",
    hotRecord: "All-time heat record",
    heatwave: "The longest heatwave",
    coldsnap: "The longest cold snap",
    daysAbove: (n: number, peak: ReactNode) => (
      <>
        {n} consecutive days above 35°, peak {peak}
      </>
    ),
    daysBelow: (n: number, low: ReactNode) => (
      <>
        {n} consecutive nights below zero, low {low}
      </>
    ),
  },
} as const;

type Ev = {
  key: string;
  sort: string; // ISO date usato per l'ordine cronologico
  label: string; // anno o data mostrata
  kind: "warm" | "cold" | "neutral";
  title: string;
  detail: ReactNode;
};

export function ClimateTimeline({
  records,
  startYear,
  precise,
  name,
  lang = "it",
}: {
  records: Records;
  startYear: number;
  precise: boolean;
  name: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const yearLabel = (y: number) => String(y);

  const events: Ev[] = [
    {
      key: "start",
      sort: `${startYear}-01-01`,
      label: yearLabel(startYear),
      kind: "neutral",
      title: t.start,
      detail: t.startBody,
    },
    {
      key: "coolYear",
      sort: `${records.coolestYear.year}-07-01`,
      label: yearLabel(records.coolestYear.year),
      kind: "cold",
      title: t.coolestYear,
      detail: t.yearMean(<Temp value={records.coolestYear.mean} digits={1} locale={lang} />),
    },
    {
      key: "warmYear",
      sort: `${records.warmestYear.year}-07-01`,
      label: yearLabel(records.warmestYear.year),
      kind: "warm",
      title: t.warmestYear,
      detail: t.yearMean(<Temp value={records.warmestYear.mean} digits={1} locale={lang} />),
    },
  ];

  // Record giornalieri e sequenze: solo dove abbiamo max/min reali.
  if (precise) {
    if (Number.isFinite(records.coldest.value) && records.coldest.date) {
      events.push({
        key: "coldRec",
        sort: records.coldest.date,
        label: fmtDate(records.coldest.date, lang),
        kind: "cold",
        title: t.coldRecord,
        detail: <Temp value={records.coldest.value} digits={1} locale={lang} />,
      });
    }
    if (Number.isFinite(records.hottest.value) && records.hottest.date) {
      events.push({
        key: "hotRec",
        sort: records.hottest.date,
        label: fmtDate(records.hottest.date, lang),
        kind: "warm",
        title: t.hotRecord,
        detail: <Temp value={records.hottest.value} digits={1} locale={lang} />,
      });
    }
    if (records.longestHeatwave && records.longestHeatwave.days > 0) {
      const w = records.longestHeatwave;
      events.push({
        key: "heatwave",
        sort: w.start,
        label: fmtDate(w.start, lang),
        kind: "warm",
        title: t.heatwave,
        detail: t.daysAbove(w.days, <Temp value={w.peak ?? 0} digits={1} locale={lang} />),
      });
    }
    if (records.longestColdSnap && records.longestColdSnap.days > 0) {
      const c = records.longestColdSnap;
      events.push({
        key: "coldsnap",
        sort: c.start,
        label: fmtDate(c.start, lang),
        kind: "cold",
        title: t.coldsnap,
        detail: t.daysBelow(c.days, <Temp value={c.low ?? 0} digits={1} locale={lang} />),
      });
    }
  }

  events.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));

  const dot = (kind: Ev["kind"]) =>
    kind === "warm" ? "#b2182b" : kind === "cold" ? "#2166ac" : "var(--outline)";

  return (
    <section className="m3-card rise p-5 sm:p-6 mb-6">
      <h3 className="text-xl font-extrabold tracking-tight">{t.title}</h3>
      <p className="text-sm text-on-surface-variant mb-5 mt-1 leading-relaxed">{t.subtitle(name)}</p>
      <ol className="relative ml-2 border-l-2 border-[var(--outline-variant)] space-y-5">
        {events.map((ev) => (
          <li key={ev.key} className="relative pl-5">
            <span
              className="absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-2 ring-[var(--surface)]"
              style={{ background: dot(ev.kind) }}
              aria-hidden
            />
            <div className="text-xs font-extrabold text-on-surface-variant tabular-nums">{ev.label}</div>
            <div className="font-bold text-sm leading-tight">{ev.title}</div>
            <div className="text-sm text-on-surface-variant">{ev.detail}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
