import type { NextConfig } from "next";

// Identificativo della build, esposto anche al client. Serve al service worker:
// il nome della sua cache lo include, così ogni deploy installa un SW nuovo che
// in `activate` cancella le cache dei deploy precedenti. Senza, un utente con la
// PWA installata resta su asset e precache vecchi per sempre.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
};

export default nextConfig;
