// "L'afa d'estate": quanto è opprimente l'estate percepita e quanto conta
// l'umidità sopra il caldo secco. Usa summerApparent (media giu-ago della
// temperatura percepita massima e della secca massima), disponibile solo per
// le città principali.
//
// Metodo "a due trentenni", identico al resto del sito: confronto tra la
// normale 1991-2020 e la 1961-1990. Mai un anno recente contro il passato.
//
// Onestà del dato: la temperatura percepita è un modello (umidità + vento +
// radiazione), meno solida della secca. E il segnale è modesto — gran parte
// dell'aumento estivo è la secca stessa, l'umidità aggiunge poco e in modo
// rumoroso (verificato: a Milano l'afa cresce solo ~0,8° più della secca fra
// i due trentenni). Il widget lo dice, invece di gonfiare il numero.

import type { SummerApparentPoint } from "./weather";
import { CITIES, cityName } from "./cities";
import { getArchiveStats } from "./weather";

const BASE_FROM = 1961;
const BASE_TO = 1990;
const RECENT_FROM = 1991;
const RECENT_TO = 2020;
// Anni minimi in ciascun trentennio perché la media sia rappresentativa.
const MIN_YEARS = 20;

export type SummerFeels = {
  // Percepita estiva media nei due trentenni, e il delta.
  feelsBaseline: number;
  feelsRecent: number;
  feelsDelta: number;
  // Secca estiva media, stessa struttura: serve a mostrare quanta parte
  // dell'aumento è caldo secco e non umidità.
  dryBaseline: number;
  dryRecent: number;
  dryDelta: number;
  // Scarto percepita-secca (l'"extra" dovuto a umidità/vento) nei due periodi:
  // se cresce, l'afa pesa di più oggi; spesso però è quasi fermo.
  gapBaseline: number;
  gapRecent: number;
  gapDelta: number;
  // Serie annua della percepita estiva, per uno sparkline.
  years: { year: number; feels: number }[];
};

function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function getSummerFeels(
  summerApparent: SummerApparentPoint[] | undefined,
): SummerFeels | null {
  if (!summerApparent?.length) return null;

  const base = summerApparent.filter((p) => p.year >= BASE_FROM && p.year <= BASE_TO);
  const recent = summerApparent.filter((p) => p.year >= RECENT_FROM && p.year <= RECENT_TO);
  if (base.length < MIN_YEARS || recent.length < MIN_YEARS) return null;

  const feelsBaseline = mean(base.map((p) => p.feels));
  const feelsRecent = mean(recent.map((p) => p.feels));
  const dryBaseline = mean(base.map((p) => p.dry));
  const dryRecent = mean(recent.map((p) => p.dry));
  const gapBaseline = feelsBaseline - dryBaseline;
  const gapRecent = feelsRecent - dryRecent;

  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    feelsBaseline: r2(feelsBaseline),
    feelsRecent: r2(feelsRecent),
    feelsDelta: r2(feelsRecent - feelsBaseline),
    dryBaseline: r2(dryBaseline),
    dryRecent: r2(dryRecent),
    dryDelta: r2(dryRecent - dryBaseline),
    gapBaseline: r2(gapBaseline),
    gapRecent: r2(gapRecent),
    gapDelta: r2(gapRecent - gapBaseline),
    years: summerApparent.map((p) => ({ year: p.year, feels: p.feels })),
  };
}

export type SummerFeelsRow = {
  slug: string;
  name: string;
  feelsRecent: number; // percepita estiva media 1991-2020
  dryRecent: number; // secca estiva media 1991-2020
  gapRecent: number; // afa-extra: quanto l'umidità aggiunge oggi
  feelsDelta: number; // crescita della percepita fra i due trentenni
};

// Righe per le classifiche dell'afa. Solo le città con temperatura percepita
// (le principali): l'elenco cresce build dopo build finché non sono tutte
// coperte. Il chiamante dichiara sempre su quante città poggia.
let rankingCache: SummerFeelsRow[] | undefined;
export function getSummerFeelsRanking(): SummerFeelsRow[] {
  if (rankingCache) return rankingCache;
  const rows: SummerFeelsRow[] = [];
  for (const c of CITIES) {
    const snap = getArchiveStats(c);
    const sf = getSummerFeels(snap?.summerApparent);
    if (!sf) continue;
    rows.push({
      slug: c.slug,
      name: cityName(c, "it"),
      feelsRecent: sf.feelsRecent,
      dryRecent: sf.dryRecent,
      gapRecent: sf.gapRecent,
      feelsDelta: sf.feelsDelta,
    });
  }
  rankingCache = rows;
  return rows;
}
