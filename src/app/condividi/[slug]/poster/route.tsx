import { ImageResponse } from "next/og";
import { getCity, cityName } from "@/lib/cities";
import { getArchiveStats, getMinMaxWarming } from "@/lib/weather";
import { getRegionPoster } from "@/lib/regionmap";
import { anomalyColor, tempColor, fmtAnomaly, fmtTemp, monthName, type Unit } from "@/lib/format";

export const dynamic = "force-dynamic";

const W = 1080;
const H = 1350;

// Palette per tema. Il tema arriva via query string (?theme=light), stesso
// meccanismo di ?unit= e ?lang=: dark resta il default per compatibilità con
// gli URL già in circolazione. I valori light ricalcano i token del tema
// chiaro del sito (globals.css :root).
const PALETTES = {
  dark: {
    bg: "#29241f",
    text: "#f6efe6",
    subtext: "#d8c9b8",
    faint: "#a89a8a",
    chipBg: "#3a322a",
    cardBg: "#3a322a",
    border: "#544a3f",
    axisBar: "#6a5e51",
    mapFill: "#443b31",
    mapStroke: "#544a3f",
    brand: "#ffab98",
    accentWarm: "#ffab98",
    accentCool: "#b3c5ff",
    dotFill: "#ffffff",
  },
  light: {
    bg: "#f6efe6",
    text: "#29241f",
    subtext: "#6f6459",
    faint: "#8a7a6c",
    chipBg: "#e9ded0",
    cardBg: "#e9ded0",
    border: "#d8c9b8",
    axisBar: "#b3a493",
    mapFill: "#e0d5c5",
    mapStroke: "#c9bba9",
    brand: "#d23a22", // --primary del tema chiaro
    accentWarm: "#d23a22",
    accentCool: "#1d4ed8", // --secondary del tema chiaro
    dotFill: "#29241f",
  },
} as const;

