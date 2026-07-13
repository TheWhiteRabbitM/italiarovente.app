import Link from "next/link";
import { cityDisplayName, slugifyRegion } from "@/lib/cities";
import { Temp } from "./Temp";
import { anomalyColor, readableTextOn } from "@/lib/format";
import type { CityRanking, RankedCity } from "@/lib/ranking";

const STR = {
  it: {
    title: "📊 Dove si colloca in classifica",
    // "è la 2ª città che si scalda più in fretta in Italia (su 107)"
    lead: (name: string, rank: string, total: number) => (
      <>
        <strong>{name}</strong> è la <strong>{rank} città</strong> che si scalda più in fretta in
        Italia, su {total} monitorate.
      </>
    ),
    region: (rank: string, region: string, total: number) => (
      <>
        In {region} è {rank} su {total}.
      </>
    ),
    faster: "Si scalda più in fretta di",
    slower: "Meno in fretta di",
    seeAll: "Vedi la classifica completa →",
    compareLabel: "confronta",
  },
  en: {
    title: "📊 Where it ranks",
    lead: (name: string, rank: string, total: number) => (
      <>
        <strong>{name}</strong> is the <strong>{rank} fastest-warming city</strong> in Italy, out of
        {" "}
        {total} monitored.
      </>
    ),
    region: (rank: string, region: string, total: number) => (
      <>
        Within {region} it&apos;s {rank} of {total}.
      </>
    ),
    faster: "Warming faster than",
    slower: "Slower than",
    seeAll: "See the full ranking →",
    compareLabel: "compare",
  },
} as const;

function ordinal(n: number, lang: "it" | "en"): string {
  if (lang === "it") return `${n}ª`;
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function NeighborRow({
  label,
  city,
  lang,
}: {
  label: string;
  city: RankedCity;
  lang: "it" | "en";
}) {
  const base = lang === "en" ? "/en" : "";
  const bg = anomalyColor(city.warming, 1.5);
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-xs text-on-surface-variant shrink-0 w-32 sm:w-40">{label}</span>
      <Link
        href={`${base}/citta/${city.slug}`}
        className="font-semibold hover:text-primary transition-colors truncate"
      >
        {cityDisplayName(city.slug, city.name, lang)}
      </Link>
      <span
        className="ml-auto rounded-lg px-2 py-0.5 text-xs font-extrabold tabular-nums shrink-0"
        style={{ background: bg, color: readableTextOn(bg) }}
      >
        <Temp value={city.warming} digits={1} delta locale={lang} />
      </span>
    </div>
  );
}

export function CityContext({
  ranking,
  name,
  region,
  lang = "it",
}: {
  ranking: CityRanking;
  name: string;
  region: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  const rankStr = ordinal(ranking.rank, lang);
  const regionRankStr = ordinal(ranking.regionRank, lang);

  return (
    <section className="m3-card rise p-5 sm:p-6 mb-8">
      <h2 className="text-lg font-extrabold tracking-tight mb-2">{t.title}</h2>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-1">
        {t.lead(name, rankStr, ranking.total)}
      </p>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        {ranking.regionTotal > 1 ? (
          <Link href={`${base}/regioni/${slugifyRegion(region)}`} className="hover:text-primary transition-colors">
            {t.region(regionRankStr, region, ranking.regionTotal)}
          </Link>
        ) : null}
      </p>

      <div className="space-y-2 mb-4">
        {ranking.above ? <NeighborRow label={t.faster} city={ranking.above} lang={lang} /> : null}
        {ranking.below ? <NeighborRow label={t.slower} city={ranking.below} lang={lang} /> : null}
      </div>

      <Link
        href={`${base}/classifiche`}
        className="text-sm text-secondary font-semibold hover:underline"
      >
        {t.seeAll}
      </Link>
    </section>
  );
}
