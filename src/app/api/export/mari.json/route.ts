import { SEA_POINTS } from "@/lib/sea";
import { getSeaDays, getSeaHistoryMeta } from "@/lib/seahistory";
import { SITE_URL } from "@/lib/site";
import { publicHeaders, SITE_LICENSE } from "@/lib/publicapi";

export const revalidate = 3600;


// L'archivio giornaliero della temperatura superficiale del mare, per intero.
// Formato lungo (una riga per giorno) invece degli array paralleli usati per
// lo storage: chi consuma l'API non deve ricostruire le date da un offset.
//
// I giorni mancanti nella fonte non compaiono affatto: preferiamo un buco
// visibile a un valore interpolato che sembra una misura.
export async function GET() {
  const meta = getSeaHistoryMeta();

  const seas = SEA_POINTS.map((p) => {
    const days = getSeaDays(p.slug);
    return {
      slug: p.slug,
      name: p.name,
      name_en: p.nameEn,
      lat: p.lat,
      lon: p.lon,
      days: days.length,
      first_date: days[0]?.date ?? null,
      last_date: days[days.length - 1]?.date ?? null,
      series: days.map((d) => ({ date: d.date, mean: d.mean, max: d.max, min: d.min })),
    };
  });

  const body = {
    source: "Italia Rovente (italiarovente.app)",
    license: SITE_LICENSE,
    documentation: `${SITE_URL}/dati/api`,
    dataset_source: meta?.source ?? "Open-Meteo Marine API (sea surface temperature)",
    dataset_generated_at: meta?.generatedAt ?? null,
    dataset_build: meta?.commit ?? null,
    dataset_sha256: meta?.sha256 ?? null,
    series_start: meta?.seriesStart ?? null,
    last_date: meta?.lastDate ?? null,
    units: "degrees Celsius",
    caveats: [
      "The series starts on 2022-11-24, the first day the source returns a value for all six points. Roughly three years: enough for records of this series, seasonality and year-over-year comparison of the same calendar day — NOT enough for a climate trend. We publish no slope, and neither should you.",
      "Days missing upstream are omitted, not interpolated. There is a real 14-day gap (2025-01-29 to 2025-02-11) present in the source for every point.",
      "The source rounds mean, max and min to one decimal independently, so on days with almost no diurnal range the mean can fall up to 0.1 °C outside its own min-max interval. min never exceeds max.",
      "Today's value is a forecast and is deliberately absent: the archive stops at the last analysed day.",
    ],
    fetched_at: new Date().toISOString(),
    count: seas.length,
    seas,
  };

  return Response.json(body, { headers: publicHeaders() });
}
