import type { NextConfig } from "next";

// Identificativo della build, esposto anche al client. Serve al service worker:
// il nome della sua cache lo include, così ogni deploy installa un SW nuovo che
// in `activate` cancella le cache dei deploy precedenti. Senza, un utente con la
// PWA installata resta su asset e precache vecchi per sempre.
//
// Attenzione al vuoto, non solo all'assente: su Vercel VERCEL_GIT_COMMIT_SHA
// ESISTE ma vale "" quando il progetto non è collegato a un repo git (deploy da
// CLI). Un `?? "dev"` non scatta su stringa vuota, e finiva in produzione un
// `/sw.js?v=` senza valore: il worker leggeva `v` vuoto, ricadeva su "dev", e la
// cache si chiamava `ir-dev` a ogni deploy — cioè mai invalidata, cioè il bug
// che questo meccanismo doveva risolvere.
//
// Ultimo fallback: il timestamp del build. Cambia sempre, che ci sia git o no.
function firstNonEmpty(...vals: (string | undefined)[]): string | null {
  for (const v of vals) {
    const s = v?.trim();
    if (s) return s;
  }
  return null;
}

const BUILD_ID =
  firstNonEmpty(
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    process.env.VERCEL_DEPLOYMENT_ID,
  ) ?? `b${Date.now().toString(36)}`;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
};

export default nextConfig;
