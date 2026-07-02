"use client";

import {
  Area,
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type {
  YearlyPoint,
  MonthlyClim,
  DailyPoint,
  AnomalyPoint,
  DecadePoint,
} from "@/lib/weather";
import {
  tempColor,
  anomalyColor,
  fmtAnomaly,
  fmtTemp,
  monthName,
  fmtDateIt,
  fmtDateEn,
  type Unit,
} from "@/lib/format";
import { useUnit } from "./UnitProvider";

const axisStyle = { fontSize: 11, fill: "var(--on-surface-variant)" };

// Stessa matematica di cToF/deltaCtoF in format.ts, ma per array di dati
// numerici grezzi destinati a Recharts (dataKey/domain), non a stringhe
// formattate: qui serve il numero, non `fmtTemp`/`fmtAnomaly`.
const toAbs = (v: number, unit: Unit) => (unit === "f" ? (v * 9) / 5 + 32 : v);
const toDelta = (v: number, unit: Unit) => (unit === "f" ? (v * 9) / 5 : v);

const CHART_STR = {
  it: {
    year: (y: number | string) => `Anno ${y}`,
    years: (a: number, b: number) => `Anni ${a}–${b}`,
    annualMean: "Media annua",
    mean10y: "Media 10 anni",
    vsBaseline: "vs 1961–1990",
    baselineLabel: (v: string) => `Media 1961–1990: ${v}`,
    trend: "Tendenza",
    anomaly: "Anomalia",
    vsRef: "rispetto a",
    ref6190: "normale 1961–1990",
    anomalyMean: "Anomalia media",
    meanTemp: "Temperatura media",
    heatDays: "Giorni ≥30°",
    tropicalNights: "Notti tropicali ≥20°",
    tropicalNightsLegend: "Notti tropicali",
    maxMean: "Massima media",
    mean: "Media",
    minMean: "Minima media",
    max: "Massima",
    min: "Minima",
    dateLocale: "it-IT" as const,
  },
  en: {
    year: (y: number | string) => `Year ${y}`,
    years: (a: number, b: number) => `Years ${a}–${b}`,
    annualMean: "Annual mean",
    mean10y: "10-year mean",
    vsBaseline: "vs 1961–1990",
    baselineLabel: (v: string) => `1961–1990 mean: ${v}`,
    trend: "Trend",
    anomaly: "Anomaly",
    vsRef: "relative to",
    ref6190: "1961–1990 normal",
    anomalyMean: "Mean anomaly",
    meanTemp: "Mean temperature",
    heatDays: "Days ≥30°",
    tropicalNights: "Tropical nights ≥20°",
    tropicalNightsLegend: "Tropical nights",
    maxMean: "Mean high",
    mean: "Mean",
    minMean: "Mean low",
    max: "High",
    min: "Low",
    dateLocale: "en-US" as const,
  },
} as const;

function TipBox({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div
      style={{
        background: "var(--surface-container-highest)",
        border: "1px solid var(--outline-variant)",
        borderRadius: 16,
        padding: "10px 14px",
        boxShadow: "var(--shadow-lift)",
        color: "var(--on-surface)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
        {title}
      </div>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            fontSize: 12.5,
          }}
        >
          <span style={{ color: r.color ?? "var(--on-surface-variant)" }}>
            {r.label}
          </span>
          <strong>{r.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ---- Trend annuale (media annua) dal 1940 -----------------------------------
export function YearlyTrendChart({
  data,
  baseline,
  lang = "it",
}: {
  data: YearlyPoint[];
  baseline: number;
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  // media mobile a 10 anni (in Celsius, poi convertita in blocco sotto)
  const win = 10;
  const enriched = data.map((d, i) => {
    const start = Math.max(0, i - win + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, x) => s + x.mean, 0) / slice.length;
    const ma = i >= win - 1 ? avg : null;
    return {
      ...d,
      mean: toAbs(d.mean, unit),
      ma: ma !== null ? toAbs(ma, unit) : null,
      meanC: d.mean,
      maC: ma,
    };
  });
  const baselineConv = toAbs(baseline, unit);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={enriched} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="yArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} minTickGap={28} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <ReferenceLine
          y={baselineConv}
          stroke="var(--on-surface-variant)"
          strokeDasharray="5 5"
          label={{
            value: t.baselineLabel(fmtTemp(baseline, 1, unit)),
            position: "insideTopLeft",
            fill: "var(--on-surface-variant)",
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="mean"
          stroke="none"
          fill="url(#yArea)"
          isAnimationActive
        />
        <Line
          type="monotone"
          dataKey="mean"
          stroke="var(--outline)"
          strokeWidth={1}
          dot={false}
          opacity={0.5}
        />
        <Line
          type="monotone"
          dataKey="ma"
          stroke="var(--primary)"
          strokeWidth={3}
          dot={false}
          name={t.mean10y}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as YearlyPoint & { ma: number | null; meanC: number; maC: number | null };
            return (
              <TipBox
                title={t.year(p.year)}
                rows={[
                  { label: t.annualMean, value: fmtTemp(p.meanC, 2, unit), color: tempColor(p.meanC) },
                  { label: t.mean10y, value: p.maC !== null ? fmtTemp(p.maC, 2, unit) : "–" },
                  { label: t.vsBaseline, value: fmtAnomaly(p.meanC - baseline, 2, unit, { locale: lang }) },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Anomalie annue rispetto al 1961-1990 (rosso/blu) ----------------------
export function AnomalyBarChart({ data, lang = "it" }: { data: AnomalyPoint[]; lang?: "it" | "en" }) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  // retta di tendenza sulle anomalie (in Celsius)
  const n = data.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const d of data) {
    sx += d.year; sy += d.anomaly; sxx += d.year * d.year; sxy += d.year * d.anomaly;
  }
  const denom = n * sxx - sx * sx;
  const slope = denom ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;
  const enriched = data.map((d) => ({
    ...d,
    anomalyC: d.anomaly,
    anomaly: toDelta(d.anomaly, unit),
    trend: toDelta(slope * d.year + intercept, unit),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={enriched} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} minTickGap={28} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <ReferenceLine y={0} stroke="var(--on-surface-variant)" strokeWidth={1.5} />
        <Bar dataKey="anomaly" isAnimationActive>
          {enriched.map((d) => (
            <Cell key={d.year} fill={anomalyColor(d.anomalyC)} />
          ))}
        </Bar>
        <Line
          type="monotone"
          dataKey="trend"
          stroke="var(--on-surface)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={false}
          name={t.trend}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-container-high)", opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as AnomalyPoint & { anomalyC: number };
            return (
              <TipBox
                title={t.year(p.year)}
                rows={[
                  {
                    label: t.anomaly,
                    value: fmtAnomaly(p.anomalyC, 2, unit, { locale: lang }),
                    color: p.anomalyC >= 0 ? "var(--primary)" : "var(--secondary)",
                  },
                  { label: t.vsRef, value: t.ref6190 },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Medie decennali (anomalia per decennio) -------------------------------
export function DecadeBars({ data, lang = "it" }: { data: DecadePoint[]; lang?: "it" | "en" }) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  const d = data.map((x) => ({
    ...x,
    label: `${x.decade}`,
    anomalyC: x.anomaly,
    meanC: x.mean,
    anomaly: toDelta(x.anomaly, unit),
    mean: toAbs(x.mean, unit),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={d} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <ReferenceLine y={0} stroke="var(--on-surface-variant)" strokeWidth={1.5} />
        <Bar dataKey="anomaly" radius={[8, 8, 0, 0]} isAnimationActive>
          {d.map((x) => (
            <Cell key={x.decade} fill={anomalyColor(x.anomalyC)} />
          ))}
        </Bar>
        <Tooltip
          cursor={{ fill: "var(--surface-container-high)", opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as DecadePoint & { anomalyC: number; meanC: number };
            return (
              <TipBox
                title={t.years(p.decade, p.decade + 9)}
                rows={[
                  {
                    label: t.anomalyMean,
                    value: fmtAnomaly(p.anomalyC, 2, unit, { locale: lang }),
                    color: p.anomalyC >= 0 ? "var(--primary)" : "var(--secondary)",
                  },
                  { label: t.meanTemp, value: fmtTemp(p.meanC, 2, unit) },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Giorni roventi & notti tropicali --------------------------------------
export function HeatDaysChart({
  data,
  lang = "it",
}: {
  data: { year: number; hd?: number; tn?: number }[];
  lang?: "it" | "en";
}) {
  const t = CHART_STR[lang];
  // Conteggi di giorni/notti, non temperature: nessuna conversione F necessaria.
  const d = data
    .filter((x) => x.hd != null)
    .map((x) => ({ year: x.year, hd: x.hd ?? 0, tn: x.tn ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={d} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} minTickGap={28} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={34} />
        <Bar dataKey="hd" fill="#f97316" radius={[3, 3, 0, 0]} name={t.heatDays} isAnimationActive />
        <Line type="monotone" dataKey="tn" stroke="#b2182b" strokeWidth={2.5} dot={false} name={t.tropicalNightsLegend} />
        <Tooltip
          cursor={{ fill: "var(--surface-container-high)", opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { hd: number; tn: number };
            return (
              <TipBox
                title={t.year(label as number)}
                rows={[
                  { label: t.heatDays, value: `${p.hd}`, color: "#f97316" },
                  { label: t.tropicalNights, value: `${p.tn}`, color: "#b2182b" },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Climatologia mensile ---------------------------------------------------
export function MonthlyClimChart({ data, lang = "it" }: { data: MonthlyClim[]; lang?: "it" | "en" }) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  const d = data.map((m) => ({
    ...m,
    label: monthName(m.month, lang),
    maxC: m.max,
    meanC: m.mean,
    minC: m.min,
    max: toAbs(m.max, unit),
    mean: toAbs(m.mean, unit),
    min: toAbs(m.min, unit),
  }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={d} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="mBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2.5} fill="url(#mBand)" />
        <Area type="monotone" dataKey="min" stroke="#2563eb" strokeWidth={2.5} fill="var(--surface-container)" />
        <Line type="monotone" dataKey="mean" stroke="var(--on-surface)" strokeWidth={2} strokeDasharray="4 3" dot={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as MonthlyClim & { label: string; maxC: number; meanC: number; minC: number };
            return (
              <TipBox
                title={p.label}
                rows={[
                  { label: t.maxMean, value: fmtTemp(p.maxC, 1, unit), color: "#ef4444" },
                  { label: t.mean, value: fmtTemp(p.meanC, 1, unit) },
                  { label: t.minMean, value: fmtTemp(p.minC, 1, unit), color: "#2563eb" },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Andamento giornaliero recente -----------------------------------------
export function RecentDailyChart({ data, lang = "it" }: { data: DailyPoint[]; lang?: "it" | "en" }) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  const nullableToAbs = (v: number | null | undefined) =>
    v === null || v === undefined ? v : toAbs(v, unit);
  const d = data.map((p) => ({
    ...p,
    maxC: p.max,
    meanC: p.mean,
    minC: p.min,
    max: nullableToAbs(p.max),
    mean: nullableToAbs(p.mean),
    min: nullableToAbs(p.min),
  }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={d} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="dArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString(t.dateLocale, { month: "short", year: "2-digit" })
          }
        />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} fill="url(#dArea)" />
        <Area type="monotone" dataKey="min" stroke="#2563eb" strokeWidth={1.5} fill="var(--surface-container)" fillOpacity={0.4} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as DailyPoint & { maxC: number | null; meanC: number | null; minC: number | null };
            return (
              <TipBox
                title={lang === "en" ? fmtDateEn(p.date) : fmtDateIt(p.date)}
                rows={[
                  { label: t.max, value: fmtTemp(p.maxC, 1, unit), color: "#ef4444" },
                  { label: t.mean, value: fmtTemp(p.meanC, 1, unit) },
                  { label: t.min, value: fmtTemp(p.minC, 1, unit), color: "#2563eb" },
                ]}
              />
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Confronto città (media annua multipla) --------------------------------
export const PALETTE = [
  "#ef4444", "#2563eb", "#16a34a", "#f97316", "#7c3aed", "#0891b2",
  "#db2777", "#65a30d", "#ca8a04", "#0d9488", "#9333ea", "#dc2626",
];

// ---- Confronto ANOMALIE multi-città (1940 -> oggi), baseline comune a 0 -----
export function AnomalyCompareChart({
  series,
  lang = "it",
}: {
  series: { name: string; data: { year: number; anomaly: number }[] }[];
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  const years = new Set<number>();
  series.forEach((s) => s.data.forEach((d) => years.add(d.year)));
  const rows = [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const row: Record<string, number> = { year };
      series.forEach((s) => {
        const m = s.data.find((d) => d.year === year);
        if (m) row[s.name] = toDelta(m.anomaly, unit);
      });
      return row;
    });

  return (
    <ResponsiveContainer width="100%" height={440}>
      <ComposedChart data={rows} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} minTickGap={28} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        <ReferenceLine
          y={0}
          stroke="var(--on-surface-variant)"
          strokeWidth={1.5}
          label={{ value: t.ref6190, position: "insideTopLeft", fill: "var(--on-surface-variant)", fontSize: 10 }}
        />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
            opacity={0.85}
          />
        ))}
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const rows2 = payload
              .filter((p) => p.value != null)
              .sort((a, b) => (b.value as number) - (a.value as number))
              .map((p) => ({
                label: p.dataKey as string,
                value: fmtAnomaly(p.value as number, 1, unit, { locale: lang }),
                color: p.color,
              }));
            return <TipBox title={t.year(label ?? "")} rows={rows2} />;
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function CompareChart({
  series,
  lang = "it",
}: {
  series: { name: string; data: { year: number; mean: number }[] }[];
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  const t = CHART_STR[lang];
  // unisci per anno
  const years = new Set<number>();
  series.forEach((s) => s.data.forEach((d) => years.add(d.year)));
  const rows = [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const row: Record<string, number> = { year };
      series.forEach((s) => {
        const m = s.data.find((d) => d.year === year);
        if (m) row[s.name] = toAbs(m.mean, unit);
      });
      return row;
    });

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={rows} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" vertical={false} />
        <XAxis dataKey="year" tick={axisStyle} minTickGap={28} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} unit="°" axisLine={false} tickLine={false} width={44} />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2.4}
            dot={false}
            connectNulls
          />
        ))}
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const rows2 = payload
              .filter((p) => p.value != null)
              .sort((a, b) => (b.value as number) - (a.value as number))
              .map((p) => ({
                label: p.dataKey as string,
                value: fmtTemp(p.value as number, 2, unit),
                color: p.color,
              }));
            return <TipBox title={t.year(label ?? "")} rows={rows2} />;
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
