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
    // Anteprime per la finestra d'installazione "ricca" di Chrome e per la
    // scheda del Play Store (via TWA/PWABuilder). form_factor "narrow" = telefono.
    // Generate da scripts/gen-screenshots.mjs con i dati reali del sito.
    screenshots: [
      {
        src: "/screenshots/screenshot-1-hero.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Quanto si è scaldata l'Italia dal 1940, con le warming stripes",
      },
      {
        src: "/screenshots/screenshot-2-classifiche.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Le città italiane che si scaldano di più",
      },
      {
        src: "/screenshots/screenshot-3-citta.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "La scheda di una città: anomalia, ritmo e strisce del riscaldamento",
      },
    ],
  };
}
