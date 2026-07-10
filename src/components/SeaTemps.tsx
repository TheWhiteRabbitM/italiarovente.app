import { seaDisplayName, type SeaReading } from "@/lib/sea";
import { tempColor } from "@/lib/format";
import { getSeaRecentMeans, getSeaStats, getSeaHistoryMeta } from "@/lib/seahistory";
import { TrendSparkline } from "./TrendSparkline";
import { Temp } from "./Temp";

const STR = {
  it: {
    title: "Il mare oggi 🌊",
    subtitle: "temperatura superficiale",
    desc: "Dato di oggi (Open-Meteo Marine). La linea sotto ogni riquadro è l'ultimo anno di misure giornaliere, dal nostro archivio.",
    recordLabel: "max",
    archive: (first: string, days: number) =>
      `Archivio giornaliero costruito da noi: ${days.toLocaleString("it-IT")} giorni per mare, dal ${first}. Troppo pochi per una tendenza climatica — per quella servono i dati dell'aria dal 1940.`,
    sparkTitle: (n: number) => `Ultimi ${n} giorni di media giornaliera`,
  },
  en: {
    title: "The sea today 🌊",
    subtitle: "surface temperature",
    desc: "Today's value (Open-Meteo Marine). The line under each tile is the last year of daily measurements, from our own archive.",
    recordLabel: "max",
    archive: (first: string, days: number) =>
      `Daily archive built by us: ${days.toLocaleString("en-US")} days per sea, since ${first}. Far too few for a climate trend — for that you need the air data since 1940.`,
    sparkTitle: (n: number) => `Last ${n} days of daily mean`,
  },
} as const;

function fmtDate(iso: string, lang: "it" | "en"): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SeaTemps({
  readings,
  lang = "it",
}: {
  readings: SeaReading[];
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const valid = readings.filter((r) => r.temp != null);
  if (!valid.length) return null;

  const meta = getSeaHistoryMeta();
  // Copertura dichiarata su un mare qualsiasi: la serie è la stessa per tutti
  // (stesso inizio, stessi buchi della fonte).
  const sample = getSeaStats(readings[0]?.slug ?? "tirreno");

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold tracking-tight">{t.title}</h2>
        <span className="text-xs text-on-surface-variant">{t.subtitle}</span>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">{t.desc}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {readings.map((r) => {
          const spark = getSeaRecentMeans(r.slug, 365);
          const stats = getSeaStats(r.slug);
          return (
            <div
              key={r.slug}
              className="rounded-2xl bg-surface-container-high p-3.5 flex flex-col gap-0.5 min-w-0"
            >
              <div className="text-xs font-bold text-on-surface-variant truncate">
                {seaDisplayName(r.slug, r.name, lang)}
              </div>
              <div
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: tempColor(r.temp) }}
              >
                <Temp value={r.temp} digits={1} locale={lang} />
              </div>
              {spark.length >= 2 ? (
                <div className="mt-1" title={t.sparkTitle(spark.length)}>
                  <TrendSparkline values={spark} color={tempColor(r.temp)} height={30} />
                </div>
              ) : null}
              {stats ? (
                <div className="text-[10px] text-on-surface-variant tabular-nums mt-0.5">
                  {t.recordLabel} <Temp value={stats.warmest.max} digits={1} locale={lang} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {meta && sample ? (
        <p className="text-xs text-on-surface-variant mt-4 leading-relaxed">
          {t.archive(fmtDate(meta.seriesStart, lang), sample.days)}
        </p>
      ) : null}
    </section>
  );
}
