import Link from "next/link";
import { Temp } from "./Temp";
import { anomalyColor, readableTextOn } from "@/lib/format";
import { ordinalIt, ordinalEn, type MonthlyHighlight as MonthlyHighlightData } from "@/lib/monthlyCompare";

const FULL_MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const FULL_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STR = {
  it: {
    titleNational: "📅 Il mese a confronto",
    titleCity: "📅 Questo mese, qui",
    body: (h: MonthlyHighlightData, scope: string) => {
      const mese = FULL_MONTHS_IT[h.month - 1];
      const rank = ordinalIt(h.rank);
      const kind = h.direction === "hot" ? "più caldo" : "più freddo";
      return (
        <>
          <strong>
            {mese} {h.year}
          </strong>{" "}
          è stato il {rank} {mese} {kind} dal {h.sinceYear} {scope} (su {h.total} anni
          di storico).
        </>
      );
    },
    subtitle: "Rispetto alla normale 1961–1990 dello stesso mese.",
    cta: "Il bollettino mensile completo →",
  },
  en: {
    titleNational: "📅 The month compared",
    titleCity: "📅 This month, here",
    body: (h: MonthlyHighlightData, scope: string) => {
      const mese = FULL_MONTHS_EN[h.month - 1];
      const rank = ordinalEn(h.rank);
      const kind = h.direction === "hot" ? "hottest" : "coldest";
      return (
        <>
          <strong>
            {mese} {h.year}
          </strong>{" "}
          was the {rank} {kind} {mese} since {h.sinceYear} {scope} ({h.total} years of
          records).
        </>
      );
    },
    subtitle: "Compared to the 1961–1990 normal for the same month.",
    cta: "The full monthly bulletin →",
  },
} as const;

export function MonthlyHighlight({
  highlight,
  lang = "it",
  scope,
  variant = "national",
}: {
  highlight: MonthlyHighlightData | null;
  lang?: "it" | "en";
  // "in Italia" / "in Rome" — inserito nella frase, già declinato per lingua.
  scope: string;
  variant?: "national" | "city";
}) {
  const t = STR[lang];
  if (!highlight) return null;
  const bg = anomalyColor(highlight.anomaly, 2);
  const fg = readableTextOn(bg);

  return (
    <section className="m3-card rise p-5 sm:p-6 mb-8 flex items-center gap-4">
      <div
        className="shrink-0 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center font-extrabold tabular-nums"
        style={{ background: bg, color: fg }}
      >
        <span className="text-xs opacity-80">#{highlight.rank}</span>
        <span className="text-sm sm:text-base">
          <Temp value={highlight.anomaly} digits={1} delta locale={lang} />
        </span>
      </div>
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight mb-1">
          {variant === "national" ? t.titleNational : t.titleCity}
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t.body(highlight, scope)}
        </p>
        <p className="text-xs text-on-surface-variant mt-1">{t.subtitle}</p>
        <Link
          href={lang === "en" ? "/en/mese" : "/mese"}
          className="text-sm text-secondary font-semibold hover:underline inline-block mt-2"
        >
          {t.cta}
        </Link>
      </div>
    </section>
  );
}
