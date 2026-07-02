import { ImageResponse } from "next/og";
import { getLifetimeData } from "@/lib/lifetime";
import { CITIES } from "@/lib/cities";

export const OG_HOME_SIZE = { width: 1200, height: 630 };
export const OG_HOME_CONTENT_TYPE = "image/png";

export const OG_HOME_ALT: Record<"it" | "en", string> = {
  it: "Italia Rovente — Come è cambiata la temperatura in Italia dal 1940",
  en: "Italia Rovente — How Italy's temperature has changed since 1940",
};

const STRIPES = [
  "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7",
  "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f",
];

const STRINGS = {
  it: {
    title: "Come è cambiata la temperatura in Italia?",
    warmer: "più calda",
    cooler: "più fredda",
    footer: (cityCount: number) =>
      `rispetto alla media 1961–1990 · ${cityCount} città · dati ERA5/ECMWF dal 1940`,
    // Decimal COMMA for Italian numbers.
    formatDelta: (v: number) => v.toFixed(1).replace(".", ","),
  },
  en: {
    title: "How much has Italy warmed since 1940?",
    warmer: "warmer",
    cooler: "cooler",
    footer: (cityCount: number) =>
      `vs the 1961–1990 normal · ${cityCount} cities · ERA5/ECMWF data since 1940`,
    // Decimal POINT for English numbers.
    formatDelta: (v: number) => v.toFixed(1),
  },
} as const;

export function homeOgImage(lang: "it" | "en") {
  const t = STRINGS[lang];

  let warming = 1.0;
  try {
    const data = getLifetimeData();
    const it = data.cities.find((c) => c.slug === "italia") ?? data.cities[0];
    // Stesso metodo "a due trentenni" (1991-2020 vs 1961-1990) usato ovunque
    // sul sito: mai una media degli ultimi anni, che darebbe un numero diverso
    // da quello mostrato sulla home.
    warming = Math.round((it.recentNormal - it.baseline) * 10) / 10;
  } catch {
    /* fallback */
  }
  const deltaStr = `${warming >= 0 ? "+" : ""}${t.formatDelta(warming)}°C`;
  // Colore fisso per il testo (non anomalyColor): quella scala non ha
  // contrasto garantito su questo sfondo scuro, specie per scarti piccoli.
  const accent = warming >= 0 ? "#ffab98" : "#b3c5ff";
  const directionLabel = warming >= 0 ? t.warmer : t.cooler;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#29241f",
          color: "#f6efe6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", height: 90 }}>
          {STRIPES.concat([...STRIPES].reverse()).map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 70px",
          }}
        >
          <div style={{ fontSize: 30, color: "#ffab98", fontWeight: 700 }}>
            🔥 ITALIA ROVENTE
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, marginTop: 14, color: "#d8c9b8" }}>
            {t.title}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 6 }}>
            <div style={{ fontSize: 150, fontWeight: 800, color: accent, lineHeight: 1 }}>
              {deltaStr}
            </div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{directionLabel}</div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#d8c9b8", marginTop: 16 }}>
            {t.footer(CITIES.length)}
          </div>
        </div>
      </div>
    ),
    { ...OG_HOME_SIZE },
  );
}
