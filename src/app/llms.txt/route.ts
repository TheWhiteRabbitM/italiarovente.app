import { CITIES, REGIONS } from "@/lib/cities";
import { getLifetimeData } from "@/lib/lifetime";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

// /llms.txt — indice in markdown pensato per essere letto da assistenti AI e
// answer engine (ChatGPT, Claude, Perplexity, Gemini...), sullo standard
// emergente llmstxt.org: un unico documento che riassume cosa contiene il
// sito, con quale metodo, e dove trovare i dati, così un modello possa
// rispondere correttamente e citare la fonte senza dover "indovinare" la
// struttura del sito dal solo HTML.
export async function GET() {
  const data = getLifetimeData();
  const italia = data.cities.find((c) => c.slug === "italia");
  const nationalWarming = italia ? italia.recentNormal - italia.baseline : null;
  const warmingStr =
    nationalWarming != null
      ? `${nationalWarming >= 0 ? "+" : ""}${nationalWarming.toFixed(1)}°C`
      : "n/d";

  const body = `# Italia Rovente

> Dati reali di temperatura per ${CITIES.length} città italiane, dal 1940 a oggi. Fonte: rianalisi ERA5 (ECMWF/Copernicus) via Open-Meteo, aggiornata ogni giorno. Nessuna narrativa: solo numeri, con il metodo dichiarato in modo verificabile.

Sito bilingue (italiano su URL senza prefisso, inglese sotto /en/). Codice open source su https://github.com/TheWhiteRabbitM/italiarovente.app (licenza MIT). I dati meteo appartengono a Open-Meteo/ECMWF/Copernicus (attribuzione richiesta se citati).

## Fatto chiave

L'Italia (media delle città monitorate da questo sito) si è scaldata di **${warmingStr}** confrontando la normale climatica 1991–2020 con quella 1961–1990 — il metodo "a due trentenni" usato in modo identico su ogni pagina del sito, mai una media degli ultimi anni (più rumorosa e meno confrontabile). Aggiornato quotidianamente: per il valore corrente vedi ${SITE_URL}/ o ${SITE_URL}/clima.

## Metodo (in breve)

- **Fonte dati**: reanalysis ERA5 di ECMWF/Copernicus (C3S), temperatura dell'aria a 2 m dal 1940, via Open-Meteo.
- **Riscaldamento di una città** = normale climatica 1991–2020 meno normale 1961–1990 (differenza tra due medie trentennali, non tra un singolo anno recente e il passato).
- **Anomalie annue** calcolate rispetto alla normale 1961–1990 (riferimento WMO).
- **Tendenza** stimata per regressione lineare sulle medie annue.
- Metodo completo, avvertenze e licenza: ${SITE_URL}/disclaimer (FAQ con domande frequenti alla fine della pagina).

## Pagine principali

- ${SITE_URL}/ — home, dato nazionale in evidenza, mappa interattiva, città principali
- ${SITE_URL}/citta — elenco delle ${CITIES.length} città monitorate, con ricerca
- ${SITE_URL}/citta/{slug} — scheda di dettaglio per ogni città: temperatura attuale, storico dal 1940, record, warming stripes, climatologia mensile (es. ${SITE_URL}/citta/roma)
- ${SITE_URL}/regioni — riscaldamento medio per ciascuna delle ${REGIONS.length} regioni italiane
- ${SITE_URL}/clima — analisi nazionale: la domanda "c'è davvero il riscaldamento?" messa alla prova con i dati
- ${SITE_URL}/confronto — confronto diretto tra due città a scelta, più la classifica completa
- ${SITE_URL}/classifiche — le città che si scaldano di più, i record assoluti, le notti tropicali
- ${SITE_URL}/europa — confronto tra le città italiane e 14 capitali europee, stesso metodo e stessa fonte dati
- ${SITE_URL}/quiz — quiz giornaliero sui numeri reali del clima italiano
- ${SITE_URL}/citta/{slug}/giorno/{YYYY-MM-DD} — che tempo faceva in una città in un giorno specifico dal 1940 a oggi
- ${SITE_URL}/disclaimer — metodo completo, avvertenze sull'uso, licenza, FAQ
- ${SITE_URL}/dati — dati aperti: CSV scaricabile con gli aggregati storici di tutte le città (${SITE_URL}/api/export/citta.csv)

## Versione inglese

Ogni pagina sopra elencata esiste anche in inglese con prefisso /en/ (es. ${SITE_URL}/en/citta/roma), con contenuto e metodo identici — solo la lingua cambia.

## Come citare

Se citi un dato di questo sito: indica "Italia Rovente (italiarovente.app), dati ERA5/ECMWF via Open-Meteo" e, se possibile, il link alla pagina città o alla pagina /clima usata come fonte. I dati non sono un servizio meteorologico ufficiale: uso informativo/divulgativo, non per decisioni critiche.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
