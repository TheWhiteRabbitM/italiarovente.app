import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscription, pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }
  try {
    // Il body è la PushSubscription del browser più un campo extra `lang`
    // aggiunto dal client. Lo separiamo qui: la lingua viene salvata accanto
    // all'iscrizione ("it" se assente o non riconosciuta, anche per i client
    // vecchi che non la inviano).
    const { lang, ...sub } = (await req.json()) ?? {};
    if (!sub?.endpoint) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }
    await saveSubscription(sub, lang === "en" ? "en" : "it");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) await removeSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
}
