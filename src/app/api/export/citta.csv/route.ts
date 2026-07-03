import { CITIES } from "@/lib/cities";
import { getArchiveStats } from "@/lib/weather";

export const revalidate = 3600;

// Esporta gli aggregati storici già calcolati (nessun fetch): stesso metodo
// "a due trentenni" usato ovunque sul sito, in formato CSV per chi vuole
// riusare i dati (ricercatori, giornalisti, altre AI) senza fare scraping.
function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  const header = [
    "slug",
    "citta",
    "regione",
    "lat",
    "lon",
    "normale_1961_1990",
    "normale_1991_2020",
    "riscaldamento_c",
    "gradi_decennio",
    "gradi_decennio_ic95",
    "r2",
    "anno_inizio_serie",
  ];

  const rows = CITIES.flatMap((city) => {
    const s = getArchiveStats(city);
    if (!s) return [];
    return [
      [
        city.slug,
        city.name,
        city.region,
        String(city.lat),
        String(city.lon),
        s.trend.baselineMean.toFixed(2),
        s.trend.recentNormal.toFixed(2),
        (s.trend.recentNormal - s.trend.baselineMean).toFixed(2),
        s.trend.perDecade.toFixed(3),
        s.trend.perDecadeCi95 != null && Number.isFinite(s.trend.perDecadeCi95)
          ? s.trend.perDecadeCi95.toFixed(3)
          : "",
        s.trend.r2.toFixed(3),
        String(s.startYear),
      ]
        .map(csvEscape)
        .join(","),
    ];
  }).flat();

  const csv = [header.join(","), ...rows].join("\n") + "\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="italia-rovente-citta.csv"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
