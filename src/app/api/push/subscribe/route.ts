import { NextRequest, NextResponse } from "next/server";
import {
  saveSubscription,
  removeSubscription,
  existsSubscription,
  sendWelcome,
  pushConfigured,
  type PushLang,
} from "@/lib/push";
import { CITIES, cityName } from "@/lib/cities";

export const dynamic = "force-dynamic";

// Testo del benvenuto: conferma immediata che il canale funziona, con la
// città seguita se presente. Solo alla PRIMA iscrizione — gli aggiornamenti
// (cambio lingua/città) restano silenziosi.
function welcomePayload(lang: PushLang, citySlug?: string) {
  const city = citySlug ? CITIES.find((c) => c.slug === citySlug) : undefined;
  if (lang === "en") {
    return {
      title: "🔔 Notifications on",
      body: city
        ? `You'll get alerts about ${cityName(city, "en")} and Italy: records, heatwaves and the monthly recap. Real events only, from the data.`
        : "You'll get alerts about Italy: records, heatwaves and the monthly recap. Real events only, from the data.",
      url: "/en/avvisi",
      tag: "welcome",
      cta: "See the alerts",
    };
  }
  return {
    title: "🔔 Notifiche attive",
    body: city
      ? `Ti avviseremo su ${city.name} e sull'Italia: record, ondate di calore e recap mensile. Solo eventi reali, dai dati.`
      : "Ti avviseremo sull'Italia: record, ondate di calore e recap mensile. Solo eventi reali, dai dati.",
    url: "/avvisi",
    tag: "welcome",
    cta: "Vedi gli avvisi",
  };
}

export async function POST(req: NextRequest) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }
  try {
    // Il body è la PushSubscription del browser più i campi extra `lang` e
    // `city` aggiunti dal client. La città viene validata contro l'elenco
    // reale: slug sconosciuti (o assenti) → solo notifiche nazionali.
    const { lang, city, ...sub } = (await req.json()) ?? {};
    if (!sub?.endpoint) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }
    const langNorm: PushLang = lang === "en" ? "en" : "it";
    const citySlug =
      typeof city === "string" && CITIES.some((c) => c.slug === city) ? city : undefined;

    const isNew = !(await existsSubscription(sub.endpoint));
    await saveSubscription(sub, langNorm, citySlug);
    if (isNew) {
      // Best effort: se il benvenuto fallisce l'iscrizione resta valida.
      await sendWelcome(sub, welcomePayload(langNorm, citySlug));
    }
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