// Stringhe del poster per lingua. La lingua arriva via query string (?lang=en),
// stesso meccanismo dell'unità (?unit=f): le Route Handler non conoscono la
// pagina di provenienza (IT o /en).
const STR = {
  it: {
    subtitle: (from: number, to: number) => `Analisi del clima, ${from}–${to}`,
    warmer: "più calda",
    cooler: "più fredda",
    baselineNormal: (v: string) => `normale 1961–1990: ${v}`,
    recentNormal: (v: string) => `normale 1991–2020: ${v}`,
    trend: (v: string) => `tendenza: ${v}/decennio`,
    monthly: (from: number) => `Climatologia mensile (media ${from}–oggi)`,
    decades: "Anomalia per decennio",
    warmestYears: "Anni più caldi",
    minMax: "Massime e minime: chi si scalda di più?",
    highs: "☀️ MASSIME",
    lows: "🌙 MINIME",
    source: "Fonte: ERA5/ECMWF via Open-Meteo · normale WMO 1961–1990",
  },
  en: {
    subtitle: (from: number, to: number) => `Climate analysis, ${from}–${to}`,
    warmer: "warmer",
    cooler: "cooler",
    baselineNormal: (v: string) => `1961–1990 normal: ${v}`,
    recentNormal: (v: string) => `1991–2020 normal: ${v}`,
    trend: (v: string) => `trend: ${v}/decade`,
    monthly: (from: number) => `Monthly climatology (${from}–today average)`,
    decades: "Anomaly by decade",
    warmestYears: "Warmest years",
    minMax: "Highs and lows: which is warming more?",
    highs: "☀️ HIGHS",
    lows: "🌙 LOWS",
    source: "Source: ERA5/ECMWF via Open-Meteo · WMO 1961–1990 normal",
  },
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const searchParams = new URL(req.url).searchParams;
  const unit: Unit = searchParams.get("unit") === "f" ? "f" : "c";
  const lang = searchParams.get("lang") === "en" ? "en" : "it";
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const P = PALETTES[theme];
  const t = STR[lang];
  const { slug } = await params;
  const city = getCity(slug);
  const archive = city ? getArchiveStats(city) : null;
  const poster = city ? getRegionPoster(slug) : null;

  if (!city || !archive || !poster) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: P.bg,
            color: P.text,
            fontSize: 40,
            fontFamily: "sans-serif",
          }}
        >
          🔥 Italia Rovente
        </div>
      ),
      { width: W, height: H },
    );
  }

  const delta = archive.trend.recentNormal - archive.trend.baselineMean;
  // "accent" (anomalyColor) resta per il riempimento della mappa, dove una
  // scala tarata sulla grandezza dello scarto ha senso. Per il testo serve un
  // colore a contrasto garantito: anomalyColor sfuma verso il quasi bianco
  // per scarti piccoli (es. Cosenza +0.2°C), illeggibile sullo sfondo del poster.
  const accent = anomalyColor(delta, 1.5);
  const textAccent = delta >= 0 ? P.accentWarm : P.accentCool;
  const direction = delta >= 0 ? t.warmer : t.cooler;

  const fullYears = archive.yearly.filter((y) => y.count >= 360);
  const top5 = [...fullYears].sort((a, b) => b.mean - a.mean).slice(0, 5);
  const maxMonthly = Math.max(...archive.monthly.map((m) => m.max));
  const maxDecadeAbs = Math.max(1, ...archive.decades.map((d) => Math.abs(d.anomaly)));
  const minMax = getMinMaxWarming(archive);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: P.bg,
          color: P.text,
          fontFamily: "sans-serif",
          padding: "48px 56px",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: P.brand }}>
            🔥 ITALIA ROVENTE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              color: P.subtext,
              background: P.chipBg,
              padding: "8px 18px",
              borderRadius: 999,
            }}
          >
            {city.region}
          </div>
        </div>

        {/* TITOLO */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800 }}>{cityName(city, lang)}</div>
          <div style={{ display: "flex", fontSize: 24, color: P.subtext, marginTop: 2 }}>
            {t.subtitle(archive.startYear, archive.trend.lastYear)}
          </div>
        </div>

        {/* WARMING STRIPES: la firma visiva del sito, una striscia per anno */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {archive.anomalies.map((a) => (
              <div
                key={a.year}
                style={{
                  display: "flex",
                  flexGrow: 1,
                  height: "100%",
                  background: anomalyColor(a.anomaly, 2),
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{ display: "flex", fontSize: 14, color: P.faint }}>{archive.startYear}</div>
            <div style={{ display: "flex", fontSize: 14, color: P.faint }}>{archive.trend.lastYear}</div>
          </div>
        </div>

        {/* MAPPA REGIONE + STAT PRINCIPALE */}
        <div style={{ display: "flex", marginTop: 18, gap: 30, alignItems: "center" }}>
          <svg
            width={190}
            height={poster.height * (190 / poster.width)}
            viewBox={`0 0 ${poster.width} ${poster.height}`}
          >
            {poster.regions.map((r) => (
              <path
                key={r.name}
                d={r.d}
                fill={r.highlighted ? accent : P.mapFill}
                fillOpacity={r.highlighted ? 0.35 : 1}
                stroke={r.highlighted ? accent : P.mapStroke}
                strokeWidth={r.highlighted ? 2.5 : 1}
              />
            ))}
            <circle cx={poster.cityX} cy={poster.cityY} r={9} fill={P.dotFill} stroke={accent} strokeWidth={4} />
          </svg>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: textAccent, lineHeight: 1 }}>
                {fmtAnomaly(delta, 1, unit, { locale: lang })}
              </div>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>{direction}</div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: P.subtext, marginTop: 10 }}>
              {t.baselineNormal(fmtTemp(archive.trend.baselineMean, 1, unit))}
            </div>
            <div style={{ display: "flex", fontSize: 18, color: P.subtext, marginTop: 2 }}>
              {t.recentNormal(fmtTemp(archive.trend.recentNormal, 1, unit))}
            </div>
            <div style={{ display: "flex", fontSize: 18, color: P.subtext, marginTop: 2 }}>
              {t.trend(fmtAnomaly(archive.trend.perDecade, 2, unit, { locale: lang }))}
            </div>
          </div>
        </div>

        {/* CLIMATOLOGIA MENSILE — altezza e colore dalla media del mese, con valore */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 22 }}>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: P.brand }}>
            {t.monthly(archive.startYear)}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", height: 128, marginTop: 10, gap: 6 }}>
            {archive.monthly.map((m) => (
              <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flex: 1, height: "100%" }}>
                <div style={{ display: "flex", fontSize: 14, color: P.subtext, marginBottom: 4 }}>
                  {fmtTemp(m.mean, 0, unit)}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: Math.max(8, (m.mean / maxMonthly) * 84),
                    background: tempColor(m.mean),
                    borderRadius: 4,
                  }}
                />
                <div style={{ display: "flex", fontSize: 13, color: P.faint, marginTop: 5 }}>
                  {monthName(m.month, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DECENNI (barre divergenti dallo zero) + RECORD */}
        <div style={{ display: "flex", marginTop: 22, gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: P.brand }}>
              {t.decades}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 10, gap: 6 }}>
              {archive.decades.map((d) => (
                <div key={d.decade} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", fontSize: 15, width: 44, color: P.subtext }}>{d.decade}</div>
                  {/* metà sinistra: anomalie negative (barra ancorata al centro) */}
                  <div style={{ display: "flex", flex: 1, height: 15, justifyContent: "flex-end" }}>
                    {d.anomaly < 0 && (
                      <div
                        style={{
                          display: "flex",
                          width: `${Math.max(3, (Math.abs(d.anomaly) / maxDecadeAbs) * 100)}%`,
                          height: "100%",
                          background: anomalyColor(d.anomaly, 2),
                          borderRadius: "8px 0 0 8px",
                        }}
                      />
                    )}
                  </div>
                  {/* asse dello zero */}
                  <div style={{ display: "flex", width: 2, height: 22, background: P.axisBar }} />
                  {/* metà destra: anomalie positive */}
                  <div style={{ display: "flex", flex: 1, height: 15 }}>
                    {d.anomaly >= 0 && (
                      <div
                        style={{
                          display: "flex",
                          width: `${Math.max(3, (d.anomaly / maxDecadeAbs) * 100)}%`,
                          height: "100%",
                          background: anomalyColor(d.anomaly, 2),
                          borderRadius: "0 8px 8px 0",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: "flex", fontSize: 14, width: 52, justifyContent: "flex-end", color: P.subtext }}>
                    {`${fmtAnomaly(d.anomaly, 1, unit, { locale: lang, showUnit: false })}°`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 300 }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: P.brand }}>
              {t.warmestYears}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 10, gap: 6 }}>
              {top5.map((y, i) => (
                <div key={y.year} style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                  <div style={{ display: "flex", color: P.subtext }}>{`${i + 1}. ${y.year}`}</div>
                  {/* Colore fisso (non anomalyColor): quella scala satura verso rossi
                      molto scuri pensati per sfondi chiari, illeggibili come testo su
                      questo sfondo scuro — qui sono comunque tutti "anni caldi". */}
                  <div style={{ display: "flex", fontWeight: 700, color: P.brand }}>
                    {fmtTemp(y.mean, 1, unit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MASSIME VS MINIME */}
        {minMax && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: P.brand }}>
              {t.minMax}
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, background: P.cardBg, borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", fontSize: 16, color: P.faint }}>{t.highs}</div>
                <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: minMax.deltaMax >= 0 ? P.accentWarm : P.accentCool }}>
                  {fmtAnomaly(minMax.deltaMax, 1, unit)}
                </div>
                <div style={{ display: "flex", fontSize: 16, color: P.faint }}>
                  {`${fmtTemp(minMax.baselineMax, 1, unit)} → ${fmtTemp(minMax.recentMax, 1, unit)}`}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, background: P.cardBg, borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", fontSize: 16, color: P.faint }}>{t.lows}</div>
                <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: minMax.deltaMin >= 0 ? P.accentWarm : P.accentCool }}>
                  {fmtAnomaly(minMax.deltaMin, 1, unit)}
                </div>
                <div style={{ display: "flex", fontSize: 16, color: P.faint }}>
                  {`${fmtTemp(minMax.baselineMin, 1, unit)} → ${fmtTemp(minMax.recentMin, 1, unit)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            paddingTop: 20,
            borderTop: `1px solid ${P.border}`,
            fontSize: 16,
            color: P.faint,
          }}
        >
          <span style={{ display: "flex" }}>{t.source}</span>
          <span style={{ display: "flex", fontWeight: 700, color: P.brand }}>italiarovente.app</span>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
