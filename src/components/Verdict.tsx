"use client";

import { fmtAnomaly, fmtTemp } from "@/lib/format";
import { useUnit } from "./UnitProvider";

const STR = {
  it: {
    warming: "Il riscaldamento è confermato",
    cooling: "I dati mostrano un raffreddamento",
    neutral: "Nessuna variazione netta significativa",
    verdictOn: "Verdetto sui dati",
    strengthStrong: "molto robusto",
    strengthClear: "chiaro",
    strengthNoisy: "presente ma più rumoroso",
    intro: (scope: string) => (
      <>
        Confrontando le due <strong>normali climatiche trentennali</strong>{" "}
        (lo standard del WMO), {scope} è passata da una media di
      </>
    ),
    in6190: "nel 1961–1990 a",
    in9120: "nel 1991–2020: una variazione di",
    trendIntro: (firstYear: number, lastYear: number) => (
      <>La tendenza di fondo ({firstYear}–{lastYear}) è di</>
    ),
    perDecadeSuffix: "per decennio",
    ci95Suffix: (margin: string) => <> (±{margin}, intervallo di confidenza al 95%)</>,
    signalSuffix: (strength: string, r2: string) => (
      <> ed è un segnale {strength} (R² = {r2}).</>
    ),
    metricBetweenNormals: "Tra le due normali",
    metricPerDecade: "Per decennio",
    metricPerDecadeSub: (margin: string) => `± ${margin} (IC 95%)`,
    metricReliability: "Affidabilità (R²)",
    metricSeries: "Serie analizzata",
  },
  en: {
    warming: "Warming is confirmed",
    cooling: "The data shows cooling",
    neutral: "No significant net change",
    verdictOn: "Verdict on the data",
    strengthStrong: "very robust",
    strengthClear: "clear",
    strengthNoisy: "present but noisier",
    intro: (scope: string) => (
      <>
        Comparing the two <strong>30-year climate normals</strong>{" "}
        (the WMO standard), {scope} went from an average of
      </>
    ),
    in6190: "in 1961–1990 to",
    in9120: "in 1991–2020: a change of",
    trendIntro: (firstYear: number, lastYear: number) => (
      <>The underlying trend ({firstYear}–{lastYear}) is</>
    ),
    perDecadeSuffix: "per decade",
    ci95Suffix: (margin: string) => <> (±{margin}, 95% confidence interval)</>,
    signalSuffix: (strength: string, r2: string) => (
      <> and is a {strength} signal (R² = {r2}).</>
    ),
    metricBetweenNormals: "Between the two normals",
    metricPerDecade: "Per decade",
    metricPerDecadeSub: (margin: string) => `± ${margin} (95% CI)`,
    metricReliability: "Reliability (R²)",
    metricSeries: "Series analyzed",
  },
} as const;

// Verdetto basato sui dati: confronta le due normali climatiche trentennali
// (1961-1990 vs 1991-2020) e il trend lineare. Linguaggio chiaro per tutti.
export function Verdict({
  scope,
  normalsDelta,
  perDecade,
  ci95,
  r2,
  firstYear,
  lastYear,
  baseline,
  recentNormal,
  lang = "it",
}: {
  scope: string;
  normalsDelta: number; // recentNormal - baseline
  perDecade: number;
  ci95?: number; // margine ± dell'IC al 95% sulla pendenza (stessa unità di perDecade)
  r2: number;
  firstYear: number;
  lastYear: number;
  baseline: number;
  recentNormal: number;
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  const t = STR[lang];
  const ci95Str =
    ci95 != null && Number.isFinite(ci95)
      ? fmtAnomaly(ci95, 2, unit, { locale: lang, showUnit: false }).replace("+", "")
      : null;
  const warming = normalsDelta > 0.1;
  const cooling = normalsDelta < -0.1;
  const headline = warming ? t.warming : cooling ? t.cooling : t.neutral;
  const icon = warming ? "🔥" : cooling ? "❄️" : "➖";
  // Token del tema, non hex fissi: leggibili in entrambi i temi (i rossi/blu
  // "da grafico" non hanno contrasto garantito su sfondo scuro).
  const accent = warming ? "var(--primary)" : cooling ? "var(--secondary)" : "var(--on-surface-variant)";
  const strength =
    r2 > 0.5 ? t.strengthStrong : r2 > 0.25 ? t.strengthClear : t.strengthNoisy;

  return (
    <section
      className="m3-card rise p-6 sm:p-8 mb-6 relative overflow-hidden"
      style={{ borderColor: accent }}
    >
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15 blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative">
        <div className="m3-chip bg-surface-container-high text-on-surface mb-3">
          🔎 {t.verdictOn} · {scope}
        </div>
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: accent }}
        >
          {icon} {headline}
        </h2>
        <p className="mt-3 text-on-surface-variant leading-relaxed max-w-3xl">
          {t.intro(scope)}{" "}
          <strong>{fmtTemp(baseline, 2, unit)}</strong> {t.in6190}{" "}
          <strong>{fmtTemp(recentNormal, 2, unit)}</strong> {t.in9120}{" "}
          <strong style={{ color: accent }}>{fmtAnomaly(normalsDelta, 2, unit, { locale: lang })}</strong>.{" "}
          {t.trendIntro(firstYear, lastYear)}{" "}
          <strong style={{ color: accent }}>
            {fmtAnomaly(perDecade, 2, unit, { locale: lang })} {t.perDecadeSuffix}
          </strong>
          {ci95Str ? t.ci95Suffix(ci95Str) : null}
          {t.signalSuffix(strength, r2.toFixed(2))}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Metric label={t.metricBetweenNormals} value={fmtAnomaly(normalsDelta, 1, unit, { locale: lang })} color={accent} />
          <Metric
            label={t.metricPerDecade}
            value={fmtAnomaly(perDecade, 2, unit, { locale: lang })}
            sub={ci95Str ? t.metricPerDecadeSub(ci95Str) : undefined}
            color={accent}
          />
          <Metric label={t.metricReliability} value={r2.toFixed(2)} color="var(--on-surface-variant)" />
          <Metric label={t.metricSeries} value={`${firstYear}–${lastYear}`} color="var(--on-surface-variant)" />
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-high p-3">
      <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xl font-extrabold tracking-tight" style={{ color }}>
        {value}
      </div>
      {sub ? <div className="text-[11px] text-on-surface-variant mt-0.5">{sub}</div> : null}
    </div>
  );
}
