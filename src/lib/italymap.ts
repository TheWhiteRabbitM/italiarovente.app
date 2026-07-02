// Proiezione geografica dell'Italia (lato server, niente d3 nel bundle client).
// Restituisce il contorno come path SVG e le città proiettate in coordinate XY,
// usando la stessa proiezione Mercator → i punti città cadono nel posto giusto.

import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import italyRaw from "@/data/italy.geo.json";
import { MAIN_CITIES, type Zone } from "./cities";
import { SEA_POINTS } from "./sea";

const italy = italyRaw as unknown as FeatureCollection;

export const MAP_W = 620;
export const MAP_H = 720;
const PAD = 24;

export type MapCity = {
  slug: string;
  name: string;
  zone: Zone;
  x: number;
  y: number;
};

export type MapSeaPoint = {
  slug: string;
  name: string;
  x: number;
  y: number;
};

export type ItalyMap = {
  width: number;
  height: number;
  outline: string;
  cities: MapCity[];
  seaPoints: MapSeaPoint[];
};

let cached: ItalyMap | null = null;

export function getItalyMap(): ItalyMap {
  if (cached) return cached;
  const projection = geoMercator().fitExtent(
    [
      [PAD, PAD],
      [MAP_W - PAD, MAP_H - PAD],
    ],
    italy,
  );
  const path = geoPath(projection);
  const outline = path(italy) ?? "";

  const cities: MapCity[] = MAIN_CITIES.map((c) => {
    const xy = projection([c.lon, c.lat]) ?? [0, 0];
    return { slug: c.slug, name: c.name, zone: c.zone, x: xy[0], y: xy[1] };
  });

  const seaPoints: MapSeaPoint[] = SEA_POINTS.map((p) => {
    const xy = projection([p.lon, p.lat]) ?? [0, 0];
    return { slug: p.slug, name: p.name, x: xy[0], y: xy[1] };
  });

  cached = { width: MAP_W, height: MAP_H, outline, cities, seaPoints };
  return cached;
}
