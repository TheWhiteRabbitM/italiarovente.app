import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { classifyBot, bumpBot } from "@/lib/botstats";

// Reindirizza il vecchio alias di produzione *.vercel.app al dominio ufficiale.
// Solo l'host esatto: i deploy di preview (italiarovente-<hash>.vercel.app)
// non vengono toccati.
export function middleware(req: NextRequest, event: NextFetchEvent) {
  const host = req.headers.get("host");
  if (host === "italiarovente.vercel.app") {
    const url = req.nextUrl.clone();
    url.protocol = "https";
    url.hostname = "italiarovente.app";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Conteggio anonimo delle richieste di crawler/bot/AI (solo lo User-Agent
  // classificato in categorie note, nessun dato personale) — vedi
  // src/lib/botstats.ts e la sezione Privacy del disclaimer. waitUntil tiene
  // viva la funzione edge per l'incremento senza rallentare la risposta.
  const category = classifyBot(req.headers.get("user-agent") ?? "");
  if (category) {
    event.waitUntil(bumpBot(category).catch(() => {}));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
