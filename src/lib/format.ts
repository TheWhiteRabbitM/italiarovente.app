// Utility di formattazione e scala colore temperatura.

// Colori semantici centralizzati (coerenza in tutto il sito).
//  hot/cold  -> temperature massime/minime (grafici, record)
//  warm/cool -> sensazione caldo/freddo (voti, zone)
//  anomaly scale (RdBu) e tempColor scale -> vedi funzioni sotto
export const COLORS = {
  hot: "#ef4444",
  cold: "#2563eb",
  warm: "#f97316",
  cool: "#0891b2",
  neutral: "#6c5a52",
} as const;

export type Unit = "c" | "f";

// Conversione Celsius -> Fahrenheit: DUE formule diverse, mai intercambiabili.
//  - Temperatura ASSOLUTA (letture, medie, record): F = C*9/5 + 32
//  - DELTA (anomalia/riscaldamento/tendenza "per decennio"): ΔF = ΔC*9/5,
//    SENZA l'offset di 32 — un delta non ha uno "zero" da spostare.
// fmtTemp usa cToF, fmtAnomaly usa deltaCtoF: non vanno mai scambiate.
function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}
function deltaCtoF(deltaC: number): number {
  return (deltaC * 9) / 5;
}

export function fmtTemp(
  t: number | null | undefined,
  digits = 1,
  unit: Unit = "c",
): string {
  if (t === null || t === undefined || Number.isNaN(t)) return "–";
  const v = unit === "f" ? cToF(t) : t;
  return `${v.toFixed(digits)}°`;
}

