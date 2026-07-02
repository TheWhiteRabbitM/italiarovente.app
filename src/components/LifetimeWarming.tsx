"use client";

import { useState } from "react";
import type { LifetimeData } from "@/lib/lifetime";
import { CITIES, cityDisplayName } from "@/lib/cities";
import { WarmingStripes } from "./WarmingStripes";
import { anomalyColor, fmtAnomaly, fmtTemp } from "@/lib/format";
import { useUnit } from "./UnitProvider";

const STR = {
  it: {
    badge: "🎂 La tua vita, il tuo clima",
    title: (
      <>
        Quanto è cambiata la temperatura
        <br className="hidden sm:block" /> della tua città da quando sei nato/a?
      </>
    ),
    birthYear: "Anno di nascita:",
    locating: "📍 cerco…",
    myCity: "📍 la mia città",
    place: "Luogo",
    warmer: "più calda",
    cooler: "più fredda",
    comparedTo: (y: number) => `rispetto al ${y}`,
    resultText: (
      cityName: string,
      thenRange: string,
      thenAvg: string,
      nowRange: string,
      nowAvg: string,
      accent: string,
    ) => (
      <>
        A {cityName}, la media <strong>{thenRange}</strong> era{" "}
        <strong>{thenAvg}</strong>; nel <strong>{nowRange}</strong> è{" "}
        <strong style={{ color: accent }}>{nowAvg}</strong>. In una vita il
        clima è cambiato sotto i tuoi occhi.
      </>
    ),
    copied: "✓ Copiato!",
    share: "📲 Condividi il tuo risultato",
    shareTextWarm: (year: number, city: string, delta: string) =>
      `Da quando sono nato/a nel ${year}, ${city} si è scaldata di ${delta} 🔥 Scoprilo tu su Italia Rovente`,
    shareTextCool: (year: number, city: string, delta: string) =>
      `Da quando sono nato/a nel ${year}, ${city} si è raffreddata di ${delta} 🔥 Scoprilo tu su Italia Rovente`,
    shareTextFallback: "Scopri come è cambiata la temperatura della tua città su Italia Rovente 🔥",
  },
  en: {
    badge: "🎂 Your life, your climate",
    title: (
      <>
        How much has the temperature of your city
        <br className="hidden sm:block" /> changed since you were born?
      </>
    ),
    birthYear: "Birth year:",
    locating: "📍 locating…",
    myCity: "📍 my city",
    place: "Place",
    warmer: "warmer",
    cooler: "cooler",
    comparedTo: (y: number) => `compared to ${y}`,
    resultText: (
      cityName: string,
      thenRange: string,
      thenAvg: string,
      nowRange: string,
      nowAvg: string,
      accent: string,
    ) => (
      <>
        In {cityName}, the <strong>{thenRange}</strong> average was{" "}
        <strong>{thenAvg}</strong>; in <strong>{nowRange}</strong> it&apos;s{" "}
        <strong style={{ color: accent }}>{nowAvg}</strong>. In one lifetime,
        the climate has changed before your eyes.
      </>
    ),
    copied: "✓ Copied!",
    share: "📲 Share your result",
    shareTextWarm: (year: number, city: string, delta: string) =>
      `Since I was born in ${year}, ${city} has warmed by ${delta} 🔥 Check yours on Italia Rovente`,
    shareTextCool: (year: number, city: string, delta: string) =>
      `Since I was born in ${year}, ${city} has cooled by ${delta} 🔥 Check yours on Italia Rovente`,
    shareTextFallback: "Discover how your city's temperature has changed on Italia Rovente 🔥",
  },
} as const;

const ZONE_LABEL = {
  it: { Nord: "Nord", Centro: "Centro", Sud: "Sud", Isole: "Isole" },
  en: { Nord: "North", Centro: "Central", Sud: "South", Isole: "Islands" },
} as const;

