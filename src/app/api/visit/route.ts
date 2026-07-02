import { NextResponse } from "next/server";
import { bumpVisit } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function POST() {
  const stats = await bumpVisit();
  return NextResponse.json(
    { visits: stats.visits },
    { headers: { "Cache-Control": "no-store" } },
  );
}
