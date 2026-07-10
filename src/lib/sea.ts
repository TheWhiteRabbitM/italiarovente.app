// Temperatura del mare di OGGI (Open-Meteo Marine API), dato live.
// Lo storico giornaliero vive altrove: src/data/sea-history.json, generato al
// build da scripts/fetch-sea.mjs e letto da src/lib/seahistory.ts.
//
// A differenza dell'aria (ERA5, dal 1940), la serie marina inizia il
// 2022-11-24: va bene per record della serie, stagionalità e confronti anno su
// anno, mai per una tendenza climatica.

import seasData from "@/data/seas.json";

export type SeaPoint = {
  slug: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
};

// Punti scelti in mare aperto, lontano dalle città principali (che sono quasi
// tutte costiere: Genova, Napoli, Bari, Venezia, Palermo, Catania, Cagliari)
// per evitare che il marcatore del mare si sovrapponga a quello di una città.
// Fonte unica: src/data/seas.json, condiviso con scripts/fetch-sea.mjs.
export const SEA_POINTS: SeaPoint[] = seasData as SeaPoint[];

const SEA_NAME_EN: Record<string, string> = Object.fromEntries(
  SEA_POINTS.map((s) => [s.slug, s.nameEn]),
);

export function seaDisplayName(
  slug: string,
  fallbackName: string,
  lang: "it" | "en" = "it",
): string {
  return lang === "en" ? (SEA_NAME_EN[slug] ?? fallbackName) : fallbackName;
}

export type SeaReading = { slug: string; name: string; temp: number | null };

const MARINE_API = "https://marine-api.open-meteo.com/v1/marine";

export async function getSeaTemps(): Promise<SeaReading[]> {
  const results = await Promise.allSettled(
    SEA_POINTS.map(async (p) => {
      const params = new URLSearchParams({
        latitude: String(p.lat),
        longitude: String(p.lon),
        daily: "sea_surface_temperature_max",
        forecast_days: "1",
        timezone: "Europe/Rome",
      });
      const res = await fetch(`${MARINE_API}?${params}`, {
        next: { revalidate: 60 * 60 * 3 },
      });
      if (!res.ok) throw new Error(`marine ${p.slug}: ${res.status}`);
      const j = await res.json();
      const temp = j?.daily?.sea_surface_temperature_max?.[0] ?? null;
      return { slug: p.slug, name: p.name, temp };
    }),
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { slug: SEA_POINTS[i].slug, name: SEA_POINTS[i].name, temp: null },
  );
}
