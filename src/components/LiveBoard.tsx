import Link from "next/link";
import { tempColor, anomalyColor, monthName } from "@/lib/format";
import { Temp } from "./Temp";

export type LiveItem = {
  slug: string;
  name: string;
  temp: number | null;
  anomaly: number | null; // oggi vs media del mese
};

const STR = {
  it: {
    live: "IN DIRETTA",
    todayVsNorm: "Oggi vs la norma",
    caption: (m: string) => (
      <>
        scarto medio di oggi rispetto alla media di <strong>{m}</strong> nelle
        città principali.
      </>
    ),
    hotter: " Oggi è più caldo del solito.",
    cooler: " Oggi è più fresco del solito.",
    ranking: "🔥 La più calda ora",
    liveRanking: "classifica in tempo reale",
  },
  en: {
    live: "LIVE",
    todayVsNorm: "Today vs the norm",
    caption: (m: string) => (
      <>
        today&apos;s average gap vs the <strong>{m}</strong> mean across main
        cities.
      </>
    ),
    hotter: " It's warmer than usual today.",
    cooler: " It's cooler than usual today.",
    ranking: "🔥 The hottest right now",
    liveRanking: "live ranking",
  },
} as const;

export function LiveBoard({
  items,
  month,
  lang = "it",
}: {
  items: LiveItem[];
  month: number;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const ranked = [...items]
    .filter((i) => i.temp != null)
    .sort((a, b) => (b.temp as number) - (a.temp as number));
  const maxTemp = ranked[0]?.temp ?? 1;

  const anoms = items.map((i) => i.anomaly).filter((a): a is number => a != null);
  const natAnom = anoms.length ? anoms.reduce((s, a) => s + a, 0) / anoms.length : null;
  const accent = anomalyColor(natAnom ?? 0, 3);

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] items-start">
      {/* OGGI vs NORMA */}
      <div className="m3-card rise p-6 relative overflow-hidden">
        <div
          className="absolute -right-12 -top-12 w-44 h-44 rounded-full opacity-20 blur-3xl"
          style={{ background: accent }}
          aria-hidden
        />
        <div className="relative">
          <div className="m3-chip bg-surface-container-high text-on-surface mb-3">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" /> {t.live}
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{t.todayVsNorm}</h2>
          <div
            className="text-6xl font-extrabold tracking-tighter mt-3"
            style={{ color: accent }}
          >
            {natAnom != null ? <Temp value={natAnom} digits={1} delta locale={lang} /> : "–"}
          </div>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            {t.caption(monthName(month, lang))}
            {natAnom != null && natAnom > 0 ? t.hotter : natAnom != null ? t.cooler : ""}
          </p>
        </div>
      </div>

      {/* CLASSIFICA LIVE */}
      <div className="m3-card rise p-6">
        <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">
            {t.ranking}
          </h2>
          <span className="text-xs text-on-surface-variant">
            {t.liveRanking}
          </span>
        </div>
        <div className="space-y-1.5">
          {ranked.map((c, i) => {
            const pct = Math.max(8, ((c.temp as number) / maxTemp) * 100);
            const col = tempColor(c.temp);
            return (
              <Link
                key={c.slug}
                href={`${lang === "en" ? "/en" : ""}/citta/${c.slug}`}
                className="flex items-center gap-3 group"
              >
                <span className="w-5 text-sm font-bold text-on-surface-variant text-right">
                  {i + 1}
                </span>
                <span className="w-20 sm:w-24 font-semibold text-sm shrink-0 truncate group-hover:text-primary transition-colors">
                  {c.name}
                </span>
                <div className="flex-1 h-6 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end px-2.5 text-xs font-extrabold text-white transition-all"
                    style={{ width: `${pct}%`, minWidth: "2.75rem", background: col }}
                  >
                    <Temp value={c.temp} digits={0} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
