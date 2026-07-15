import type { MetadataRoute } from "next";
import { CITIES, REGIONS, slugifyRegion } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";

// Sitemap bilingue: per ogni pagina logica emettiamo UNA entry per lingua
// (URL italiano + URL inglese), ognuna con la stessa mappa hreflang in
// `alternates.languages` — il pattern raccomandato da Google (Next emette i
// tag xhtml:link hreflang per ogni entry).
//
// ESCLUSI deliberatamente (spazi URL infiniti o contenuto thin, noindex):
// - /citta/[slug]/giorno/[data]  (macchina del tempo, date infinite)
// - /condividi/[slug]/[anno]     (anni di nascita, quasi-infinito)
// - /embed/[slug]                (widget iframe, disallow in robots.txt)

type Entry = MetadataRoute.Sitemap[number];

// Costruisce le due entry (IT + EN) per una coppia di percorsi equivalenti.
function pair(
  itPath: string,
  enPath: string,
  lastModified: Date,
  changeFrequency: Entry["changeFrequency"],
  priority: number,
): Entry[] {
  const languages = {
    it: `${SITE_URL}${itPath}`,
    en: `${SITE_URL}${enPath}`,
  };
  return [
    { url: `${SITE_URL}${itPath}`, lastModified, changeFrequency, priority, alternates: { languages } },
    { url: `${SITE_URL}${enPath}`, lastModified, changeFrequency, priority, alternates: { languages } },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Home (priorità massima)
  const home = pair("", "/en", now, "daily", 1);

  // Pagine hub principali
  const hubs = ["/citta", "/regioni", "/clima", "/confronto", "/classifiche", "/mese"].flatMap((p) =>
    pair(p, `/en${p}`, now, "daily", 0.9),
  );

  // Quiz del clima (cambia ogni giorno: 5 domande nuove per data)
  const quiz = pair("/quiz", "/en/quiz", now, "daily", 0.8);

  // Confronto Italia vs Europa (dataset europeo statico, aggiornamenti rari)
  const europa = pair("/europa", "/en/europa", now, "weekly", 0.8);

  // Disclaimer / metodo (contenuto quasi statico)
  const disclaimer = pair("/disclaimer", "/en/disclaimer", now, "monthly", 0.4);

  // Privacy policy (statica; richiesta anche dal Play Store)
  const privacy = pair("/privacy", "/en/privacy", now, "yearly", 0.3);

  // Avvisi: registro pubblico degli eventi notificati (record, ondate, recap)
  const avvisi = pair("/avvisi", "/en/avvisi", now, "daily", 0.5);

  // Dati aperti / CSV scaricabile (aggiornato quando i dati storici si aggiornano)
  const dati = pair("/dati", "/en/dati", now, "weekly", 0.5);

  // Documentazione dell'API pubblica: è il punto d'ingresso per chi (o cosa)
  // vuole consumare i dati via codice, quindi va indicizzata.
  const api = pair("/dati/api", "/en/dati/api", now, "weekly", 0.6);

  // 107 pagine città
  const cities = CITIES.flatMap((c) =>
    pair(`/citta/${c.slug}`, `/en/citta/${c.slug}`, now, "daily", 0.8),
  );

  // 20 pagine regione
  const regions = REGIONS.flatMap((r) => {
    const slug = slugifyRegion(r);
    return pair(`/regioni/${slug}`, `/en/regioni/${slug}`, now, "weekly", 0.7);
  });

  // 107 pagine di condivisione città (senza anno di nascita)
  const share = CITIES.flatMap((c) =>
    pair(`/condividi/${c.slug}`, `/en/condividi/${c.slug}`, now, "weekly", 0.5),
  );

  return [...home, ...hubs, ...quiz, ...europa, ...disclaimer, ...privacy, ...avvisi, ...dati, ...api, ...cities, ...regions, ...share];
}
