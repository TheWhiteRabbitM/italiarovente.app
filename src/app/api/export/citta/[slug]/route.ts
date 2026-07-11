import { getCity, CITIES } from "@/lib/cities";
import { getArchiveStats, getHistoryMeta } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";
import { publicHeaders, SITE_LICENSE } from "@/lib/publicapi";

export const revalidate = 3600;


// Il dettaglio completo di UNA città: la serie annua, la climatologia mensile,
// la serie mensile anno per anno, i record e il trend con intervallo di
// confidenza. È l'endpoint per chi vuole rifare i conti: contiene tutto ciò
// che serve a ricalcolare da zero i numeri che il sito pubblica, senza doverli
// prendere per buoni.
//
// Non fa alcun fetch: legge lo snapshot precalcolato. Nessuna previsione, solo
// dati storici — per la temperatura di adesso c'è la pagina città.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) {
    return Response.json(
      {
        error: "not-found",
        message: `Unknown city slug "${slug}".`,
        available: `${SITE_URL}/api/export/citta.json`,
      },
      { status: 404, headers: publicHeaders() },
    );
  }

  const s = getArchiveStats(city);
  if (!s) {
    return Response.json(
      {
        error: "no-data",
        message: `No historical snapshot for "${slug}" yet. The archive fills in city by city across builds.`,
      },
      { status: 503, headers: publicHeaders() },
    );
  }

  const meta = getHistoryMeta();
  const warming = s.trend.recentNormal - s.trend.baselineMean;

  const body = {
    source: "Italia Rovente (italiarovente.app)",
    license: SITE_LICENSE,
    documentation: `${SITE_URL}/dati/api`,
    dataset_source: meta?.source ?? null,
    dataset_generated_at: meta?.generatedAt ?? null,
    dataset_build: meta?.commit ?? null,
    dataset_sha256: meta?.sha256 ?? null,
    fetched_at: new Date().toISOString(),
    units: "degrees Celsius",
    method: {
      warming_c:
        "1991-2020 climate normal minus 1961-1990 normal (WMO reference periods). Never a recent year against the past.",
      trend:
        "Ordinary least squares on (year, annual mean) for complete years only (>= 360 days). per_decade_ci95 is the +/- margin of a 95% confidence interval on the slope (Student's t, df = n-2).",
      anomaly: "Annual mean minus the 1961-1990 normal.",
      hot_days: "hd = days with max >= 30 C, ehd = days with max >= 35 C, tn = nights with min >= 20 C. Only for main cities.",
      records:
        "Absolute daily records ignore the last 120 days: recent ERA5 (ERA5T) is preliminary and may be revised.",
    },
    city: {
      slug: city.slug,
      name: city.name,
      region: city.region,
      zone: city.zone,
      lat: city.lat,
      lon: city.lon,
      main: city.main,
      // false = solo media giornaliera, senza max/min reali: i record e i
      // conteggi di giorni caldi non esistono per questa città.
      precise: s.precise !== false,
    },
    trend: {
      first_year: s.trend.firstYear,
      last_year: s.trend.lastYear,
      baseline_1961_1990: round(s.trend.baselineMean, 2),
      normal_1991_2020: round(s.trend.recentNormal, 2),
      warming_c: round(warming, 2),
      per_decade_c: round(s.trend.perDecade, 3),
      per_decade_ci95: finite(s.trend.perDecadeCi95) ? round(s.trend.perDecadeCi95!, 3) : null,
      r2: round(s.trend.r2, 3),
      total_change_c: round(s.trend.totalChange, 2),
    },
    records: s.records,
    yearly: s.yearly,
    anomalies: s.anomalies,
    decades: s.decades,
    monthly_climatology: s.monthly,
    // Media di ogni singolo anno-mese: è la serie dietro /mese, e l'unica che
    // permette di rispondere a "questo giugno è stato il più caldo?".
    monthly_series: s.monthlySeries ?? null,
    // Afa estiva anno per anno (percepita e secca massima media giu-ago). Solo
    // città principali; null altrove. La percepita è un modello (umidità,
    // vento, radiazione), meno solida della secca.
    summer_apparent: s.summerApparent ?? null,
  };

  return Response.json(body, { headers: publicHeaders() });
}

function round(v: number, d: number): number | null {
  return Number.isFinite(v) ? Number(v.toFixed(d)) : null;
}
function finite(v: number | undefined): v is number {
  return v != null && Number.isFinite(v);
}

// Pre-renderizza le città principali; le altre restano on-demand (ISR).
export function generateStaticParams() {
  return CITIES.filter((c) => c.main).map((c) => ({ slug: c.slug }));
}
