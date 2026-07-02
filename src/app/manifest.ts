import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Italia Rovente · Temperature italiane dal 1940",
    short_name: "Italia Rovente",
    description:
      "I dati, non le opinioni. Le temperature italiane dal 1940: anomalie, mappa interattiva e warming stripes delle città italiane.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#29241f",
    theme_color: "#d23a22",
    lang: "it",
    dir: "ltr",
    categories: ["weather", "education", "science"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Il clima d'Italia", url: "/clima" },
      { name: "Tutte le città", url: "/citta" },
      { name: "Confronto", url: "/confronto" },
    ],
  };
}
