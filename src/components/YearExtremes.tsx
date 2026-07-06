import { Temp } from "./Temp";
import { anomalyColor, readableTextOn } from "@/lib/format";

const STR = {
  it: {
    title: "🏆 Gli anni più estremi",
    subtitle:
      "Media nazionale annua (tutte le città monitorate), anomalia rispetto alla normale 1961–1990 — stessa serie usata per le warming stripes.",
    hottestTitle: "🔥 I più caldi in assoluto",
    coldestTitle: "❄️ I più freddi in assoluto",
  },
  en: {
    title: "🏆 The most extreme years",
    subtitle:
      "National annual average (all monitored cities), anomaly vs. the 1961–1990 normal — the same series behind the warming stripes.",
    hottestTitle: "🔥 The hottest on record",
    coldestTitle: "❄️ The coldest on record",
  },
} as const;

function anomalyHex(a: number): string {
  return anomalyColor(a, 1.5);
}

function Row({ rank, year, anomaly }: { rank: number; year: number; anomaly: number }) {
  const bg = anomalyHex(anomaly);
  return (
    <div className="m3-card p-3 flex items-center gap-3">
      <span className="w-5 text-right text-xs font-extrabold text-on-surface-variant tabular-nums shrink-0">
        {rank}
      </span>
      <div className="font-extrabold text-base tabular-nums flex-1">{year}</div>
      <div
        className="rounded-xl px-2.5 py-1 text-xs font-extrabold tabular-nums shrink-0"
        style={{ background: bg, color: readableTextOn(bg) }}
      >
        <Temp value={anomaly} digits={2} delta />
      </div>
    </div>
  );
}

export function YearExtremes({
  years,
  baseline,
  lang = "it",
}: {
  years: { y: number; m: number }[];
  baseline: number;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  if (years.length < 10) return null;

  const withAnomaly = years.map((y) => ({ year: y.y, anomaly: Math.round((y.m - baseline) * 100) / 100 }));
  const hottest = [...withAnomaly].sort((a, b) => b.anomaly - a.anomaly).slice(0, 5);
  const coldest = [...withAnomaly].sort((a, b) => a.anomaly - b.anomaly).slice(0, 5);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-center">{t.title}</h2>
      <p className="text-sm text-on-surface-variant text-center max-w-xl mx-auto mb-5">{t.subtitle}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-2 text-center">{t.hottestTitle}</h3>
          <div className="space-y-2">
            {hottest.map((y, i) => (
              <Row key={y.year} rank={i + 1} year={y.year} anomaly={y.anomaly} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-2 text-center">{t.coldestTitle}</h3>
          <div className="space-y-2">
            {coldest.map((y, i) => (
              <Row key={y.year} rank={i + 1} year={y.year} anomaly={y.anomaly} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
