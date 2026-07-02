import type { AnomalyPoint } from "@/lib/weather";
import { anomalyColor, fmtAnomaly } from "@/lib/format";

const STR = {
  it: {
    ariaLabel: (first: number, last: number) =>
      `Strisce del riscaldamento dal ${first} al ${last}`,
    tooltip: "rispetto al 1961–1990",
  },
  en: {
    ariaLabel: (first: number, last: number) =>
      `Warming stripes from ${first} to ${last}`,
    tooltip: "vs the 1961–1990 normal",
  },
} as const;

// "Warming stripes": una striscia colorata per anno (blu = più freddo della
// norma 1961-1990, rosso = più caldo). Lettura immediata del riscaldamento.
export function WarmingStripes({
  data,
  height = 110,
  showAxis = true,
  lang = "it",
}: {
  data: AnomalyPoint[];
  height?: number;
  showAxis?: boolean;
  lang?: "it" | "en";
}) {
  if (data.length === 0) return null;
  const t = STR[lang];
  const n = data.length;
  const first = data[0].year;
  const last = data[n - 1].year;

  // tacche decennali
  const ticks = data
    .map((d, i) => ({ year: d.year, i }))
    .filter((t) => t.year % 10 === 0);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${n} 10`}
        preserveAspectRatio="none"
        className="w-full rounded-2xl border border-[var(--outline-variant)]"
        style={{ height }}
        role="img"
        aria-label={t.ariaLabel(first, last)}
      >
        {data.map((d, i) => (
          <rect
            key={d.year}
            x={i}
            y={0}
            width={1.02}
            height={10}
            fill={anomalyColor(d.anomaly)}
          >
            <title>{`${d.year}: ${fmtAnomaly(d.anomaly, 2, "c", { locale: lang })} ${t.tooltip}`}</title>
          </rect>
        ))}
      </svg>
      {showAxis && (
        <div className="relative mt-1 h-4 text-[10px] text-on-surface-variant">
          {ticks.map((t) => (
            <span
              key={t.year}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${((t.i + 0.5) / n) * 100}%` }}
            >
              {t.year}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
