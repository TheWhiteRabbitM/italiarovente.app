import { SEA_POINTS } from "@/lib/sea";
import { getSeaDays } from "@/lib/seahistory";
import { publicHeaders, csvRow } from "@/lib/publicapi";

export const revalidate = 3600;


// Stesso archivio di /api/export/mari.json, in formato lungo: una riga per
// (mare, giorno). Comodo per un foglio di calcolo o un `read_csv` in pandas.
export async function GET() {
  const header = ["mare", "data", "media_c", "max_c", "min_c"];

  const rows: string[] = [];
  for (const p of SEA_POINTS) {
    for (const d of getSeaDays(p.slug)) {
      rows.push(csvRow([p.slug, d.date, d.mean, d.max, d.min]));
    }
  }

  const csv = [csvRow(header), ...rows].join("\n") + "\n";

  return new Response(csv, {
    headers: {
      ...publicHeaders("text/csv; charset=utf-8"),
      "Content-Disposition": 'attachment; filename="italia-rovente-mari.csv"',
    },
  });
}
