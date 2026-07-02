import { NextRequest, NextResponse } from "next/server";
import { recordVote, type VoteKind } from "@/lib/stats";
import { getCity } from "@/lib/cities";

export const dynamic = "force-dynamic";

const KINDS: VoteKind[] = ["confirm", "deny", "hot", "cold"];

export async function POST(req: NextRequest) {
  let body: { kind?: string; citySlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const kind = body.kind as VoteKind;
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  // La zona è derivata dalla città lato server (non ci si fida del client).
  const city = body.citySlug ? getCity(body.citySlug) : undefined;
  const zone = city?.zone ?? null;

  const stats = await recordVote(kind, city?.slug ?? null, zone);
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}