export function LifetimeWarming({
  data,
  lang = "it",
}: {
  data: LifetimeData;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const { unit } = useUnit();
  const defaultYear = Math.min(1990, data.maxYear - 5);
  const [year, setYear] = useState(defaultYear);
  const [slug, setSlug] = useState("italia");
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(false);

  // Smart: trova la città più vicina alla posizione dell'utente.
  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const avail = new Set(data.cities.map((c) => c.slug));
        let best: { slug: string; d: number } | null = null;
        for (const c of CITIES) {
          if (!avail.has(c.slug)) continue;
          const dLat = c.lat - latitude;
          const dLon = (c.lon - longitude) * Math.cos((latitude * Math.PI) / 180);
          const d = dLat * dLat + dLon * dLon;
          if (!best || d < best.d) best = { slug: c.slug, d };
        }
        if (best) setSlug(best.slug);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const city = data.cities.find((c) => c.slug === slug) ?? data.cities[0];
  const lastYear = city.years[city.years.length - 1]?.y ?? data.maxYear;

  // Media su una finestra di anni (robusta al rumore del singolo anno).
  const windowAvg = (from: number, to: number) => {
    const w = city.years.filter((x) => x.y >= from && x.y <= to);
    return w.length ? { avg: w.reduce((s, x) => s + x.m, 0) / w.length, from: w[0].y, to: w[w.length - 1].y, n: w.length } : null;
  };
  // "Allora": finestra di 5 anni centrata sull'anno di nascita (±2).
  const then = windowAvg(year - 2, year + 2);
  // "Oggi": ultimi 5 anni completi disponibili.
  const now = windowAvg(lastYear - 4, lastYear);
  const thenAvg = then?.avg ?? null;
  const nowAvg = now?.avg ?? null;
  const delta = thenAvg != null && nowAvg != null ? nowAvg - thenAvg : null;

  const stripes = city.years
    .filter((x) => x.y >= year)
    .map((x) => ({ year: x.y, anomaly: x.m - city.baseline }));

  const warm = (delta ?? 0) >= 0;
  const accent = anomalyColor(delta ?? 0, 1.5);

  const cityLabel = cityDisplayName(city.slug, city.name, lang);

  const shareText = delta
    ? warm
      ? t.shareTextWarm(year, cityLabel, fmtAnomaly(delta, 1, unit, { locale: lang }))
      : t.shareTextCool(year, cityLabel, fmtAnomaly(delta, 1, unit, { locale: lang }))
    : t.shareTextFallback;

  async function share() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/condividi/${slug}/${year}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Italia Rovente", text: shareText, url });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* annullato */
    }
  }

  return (
    <section className="m3-card rise p-6 sm:p-8 relative overflow-hidden">
      <div
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mb-3">
          {t.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t.title}
        </h2>

        {/* Controlli */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5 items-stretch sm:items-end">
          <label className="flex-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
              {t.birthYear} <span className="text-on-surface text-sm">{year}</span>
            </span>
            <input
              type="range"
              min={data.minYear}
              max={data.maxYear - 1}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full mt-2 accent-[var(--primary)] cursor-pointer"
            />
          </label>
          <label className="sm:w-48">
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                {t.place}
              </span>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="text-xs font-bold text-secondary hover:underline disabled:opacity-60"
              >
                {locating ? t.locating : t.myCity}
              </button>
            </span>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full mt-2 rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-4 py-2.5 font-semibold text-on-surface cursor-pointer"
            >
              {data.cities
                .filter((c) => !c.zone)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {cityDisplayName(c.slug, c.name, lang)}
                  </option>
                ))}
              {["Nord", "Centro", "Sud", "Isole"].map((z) => {
                const list = data.cities
                  .filter((c) => c.zone === z)
                  .sort((a, b) =>
                    cityDisplayName(a.slug, a.name, lang).localeCompare(
                      cityDisplayName(b.slug, b.name, lang),
                      lang === "en" ? "en" : "it",
                    ),
                  );
                if (!list.length) return null;
                return (
                  <optgroup key={z} label={ZONE_LABEL[lang][z as keyof typeof ZONE_LABEL.it]}>
                    {list.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {cityDisplayName(c.slug, c.name, lang)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
        </div>

        {/* Risultato */}
        <div className="mt-6 grid sm:grid-cols-[auto_1fr] gap-5 items-center">
          <div className="text-center sm:text-left">
            <div
              className="text-6xl sm:text-7xl font-extrabold tracking-tighter leading-none"
              style={{ color: accent }}
            >
              {delta != null ? fmtAnomaly(delta, 1, unit, { locale: lang }) : "–"}
            </div>
            <div className="text-sm text-on-surface-variant mt-1">
              {warm ? t.warmer : t.cooler} {t.comparedTo(year)}
            </div>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {t.resultText(
              cityLabel,
              then ? `${then.from}–${then.to}` : String(year),
              thenAvg != null ? fmtTemp(thenAvg, 1, unit) : "–",
              now ? `${now.from}–${now.to}` : "",
              nowAvg != null ? fmtTemp(nowAvg, 1, unit) : "–",
              accent,
            )}
          </p>
        </div>

        {/* Stripes della tua vita */}
        <div className="mt-5">
          <WarmingStripes data={stripes} height={64} lang={lang} />
        </div>

        <button
          onClick={share}
          className="mt-5 m3-chip bg-primary text-on-primary px-6 py-3 text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          {copied ? t.copied : t.share}
        </button>
      </div>
    </section>
  );
}
