// Elenco città (fonte unica: src/data/cities.json, condiviso con lo script di
// generazione dello storico). `main: true` = città principali (mostrate in home).

import citiesData from "@/data/cities.json";

export type Zone = "Nord" | "Centro" | "Sud" | "Isole";

export type City = {
  slug: string;
  name: string;
  region: string;
  zone: Zone;
  lat: number;
  lon: number;
  main: boolean;
};

export const CITIES: City[] = citiesData as City[];

// Città principali (home: mappa + card)
export const MAIN_CITIES: City[] = CITIES.filter((c) => c.main);

export const ZONES: Zone[] = ["Nord", "Centro", "Sud", "Isole"];

// Le 20 regioni italiane rappresentate nel dataset (una o più città ciascuna).
export const REGIONS: string[] = [...new Set(CITIES.map((c) => c.region))].sort(
  (a, b) => a.localeCompare(b, "it"),
);

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

// Esonimi inglesi noti (solo le città con un nome inglese davvero diffuso in
// ricerca/uso comune — tutte le altre restano col nome italiano anche nelle
// pagine EN, es. "Bergamo" resta "Bergamo").
const CITY_NAME_EN: Record<string, string> = {
  roma: "Rome",
  napoli: "Naples",
  firenze: "Florence",
  torino: "Turin",
  venezia: "Venice",
  milano: "Milan",
  genova: "Genoa",
  padova: "Padua",
};

export function cityName(city: City, lang: "it" | "en" = "it"): string {
  return lang === "en" ? (CITY_NAME_EN[city.slug] ?? city.name) : city.name;
}

// Come cityName(), ma per dataset più leggeri (es. src/lib/lifetime.ts) che
// portano solo slug+name, non l'intero oggetto City. Gestisce anche lo slug
// speciale "italia" (media nazionale sintetica) usato dal widget "da quando
// sei nato" e dalla hero.
export function cityDisplayName(
  slug: string,
  fallbackName: string,
  lang: "it" | "en" = "it",
): string {
  if (slug === "italia") return lang === "en" ? "Italy (average)" : "Italia (media)";
  return lang === "en" ? (CITY_NAME_EN[slug] ?? fallbackName) : fallbackName;
}

export function slugifyRegion(region: string): string {
  return region
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCitiesByRegionSlug(regionSlug: string): { region: string; cities: City[] } | null {
  const region = REGIONS.find((r) => slugifyRegion(r) === regionSlug);
  if (!region) return null;
  return { region, cities: CITIES.filter((c) => c.region === region) };
}
