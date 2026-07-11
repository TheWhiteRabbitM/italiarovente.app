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
    // Se "standalone" non è supportato, ripiega su "minimal-ui" (barra minima)
    // invece che direttamente sul browser: l'app resta più simile a un'app.
    display_override: ["standalone", "minimal-ui"],
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
    // Scorciatoie da long-press sull'icona dell'app (Android/desktop). Max 4,
    // le più usate: l'indice città, il bollettino del mese, le classifiche e
    // il confronto. Ogni scorciatoia riusa l'icona dell'app.
    shortcuts: [
      {
        name: "Tutte le città",
        short_name: "Città",
        url: "/citta",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Il mese appena concluso",
        short_name: "Il mese",
        url: "/mese",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Classifiche del clima",
        short_name: "Classifiche",
        url: "/classifiche",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Confronto città",
        short_name: "Confronto",
        url: "/confronto",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
