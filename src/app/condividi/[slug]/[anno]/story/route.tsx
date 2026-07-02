import { ImageResponse } from "next/og";
import { getLifetimeData } from "@/lib/lifetime";
import { cityDisplayName } from "@/lib/cities";
import { anomalyColor } from "@/lib/format";

export const dynamic = "force-dynamic";

// Immagine verticale 9:16 pensata per le Instagram/Facebook/WhatsApp Stories.
// Lingua via query string (?lang=en), come l'unità per il poster: le Route
// Handler non conoscono la pagina di provenienza (IT o /en).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; anno: string }> },
) {
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "it";
  const { slug, anno } = await params;
  const data = getLifetimeData();
  const city = data.cities.find((c) => c.slug === slug) ?? data.cities[0];
  const year = Math.max(data.minYear, Math.min(data.maxYear - 1, Number(anno) || 1990));

  const wavg = (a: number, b: number) => {
    const w = city.years.filter((x) => x.y >= a && x.y <= b);
    return w.length ? w.reduce((s, x) => s + x.m, 0) / w.length : null;
  };
  const lastYear = city.years[city.years.length - 1]?.y ?? data.maxYear;
  const thenAvg = wavg(year - 2, year + 2);
  const nowAvg = wavg(lastYear - 4, lastYear);
  const delta = thenAvg != null && nowAvg != null ? nowAvg - thenAvg : 0;
  const warm = delta >= 0;
  const accent = warm ? "#ffab7a" : "#7fb3ff";
  const stripes = city.years.filter((x) => x.y >= year);

  const name = cityDisplayName(city.slug, city.name, lang);
  const title =
    lang === "en" ? `${name}, from ${year} to today` : `${name}, dal ${year} a oggi`;
  const direction =
    lang === "en" ? (warm ? "warmer" : "cooler") : warm ? "più calda" : "più fredda";
  const todayLabel = lang === "en" ? "today" : "oggi";
  const cta =
    lang === "en"
      ? "See how your city's temperature has changed"
      : "Scopri come è cambiata la temperatura della tua città";

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
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 210, fontWeight: 800, color: accent, lineHeight: 1, marginTop: 20 }}>
            {`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}°C`}
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            {direction}
          </div>

          <div style={{ display: "flex", height: 220, marginTop: 60, borderRadius: 24, overflow: "hidden" }}>
            {stripes.map((s) => (
              <div key={s.y} style={{ flex: 1, background: anomalyColor(s.m - city.baseline) }} />
            ))}
          </div>

          <div style={{ display: "flex", fontSize: 34, color: "#d8c9b8", marginTop: 26 }}>
            {`${year}: ${thenAvg != null ? thenAvg.toFixed(1) : "–"}°C  →  ${todayLabel}: ${nowAvg != null ? nowAvg.toFixed(1) : "–"}°C`}
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
