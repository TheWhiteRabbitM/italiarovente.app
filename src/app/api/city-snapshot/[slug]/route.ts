import { NextResponse } from "next/server";
import { getCity, cityName } from "@/lib/cities";
import { getForecast, getArchiveStats } from "@/lib/weather";

// Dato live per UNA città scelta dall'utente ("la mia città", vedi
// src/components/MyCity.tsx): stesso costo di visitare /citta/[slug],
// nessuna richiesta aggiuntiva rispetto a quello che il sito fa già.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "it";
  const city = getCity(slug);
  if (!city) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const [forecast, archive] = await Promise.all([
    getForecast(city).catch(() => null),
    Promise.resolve(getArchiveStats(city)),
  ]);

  const warming = archive ? archive.trend.recentNormal - archive.trend.baselineMean : null;

  return NextResponse.json(
    {
      slug: city.slug,
      name: cityName(city, lang),
      temp: forecast?.current.temp ?? null,
      warming,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
