import { NextResponse } from "next/server";
import { getStats, statsBackend } from "@/lib/stats";
import { getBotStats } from "@/lib/botstats";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, bots] = await Promise.all([getStats(), getBotStats()]);
  return NextResponse.json(
    { ...stats, backend: statsBackend(), bots },
    { headers: { "Cache-Control": "no-store" } },
  );
}
