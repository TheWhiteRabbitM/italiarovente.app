import Link from "next/link";

export type DroughtItem = { slug: string; name: string; dryDays: number; rain30d: number };

const STR = {
  it: {
    title: "Siccità: giorni senza pioggia 🏜️",
    subtitle: "giorni consecutivi con meno di 1 mm di pioggia",
    desc: "Dato live, aggiornato ogni giorno. Include i totali di pioggia degli ultimi 30 giorni per contesto.",
    severity: {
      prolonged: "siccità prolungata",
      veryDry: "molto secco",
      dry: "secco",
      normal: "normale",
    },
  },
  en: {
    title: "Drought: days without rain 🏜️",
    subtitle: "consecutive days with less than 1 mm of rain",
    desc: "Live data, updated daily. Includes 30-day rainfall totals for context.",
    severity: {
      prolonged: "prolonged drought",
      veryDry: "very dry",
      dry: "dry",
      normal: "normal",
    },
  },
} as const;

function severity(
  dryDays: number,
  t: { prolonged: string; veryDry: string; dry: string; normal: string },
): { color: string; label: string } {
  if (dryDays >= 30) return { color: "#b91c1c", label: t.prolonged };
  if (dryDays >= 14) return { color: "#f97316", label: t.veryDry };
  if (dryDays >= 7) return { color: "#eab308", label: t.dry };
  return { color: "#0891b2", label: t.normal };
}

export function DroughtBoard({
  items,
  lang = "it",
}: {
  items: DroughtItem[];
  lang?: "it" | "en";
}) {
  const t = STR[lang] ?? STR.it;
  const ranked = [...items].sort((a, b) => b.dryDays - a.dryDays);
  const maxDry = Math.max(1, ranked[0]?.dryDays ?? 1);

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
      <div className="space-y-1.5">
        {ranked.map((c) => {
          const s = severity(c.dryDays, t.severity);
          const pct = Math.max(6, (c.dryDays / maxDry) * 100);
          return (
            <Link
              key={c.slug}
              href={`${lang === "en" ? "/en" : ""}/citta/${c.slug}`}
              className="flex items-center gap-2.5 group"
              title={s.label}
            >
              <span className="w-20 sm:w-24 font-semibold text-sm shrink-0 truncate group-hover:text-primary transition-colors">
                {c.name}
              </span>
              <div className="flex-1 h-6 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end px-2.5 text-xs font-extrabold text-white transition-all"
                  style={{ width: `${pct}%`, minWidth: "2.75rem", background: s.color }}
                >
                  {lang === "en" ? `${c.dryDays}d` : `${c.dryDays}g`}
                </div>
              </div>
              <span className="w-24 text-right text-xs text-on-surface-variant shrink-0 hidden sm:block">
                {lang === "en" ? `${c.rain30d.toFixed(0)}mm/30d` : `${c.rain30d.toFixed(0)}mm/30g`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
