// Confronto climatico tra città: trova quale altra città monitorata aveva,
// in un decennio passato, la stessa temperatura media annua che questa città
// ha oggi (normale 1991-2020) — un modo concreto di "vedere" il
// riscaldamento: non un'analogia vaga, un numero reale che coincide con un
// altro numero reale. Nota di precisione: confronta la temperatura MEDIA
// ANNUA, non l'intero profilo stagionale (che richiederebbe climatologia
// mensile per decennio, non disponibile) — per questo il testo che lo
// mostra parla di "temperatura media", non genericamente di "clima".
import { CITIES } from "./cities";
import { getArchiveStats } from "./weather";

export type ClimateAnalog = {
  cityName: string;
  citySlug: string;
  decade: number;
  meanThen: number;
  meanNow: number;
  diff: number;
};

// Oltre questa soglia il match non è abbastanza vicino da essere onesto da mostrare.
const MAX_DIFF = 0.3;
// Solo decenni fino agli anni 2000 inclusi: un confronto col passato vero,
// non con una manciata di anni fa.
const DECADE_CUTOFF = 2000;

export function getClimateAnalog(citySlug: string): ClimateAnalog | null {
  const source = CITIES.find((c) => c.slug === citySlug);
  if (!source) return null;
  const archive = getArchiveStats(source);
  if (!archive) return null;
  const target = archive.trend.recentNormal;

  let best: ClimateAnalog | null = null;
  for (const other of CITIES) {
    if (other.slug === citySlug) continue;
    const snap = getArchiveStats(other);
    if (!snap) continue;
    for (const d of snap.decades) {
      if (d.decade > DECADE_CUTOFF) continue;
      const diff = Math.abs(d.mean - target);
      if (!best || diff < best.diff) {
        best = {
          cityName: other.name,
          citySlug: other.slug,
          decade: d.decade,
          meanThen: d.mean,
          meanNow: target,
          diff,
        };
      }
    }
  }
  return best && best.diff <= MAX_DIFF ? best : null;
}

// "anni '90" per i decenni del '900, "anni 2000"/"anni 2010" per i più recenti.
export function fmtDecadeIt(decade: number): string {
  return decade < 2000 ? `anni '${String(decade).slice(-2)}` : `anni ${decade}`;
}

// "the 1990s" / "the 2000s" / "the 2010s" — English equivalent of fmtDecadeIt.
export function fmtDecadeEn(decade: number): string {
  return `the ${decade}s`;
}

export function fmtDecade(decade: number, lang: "it" | "en" = "it"): string {
  return lang === "en" ? fmtDecadeEn(decade) : fmtDecadeIt(decade);
}
