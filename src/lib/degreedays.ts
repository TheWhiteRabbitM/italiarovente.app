// "Gradi giorno" (GG): l'indicatore ufficiale italiano (DPR 412/93) del
// fabbisogno di riscaldamento di un edificio, usato anche per classificare i
// comuni in zone climatiche A-F. Somma, per ogni giorno dell'anno con
// temperatura media sotto 20°C, la differenza (20 - temperatura media).
// Qui è approssimato dalla climatologia mensile già disponibile (nessun
// nuovo fetch): giorni_nel_mese × max(0, 20 - media_mensile).
import type { MonthlyClim } from "./weather";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const GG_BASE = 20;

export function gradiGiorno(monthly: MonthlyClim[]): number | null {
  if (!monthly || monthly.length < 12) return null;
  let gg = 0;
  for (const m of monthly) {
    const days = DAYS_IN_MONTH[m.month - 1] ?? 30;
    gg += Math.max(0, GG_BASE - m.mean) * days;
  }
  return Math.round(gg);
}

export type GgZone = "A" | "B" | "C" | "D" | "E" | "F";

// Soglie ufficiali DPR 412/93 (zone climatiche italiane).
export function ggZone(gg: number): GgZone {
  if (gg <= 600) return "A";
  if (gg <= 900) return "B";
  if (gg <= 1400) return "C";
  if (gg <= 2100) return "D";
  if (gg <= 3000) return "E";
  return "F";
}
