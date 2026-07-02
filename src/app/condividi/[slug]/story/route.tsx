import { ImageResponse } from "next/og";
import { getCity, cityName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { anomalyColor } from "@/lib/format";

export const dynamic = "force-dynamic";

// Immagine verticale 9:16 per le Storie, per la condivisione di UNA CITTÀ
// (non legata a un anno di nascita) — stessa metrica del Verdetto ufficiale.
// Lingua via query string (?lang=en), come l'unità per il poster: le Route
// Handler non conoscono la pagina di provenienza (IT o /en).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "it";
  const { slug } = await params;
  const city = getCity(slug);
  const archive = city ? getArchiveStats(city) : null;

  if (!city || !archive) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#29241f",
            color: "#f6efe6",
            fontSize: 48,
            fontFamily: "sans-serif",
          }}
        >
          🔥 Italia Rovente
        </div>
      ),
      { width: 1080, height: 1920 },
    );
  }

  const delta = archive.trend.recentNormal - archive.trend.baselineMean;
  // Colore fisso per il testo (non anomalyColor): quella scala sfuma verso il
  // quasi bianco per scarti piccoli, illeggibile su questo sfondo scuro.
  const accent = delta >= 0 ? "#ffab98" : "#b3c5ff";
  const direction =
    lang === "en"
      ? delta >= 0
        ? "warmer"
        : "cooler"
      : delta >= 0
        ? "più calda"
        : "più fredda";
  const normalLabel = lang === "en" ? "1961–1990 normal" : "normale 1961–1990";
  const cta =
    lang === "en"
      ? "See how your city's temperature has changed"
      : "Scopri come è cambiata la temperatura della tua città";
  const stripes = archive.anomalies;

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
          padding: "90px 70px",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#ffab98" }}>
          🔥 ITALIA ROVENTE
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 46, color: "#d8c9b8" }}>
            {`${cityName(city, lang)}, ${archive.startYear}–${archive.trend.lastYear}`}
          </div>
          <div style={{ display: "flex", fontSize: 210, fontWeight: 800, color: accent, lineHeight: 1, marginTop: 20 }}>
            {`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}°C`}
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>{direction}</div>

          <div style={{ display: "flex", height: 220, marginTop: 60, borderRadius: 24, overflow: "hidden" }}>
            {stripes.map((s) => (
              <div key={s.year} style={{ flex: 1, background: anomalyColor(s.anomaly) }} />
            ))}
          </div>

          <div style={{ display: "flex", fontSize: 34, color: "#d8c9b8", marginTop: 26 }}>
            {`${normalLabel}: ${archive.trend.baselineMean.toFixed(1)}°C  →  1991–2020: ${archive.trend.recentNormal.toFixed(1)}°C`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#d8c9b8" }}>
            {cta}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#ffab98" }}>
            italiarovente.app
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
