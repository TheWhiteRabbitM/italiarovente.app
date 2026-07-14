// Configurazione globale del sito (usata da metadata, sitemap, robots, JSON-LD).
export const SITE_URL = "https://italiarovente.app";
export const SITE_NAME = "Italia Rovente";
export const SITE_TAGLINE = "I dati, non le opinioni. Le temperature italiane dal 1940.";
export const SITE_TAGLINE_EN = "Just the data. Italy's temperatures since 1940.";
export const SITE_DESCRIPTION =
  "Quanto si sta scaldando davvero l'Italia? Temperature giornaliere e storiche delle principali città dal 1940 a oggi: anomalie, warming stripes e mappa interattiva per dimostrare o smentire il riscaldamento globale. Dati ERA5/ECMWF, aggiornamento automatico.";

// App Android (TWA) sul Play Store. Finché l'app è in closed testing l'URL
// mostra "App non trovata" al pubblico: PLAY_AVAILABLE resta false e i pulsanti
// continuano a proporre l'installazione della PWA. Appena l'app è PUBBLICA in
// produzione sul Play, mettere PLAY_AVAILABLE a true e rideployare: su Android
// i pulsanti "Installa" diventano "Scarica su Google Play" (iPhone/desktop
// restano sull'installazione PWA, perché dal Play non possono scaricarla).
export const PLAY_URL = "https://play.google.com/store/apps/details?id=app.italiarovente.twa";
export const PLAY_AVAILABLE = false;
