import { ImageResponse } from "next/og";
import { getCity, cityName, cityDisplayName } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";
import { getLifetimeData } from "@/lib/lifetime";
import { anomalyColor } from "@/lib/format";
import { getCuriosity, type CuriosityKind } from "@/lib/curiosities";

// Builder condivisi per le immagini OpenGraph 1200×630 delle pagine
// /condividi/[slug] (IT) e /en/condividi/[slug] (EN): stessa identica
// grafica, cambiano solo le stringhe e il nome città (esonimo inglese).
// I file opengraph-image.tsx sono wrapper sottili attorno a queste funzioni.

export const OG_SIZE = { width: 1200, height: 630 };

type Lang = "it" | "en";

function fallbackImage() {
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
    { ...OG_SIZE },
  );
}

// OG per la condivisione di UNA CITTÀ (non legata a un anno di nascita) —
// stessa metrica del Verdetto ufficiale (normale 1991–2020 vs 1961–1990).
export function cityOgImage(slug: string, lang: Lang) {
  const city = getCity(slug);
  const archive = city ? getArchiveStats(city) : null;

  if (!city || !archive) return fallbackImage();

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
  const footer =
    lang === "en"
      ? `1961–1990 normal: ${archive.trend.baselineMean.toFixed(1)}°C → 1991–2020: ${archive.trend.recentNormal.toFixed(1)}°C`
      : `normale 1961–1990: ${archive.trend.baselineMean.toFixed(1)}°C → 1991–2020: ${archive.trend.recentNormal.toFixed(1)}°C`;
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
          padding: "56px 64px",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#ffab98" }}>
          🔥 ITALIA ROVENTE
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={{ fontSize: 34, color: "#d8c9b8" }}>
            {`${cityName(city, lang)}, ${archive.startYear}–${archive.trend.lastYear}`}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
            <div style={{ fontSize: 150, fontWeight: 800, color: accent, lineHeight: 1 }}>
              {`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}°C`}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{direction}</div>
          </div>
        </div>

        <div style={{ display: "flex", height: 150, marginTop: 30, borderRadius: 16, overflow: "hidden" }}>
          {stripes.map((s) => (
            <div key={s.year} style={{ flex: 1, background: anomalyColor(s.anomaly) }} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 26, color: "#d8c9b8" }}>
          <span>{footer}</span>
          <span style={{ fontWeight: 700, color: "#ffab98" }}>italiarovente.app</span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

// OG per la condivisione di UNA SINGOLA CURIOSITÀ (record estivo, gemello
// climatico, gradi giorno): a differenza di cityOgImage, mostra solo quel
// fatto specifico — non la scheda generale della città — così il link
// condiviso ha davvero un'anteprima coerente col testo del messaggio.
export async function curiosityOgImage(slug: string, kind: CuriosityKind, lang: Lang) {
  const c = await getCuriosity(slug, kind, lang);
  if (!c) return fallbackImage();

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
          padding: "56px 64px",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#ffab98" }}>
          {c.eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={{ fontSize: 34, color: "#d8c9b8" }}>{c.pageTitle}</div>
          <div style={{ fontSize: 110, fontWeight: 800, color: c.bigColor, lineHeight: 1.1, marginTop: 10 }}>
            {c.bigText}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 26, color: "#d8c9b8" }}>
          <span>{c.subLine}</span>
          <span style={{ fontWeight: 700, color: "#ffab98" }}>italiarovente.app</span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

// OG per la condivisione "da quando sei nato" (città + anno di nascita).
export function annoOgImage(slug: string, anno: string, lang: Lang) {
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

  const name = cityDisplayName(city.slug, city.name, lang);
  const title =
    lang === "en" ? `${name}, from ${year} to today` : `${name}, dal ${year} a oggi`;
  const direction =
    lang === "en" ? (warm ? "warmer" : "cooler") : warm ? "più calda" : "più fredda";
  const footer =
    lang === "en"
      ? `${year}: ${thenAvg != null ? thenAvg.toFixed(1) : "–"}°C → today: ${nowAvg != null ? nowAvg.toFixed(1) : "–"}°C`
      : `${year}: ${thenAvg != null ? thenAvg.toFixed(1) : "–"}°C → oggi: ${nowAvg != null ? nowAvg.toFixed(1) : "–"}°C`;

  const stripes = city.years.filter((x) => x.y >= year);

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
          padding: "56px 64px",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#ffab98" }}>
          🔥 ITALIA ROVENTE
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
          <div style={{ fontSize: 34, color: "#d8c9b8" }}>{title}</div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 18,
              marginTop: 6,
            }}
          >
            <div style={{ fontSize: 150, fontWeight: 800, color: accent, lineHeight: 1 }}>
              {`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}°C`}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{direction}</div>
          </div>
        </div>

        {/* stripes */}
        <div style={{ display: "flex", height: 150, marginTop: 30, borderRadius: 16, overflow: "hidden" }}>
          {stripes.map((s) => (
            <div
              key={s.y}
              style={{ flex: 1, background: anomalyColor(s.m - city.baseline) }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 26, color: "#d8c9b8" }}>
          <span>{footer}</span>
          <span style={{ fontWeight: 700, color: "#ffab98" }}>
            italiarovente.app
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
