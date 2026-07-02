// Temperatura del mare in tempo reale (Open-Meteo Marine API).
// Nota: a differenza dei dati terrestri (ERA5, dal 1940), lo storico marino
// affidabile parte solo da ~2023 — troppo corto per un'analisi di tendenza.
// Per restare precisi mostriamo quindi solo il dato ATTUALE, non un trend.

export type SeaPoint = { slug: string; name: string; lat: number; lon: number };

// Punti scelti in mare aperto, lontano dalle città principali (che sono quasi
// tutte costiere: Genova, Napoli, Bari, Venezia, Palermo, Catania, Cagliari)
// per evitare che il marcatore del mare si sovrapponga a quello di una città.
export const SEA_POINTS: SeaPoint[] = [
  { slug: "tirreno", name: "Mar Tirreno", lat: 40.3, lon: 11.2 },
  { slug: "adriatico", name: "Mar Adriatico", lat: 43.3, lon: 15.2 },
  { slug: "ionio", name: "Mar Ionio", lat: 39.2, lon: 17.9 },
  { slug: "ligure", name: "Mar Ligure", lat: 43.6, lon: 8.4 },
  { slug: "sardegna", name: "Mare di Sardegna", lat: 39.7, lon: 7.9 },
  { slug: "sicilia", name: "Mare di Sicilia", lat: 36.8, lon: 12.8 },
];

// Nomi inglesi dei mari — stesso schema di cityDisplayName in cities.ts.
const SEA_NAME_EN: Record<string, string> = {
  tirreno: "Tyrrhenian Sea",
  adriatico: "Adriatic Sea",
  ionio: "Ionian Sea",
  ligure: "Ligurian Sea",
  sardegna: "Sea of Sardinia",
  sicilia: "Strait of Sicily",
};

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
