import { seaDisplayName, type SeaReading } from "@/lib/sea";
import { tempColor } from "@/lib/format";
import { Temp } from "./Temp";

const STR = {
  it: {
    title: "Il mare oggi 🌊",
    subtitle: "temperatura superficiale in tempo reale",
    desc: "Dato live (Open-Meteo Marine). A differenza delle temperature dell'aria, lo storico marino affidabile è troppo corto per calcolare un trend — qui mostriamo solo il valore di oggi.",
  },
  en: {
    title: "The sea today 🌊",
    subtitle: "live surface temperature",
    desc: "Live data (Open-Meteo Marine). Unlike air temperatures, reliable marine history is too short to compute a trend — here we only show today's value.",
  },
} as const;

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

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t.title}
        </h2>
        <span className="text-xs text-on-surface-variant">
          {t.subtitle}
        </span>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">
        {t.desc}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {readings.map((r) => (
          <div
            key={r.slug}
            className="rounded-2xl bg-surface-container-high p-3.5 flex flex-col gap-0.5"
          >
            <div className="text-xs font-bold text-on-surface-variant truncate">
              {seaDisplayName(r.slug, r.name, lang)}
            </div>
            <div
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: tempColor(r.temp) }}
            >
              <Temp value={r.temp} digits={1} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
