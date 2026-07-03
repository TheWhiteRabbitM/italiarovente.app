import { NextRequest, NextResponse } from "next/server";
import { getRandomCuriosity } from "@/lib/curiosities";

// Pesca una curiosità a caso tra quelle già calcolate dallo snapshot in
// cache (gemello climatico, gradi giorno, record di durata) — mai il
// record estivo/invernale, che richiedono il meteo attuale: qui potrebbe
// essere chiamato molte volte da visitatori diversi, e non vogliamo
// moltiplicare le chiamate a Open-Meteo per un widget decorativo in home.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "it";
  const count = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("count")) || 1));

  if (count === 1) {
    const curiosity = await getRandomCuriosity(lang);
    if (!curiosity) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json(curiosity, { headers: { "Cache-Control": "no-store" } });
  }

  const picks = await Promise.all(Array.from({ length: count }, () => getRandomCuriosity(lang)));
  const list = picks.filter(Boolean);
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store" } });
}
