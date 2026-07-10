// Header condivisi dagli endpoint PUBBLICI in sola lettura (tutto ciò che sta
// sotto /api/export/, più /api/openapi.json).
//
// Confine da rispettare: qui dentro finisce solo roba idempotente, gratuita e
// senza dati personali. Gli endpoint che scrivono (/api/vote, /api/visit,
// /api/push/subscribe), quello che consuma un LLM a pagamento (/api/ask) e il
// cron (/api/refresh) NON usano questi header e restano vietati in robots.ts.
//
// CORS aperto: senza `Access-Control-Allow-Origin` un notebook, un grafico su
// Observable o una pagina di verifica non possono leggere questi dati dal
// browser. Sono dati pubblici e in sola lettura: non c'è nulla da proteggere,
// e nessun cookie da esfiltrare (le risposte non dipendono dalla sessione).
//
// Nessun handler OPTIONS, di proposito: una GET cross-origin senza header
// personalizzati è una "simple request" e non fa preflight, quindi l'header
// sulla risposta basta. Esportare OPTIONS costringerebbe Next a rendere la
// route dinamica, perdendo la generazione statica al build — un costo reale
// per un preflight che nessuno manda.

export const SITE_LICENSE =
  "MIT (code) — weather data © Open-Meteo / ECMWF / Copernicus C3S; marine data © Open-Meteo";

export const ATTRIBUTION =
  "Italia Rovente (italiarovente.app), dati ERA5/ECMWF via Open-Meteo";

// 1h sul client, 24h sulla CDN: i dati sottostanti cambiano al massimo una
// volta al giorno, non ha senso ricalcolarli a ogni richiesta.
const CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";

export function publicHeaders(contentType?: string): Record<string, string> {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    "Cache-Control": CACHE,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    // Senza Expose-Headers, JavaScript cross-origin non può leggere gli header
    // personalizzati: X-Attribution sarebbe invisibile proprio a chi consuma
    // i dati da un notebook o da una pagina, cioè a chi deve citarci.
    "Access-Control-Expose-Headers": "X-Attribution",
    "X-Attribution": ATTRIBUTION,
  };
}

// Escape CSV: virgolette raddoppiate, campo racchiuso solo se contiene
// separatore, virgolette o a capo. Senza, un nome di città con la virgola
// sposterebbe silenziosamente tutte le colonne successive.
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}