export function fmtDateIt(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtDayShort(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" });
}

export function fmtDateEn(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtDayShortEn(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

export function fmtDate(iso: string, lang: "it" | "en" = "it"): string {
  return lang === "en" ? fmtDateEn(iso) : fmtDateIt(iso);
}

const MONTHS_IT = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export function monthName(m: number, lang: "it" | "en" = "it"): string {
  return (lang === "en" ? MONTHS_EN : MONTHS_IT)[(m - 1) % 12];
}

// Scala colore temperatura (blu freddo -> rosso caldo), in stile mappa meteo.
// Restituisce un colore HSL fluido tra -10°C e +40°C.
export function tempColor(t: number | null | undefined): string {
  if (t === null || t === undefined || Number.isNaN(t)) return "#9ca3af";
  const stops: [number, string][] = [
    [-10, "#3b2fb3"],
    [0, "#2563eb"],
    [8, "#06b6d4"],
    [15, "#22c55e"],
    [22, "#eab308"],
    [28, "#f97316"],
    [34, "#ef4444"],
    [42, "#b91c1c"],
  ];
  if (t <= stops[0][0]) return stops[0][1];
  if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (t >= a && t <= b) {
      const f = (t - a) / (b - a);
      return lerpColor(ca, cb, f);
    }
  }
  return stops[stops.length - 1][1];
}

// Scala divergente per ANOMALIE di temperatura (blu = sotto la norma, rosso =
// sopra). Palette in stile "warming stripes" (ColorBrewer RdBu invertita).
// `span` = anomalia (°C) a cui si satura il colore.
export function anomalyColor(a: number | null | undefined, span = 2): string {
  if (a === null || a === undefined || Number.isNaN(a)) return "#cccccc";
  const stops: [number, string][] = [
    [-1, "#053061"],
    [-0.55, "#2166ac"],
    [-0.3, "#4393c3"],
    [-0.12, "#d1e5f0"],
    [0, "#f7f7f7"],
    [0.12, "#fddbc7"],
    [0.3, "#d6604d"],
    [0.55, "#b2182b"],
    [1, "#67001f"],
  ];
  const t = Math.max(-1, Math.min(1, a / span));
  if (t <= stops[0][0]) return stops[0][1];
  if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [x0, c0] = stops[i];
    const [x1, c1] = stops[i + 1];
    if (t >= x0 && t <= x1) return lerpColor(c0, c1, (t - x0) / (x1 - x0));
  }
  return stops[stops.length - 1][1];
}

// Formatta un'anomalia/delta (riscaldamento, tendenza "per decennio", scarto
// min/max, confronto anno-di-nascita...) con segno esplicito. Qualsiasi
// valore "per decennio"/tendenza/pendenza è un DELTA, non una temperatura
// assoluta: converte sempre con deltaCtoF (mai cToF), vedi nota sopra.
export function fmtAnomaly(
  a: number,
  digits = 2,
  unit: Unit = "c",
  opts?: { locale?: "it" | "en"; showUnit?: boolean },
): string {
  const v = unit === "f" ? deltaCtoF(a) : a;
  const unitLabel = opts?.showUnit === false ? "" : `°${unit === "f" ? "F" : "C"}`;
  const s = `${v >= 0 ? "+" : ""}${v.toFixed(digits)}${unitLabel}`;
  return opts?.locale === "it" ? s.replace(".", ",") : s;
}

// Sceglie testo bianco o scuro a seconda della luminanza dello sfondo — usata
// per il testo SOPRA un riempimento anomalyColor (badge/pallini), che vicino
// allo zero è troppo chiaro per il bianco e vicino agli estremi troppo scuro
// per un testo scuro: un colore fisso non garantisce mai contrasto sufficiente.
export function readableTextOn(bgHex: string): string {
  const [r, g, b] = hexToRgb(bgHex).map((v) => v / 255);
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  const contrastWhite = 1.05 / (L + 0.05);
  const contrastDark = (L + 0.05) / 0.05;
  return contrastWhite >= contrastDark ? "#ffffff" : "#241b16";
}

function lerpColor(a: string, b: string, f: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * f);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * f);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * f);
  // Esadecimale, non "rgb(...)": readableTextOn() (e chiunque altro riusi
  // questo colore) si aspetta un hex parsabile da hexToRgb. "rgb(...)" ci
  // passava silenziosamente come NaN, e NaN >= NaN è sempre false in JS —
  // quindi sceglieva sempre il testo scuro, anche su sfondi molto scuri.
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Descrizioni WMO weather code (Open-Meteo).
export function weatherDesc(code: number | null | undefined): {
  label: string;
  icon: string;
} {
  const map: Record<number, { label: string; icon: string }> = {
    0: { label: "Sereno", icon: "☀️" },
    1: { label: "Prevalentemente sereno", icon: "🌤️" },
    2: { label: "Parz. nuvoloso", icon: "⛅" },
    3: { label: "Coperto", icon: "☁️" },
    45: { label: "Nebbia", icon: "🌫️" },
    48: { label: "Nebbia con brina", icon: "🌫️" },
    51: { label: "Pioviggine leggera", icon: "🌦️" },
    53: { label: "Pioviggine", icon: "🌦️" },
    55: { label: "Pioviggine intensa", icon: "🌦️" },
    61: { label: "Pioggia debole", icon: "🌧️" },
    63: { label: "Pioggia", icon: "🌧️" },
    65: { label: "Pioggia forte", icon: "🌧️" },
    71: { label: "Neve debole", icon: "🌨️" },
    73: { label: "Neve", icon: "🌨️" },
    75: { label: "Neve forte", icon: "❄️" },
    80: { label: "Rovesci", icon: "🌦️" },
    81: { label: "Rovesci intensi", icon: "🌧️" },
    82: { label: "Rovesci violenti", icon: "⛈️" },
    95: { label: "Temporale", icon: "⛈️" },
    96: { label: "Temporale con grandine", icon: "⛈️" },
    99: { label: "Temporale forte", icon: "⛈️" },
  };
  return map[code ?? -1] ?? { label: "—", icon: "🌡️" };
}

// English weather descriptions (used by the /en landing page).
export function weatherDescEn(code: number | null | undefined): {
  label: string;
  icon: string;
} {
  const map: Record<number, { label: string; icon: string }> = {
    0: { label: "Clear sky", icon: "☀️" },
    1: { label: "Mostly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Freezing fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy drizzle", icon: "🌦️" },
    61: { label: "Light rain", icon: "🌧️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "🌧️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Snow", icon: "🌨️" },
    75: { label: "Heavy snow", icon: "❄️" },
    80: { label: "Showers", icon: "🌦️" },
    81: { label: "Heavy showers", icon: "🌧️" },
    82: { label: "Violent showers", icon: "⛈️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
    99: { label: "Severe thunderstorm", icon: "⛈️" },
  };
  return map[code ?? -1] ?? { label: "—", icon: "🌡️" };
}
