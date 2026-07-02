// Dataset compatto (medie annue + normale) per il widget "da quando sei nato".
// Costruito dallo snapshot storico precalcolato → leggero, passabile al client.

import { CITIES } from "./cities";
import { getArchiveStats } from "./weather";

export type LifeCity = {
  slug: string;
  name: string;
  zone: string;
  baseline: number; // normale 1961-1990
  recentNormal: number; // normale 1991-2020 — stesso metodo "a due trentenni"
  // usato ovunque sul sito (Verdetto, confronto, poster): mai una media degli
  // ultimi anni, che sarebbe più rumorosa e incoerente col resto del sito.
  years: { y: number; m: number }[]; // media annua (solo anni completi)
};
export type LifetimeData = {
  cities: LifeCity[];
  minYear: number;
  maxYear: number;
};

let cached: LifetimeData | null = null;

export function getLifetimeData(): LifetimeData {
  if (cached) return cached;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const cities: LifeCity[] = [];
  const natByYear = new Map<number, { s: number; n: number }>();

  for (const c of CITIES) {
    const snap = getArchiveStats(c);
    if (!snap) continue;
    const years = snap.yearly
      .filter((y) => y.count >= 360)
      .map((y) => ({ y: y.year, m: r2(y.mean) }));
    cities.push({
      slug: c.slug,
      name: c.name,
      zone: c.zone,
      baseline: r2(snap.trend.baselineMean),
      recentNormal: r2(snap.trend.recentNormal),
      years,
    });
    for (const y of years) {
      const e = natByYear.get(y.y) ?? { s: 0, n: 0 };
      e.s += y.m;
      e.n += 1;
      natByYear.set(y.y, e);
    }
  }

  // Media nazionale (italia) come prima voce
  const half = Math.ceil(cities.length / 2);
  const natYears = [...natByYear.entries()]
    .filter(([, e]) => e.n >= half)
    .map(([y, e]) => ({ y, m: r2(e.s / e.n) }))
    .sort((a, b) => a.y - b.y);
  const base = natYears.filter((x) => x.y >= 1961 && x.y <= 1990);
  const natBaseline = base.length ? r2(base.reduce((s, x) => s + x.m, 0) / base.length) : 0;
  const recent = natYears.filter((x) => x.y >= 1991 && x.y <= 2020);
  const natRecentNormal = recent.length ? r2(recent.reduce((s, x) => s + x.m, 0) / recent.length) : natBaseline;
  cities.unshift({
    slug: "italia",
    name: "Italia (media)",
    zone: "",
    baseline: natBaseline,
    recentNormal: natRecentNormal,
    years: natYears,
  });

  const ys = cities[0].years.map((y) => y.y);
  cached = { cities, minYear: Math.min(...ys), maxYear: Math.max(...ys) };
  return cached;
}
