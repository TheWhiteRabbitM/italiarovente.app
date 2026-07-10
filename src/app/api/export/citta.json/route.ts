import { CITIES } from "@/lib/cities";
import { getArchiveStats, getHistoryMeta } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";
import { publicHeaders } from "@/lib/publicapi";

export const revalidate = 3600;


// Stessi aggregati di /api/export/citta.csv, in JSON per chi preferisce
// consumarli via codice invece che aprirli in un foglio di calcolo.
export async function GET() {
  const cities = CITIES.flatMap((city) => {
    const s = getArchiveStats(city);
    if (!s) return [];
    return [
      {
        slug: city.slug,
        name: city.name,
        region: city.region,
        lat: city.lat,
        lon: city.lon,
        baseline_1961_1990: Number(s.trend.baselineMean.toFixed(2)),
        normal_1991_2020: Number(s.trend.recentNormal.toFixed(2)),
        warming_c: Number((s.trend.recentNormal - s.trend.baselineMean).toFixed(2)),
        per_decade_c: Number(s.trend.perDecade.toFixed(3)),
        per_decade_ci95:
          s.trend.perDecadeCi95 != null && Number.isFinite(s.trend.perDecadeCi95)
            ? Number(s.trend.perDecadeCi95.toFixed(3))
            : null,
        r2: Number(s.trend.r2.toFixed(3)),
        series_start_year: s.startYear,
      },
    ];
  });

  const meta = getHistoryMeta();

  const body = {
    source: "Italia Rovente (italiarovente.app)",
    license: "MIT (code) — weather data © Open-Meteo / ECMWF / Copernicus C3S",
    method:
      "warming_c = 1991-2020 climate normal minus 1961-1990 normal (WMO reference period), same method used throughout the site. per_decade_ci95 is the ± margin of a 95% confidence interval on the OLS trend slope (Student's t, df = n-2), null if not computable.",
    documentation: `${SITE_URL}/dati`,
    // Quando lo snapshot storico sottostante è stato ricalcolato — non l'ora
    // di questa richiesta HTTP, che cambierebbe ad ogni fetch senza dire nulla
    // sull'età reale dei dati.
    dataset_generated_at: meta?.generatedAt ?? null,
    dataset_source: meta?.source ?? "Open-Meteo Archive API — ERA5 reanalysis (ECMWF/Copernicus C3S)",
    dataset_build: meta?.commit ?? null,
    // Fingerprint SHA-256 degli aggregati per-città: ricalcolando aggregate()
    // sugli stessi dati grezzi si può verificare indipendentemente che questi
    // numeri non siano stati alterati. Vedi /dati.
    dataset_sha256: meta?.sha256 ?? null,
    fetched_at: new Date().toISOString(),
    count: cities.length,
    cities,
  };

  return Response.json(body, { headers: publicHeaders() });
}
