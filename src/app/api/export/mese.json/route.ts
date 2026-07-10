import {
  getMonthlyBulletin,
  BASELINE_FROM,
  BASELINE_TO,
  PUBLISHED_DECIMALS,
} from "@/lib/monthlyCompare";
import { getHistoryMeta } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";
import { publicHeaders, SITE_LICENSE } from "@/lib/publicapi";

export const revalidate = 3600;


// Il bollettino del mese appena concluso, gli stessi numeri di /mese.
// Pensato per essere citato: contiene il ranking, la serie completa dello
// stesso mese di calendario dal 1940, e il dettaglio città per città.
export async function GET() {
  const b = getMonthlyBulletin();
  if (!b) {
    return Response.json(
      {
        error: "not-ready",
        message:
          "The monthly snapshot does not yet cover enough cities to compute a national mean. It fills in across builds.",
      },
      { status: 503, headers: publicHeaders() },
    );
  }

  const meta = getHistoryMeta();
  const n = b.national;

  const body = {
    source: "Italia Rovente (italiarovente.app)",
    license: SITE_LICENSE,
    documentation: `${SITE_URL}/dati/api`,
    page: `${SITE_URL}/mese`,
    dataset_source: meta?.source ?? null,
    dataset_generated_at: meta?.generatedAt ?? null,
    dataset_sha256: meta?.sha256 ?? null,
    fetched_at: new Date().toISOString(),
    units: "degrees Celsius",
    method: {
      baseline: `Anomalies are computed against the ${BASELINE_FROM}-${BASELINE_TO} normal of the SAME calendar month, not the whole-series average.`,
      national_mean:
        "Unweighted mean of the cities that have a monthly series for that year-month, requiring at least half of them. `contributing_cities` says how many actually backed this figure.",
      completeness: "A month enters the comparison only with at least 24 valid days.",
      ranking: `Computed on the published anomaly, rounded to ${PUBLISHED_DECIMALS} decimals. Months showing the same anomaly share a rank (2nd, 2nd, 4th): the source city means are themselves rounded to 2 decimals, so a finer ordering would be an artefact.`,
      not_copernicus:
        "This is not a replication or a verification of Copernicus' bulletins. Same primary source (ERA5), different domain (only the cities monitored here) and often a different baseline. Different numbers are expected.",
    },
    month: {
      year: n.year,
      month: n.month,
      mean_c: round(n.value),
      normal_c: round(n.normal),
      anomaly_c: round(n.anomaly),
      rank: n.rank,
      rank_direction: n.direction,
      total_years: n.total,
      since_year: n.sinceYear,
      contributing_cities: n.contributors,
    },
    // Ogni anno per lo stesso mese di calendario, in ordine cronologico.
    series: b.series.map((s) => ({
      year: s.year,
      mean_c: round(s.mean),
      anomaly_c: round(s.anomaly),
    })),
    cities: b.cities.map((c) => ({
      slug: c.slug,
      name: c.name,
      mean_c: round(c.mean),
      anomaly_c: round(c.anomaly),
      rank: c.rank,
      total_years: c.total,
    })),
  };

  return Response.json(body, { headers: publicHeaders() });
}

function round(v: number): number {
  const f = 10 ** PUBLISHED_DECIMALS;
  return Math.round(v * f) / f;
}
