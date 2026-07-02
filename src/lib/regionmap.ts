// Proiezione delle 20 regioni italiane (per il poster condivisibile con la
// regione della città evidenziata). Fonte confini: openpolis/geojson-italy
// (dominio pubblico/open data ISTAT), convertiti da TopoJSON a GeoJSON.
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Feature } from "geojson";
import regionsTopo from "@/data/italy-regions.topo.json";
import { CITIES } from "./cities";

// Tipi minimi per il TopoJSON (il pacchetto topojson-specification non è
// pubblicato su npm: definiamo solo ciò che ci serve da topojson-client).
type TopoTopology = Parameters<typeof feature>[0];
type TopoObject = Parameters<typeof feature>[1];

// Due regioni hanno un nome bilingue nel dataset di origine.
const REGION_ALIASES: Record<string, string> = {
  "Valle d'Aosta": "Valle d'Aosta/Vallée d'Aoste",
  "Trentino-Alto Adige": "Trentino-Alto Adige/Südtirol",
};

export const POSTER_MAP_W = 480;
export const POSTER_MAP_H = 560;
const PAD = 18;

export type RegionPath = { name: string; d: string; highlighted: boolean };
export type RegionPoster = {
  width: number;
  height: number;
  regions: RegionPath[];
  cityX: number;
  cityY: number;
};

let regionsFC: FeatureCollection | null = null;
function getRegionsFC(): FeatureCollection {
  if (regionsFC) return regionsFC;
  const topo = regionsTopo as unknown as TopoTopology;
  const obj = (regionsTopo as unknown as { objects: { regions: TopoObject } }).objects.regions;
  regionsFC = feature(topo, obj) as unknown as FeatureCollection;
  return regionsFC;
}

export function getRegionPoster(citySlug: string): RegionPoster | null {
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return null;

  const fc = getRegionsFC();
  const projection = geoMercator().fitExtent(
    [
      [PAD, PAD],
      [POSTER_MAP_W - PAD, POSTER_MAP_H - PAD],
    ],
    fc,
  );
  const path = geoPath(projection);
  const targetName = REGION_ALIASES[city.region] ?? city.region;

  const regions: RegionPath[] = (fc.features as Feature[]).map((f) => {
    const name = (f.properties as { reg_name?: string })?.reg_name ?? "";
    return { name, d: path(f) ?? "", highlighted: name === targetName };
  });

  const xy = projection([city.lon, city.lat]) ?? [0, 0];
  return { width: POSTER_MAP_W, height: POSTER_MAP_H, regions, cityX: xy[0], cityY: xy[1] };
}
