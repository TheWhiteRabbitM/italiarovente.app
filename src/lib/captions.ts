// Didascalie di condivisione generate con l'AI, invece del testo statico
// fisso — stesso principio del chatbot "Chiedi al clima": il modello scrive
// SOLO a partire dai numeri che gli passiamo, non li inventa mai. Ogni
// funzione ha un fallback statico se l'AI non è disponibile (chiave assente,
// errore, rate limit): la pagina non deve mai dipendere da una chiamata
// esterna per funzionare.
import { unstable_cache } from "next/cache";
import { generateText } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { fmtAnomaly } from "./format";
import cityCaptionsData from "@/data/captions.json";

const MODEL = mistral("mistral-small-latest");

const SYSTEM_IT = `Scrivi didascalie brevi per la condivisione social di Italia Rovente
(italiarovente.app), un sito che mostra dati reali di temperatura delle città
italiane dal 1940 (fonte ERA5/ECMWF via Open-Meteo).

REGOLE FERREE:
- Usa SOLO i numeri forniti nel messaggio, esattamente come scritti. Non inventarne altri.
- Rispondi con UNA SOLA riga di testo: una frase sola, punto. Non proporre alternative,
  non elencare opzioni, non andare a capo per nessun motivo.
- Massimo 160 caratteri, in italiano.
- Niente markdown, niente hashtag, niente emoji (li aggiunge il sito), niente virgolette.
- Tono diretto e fattuale: i dati parlano da soli, non serve enfasi o allarmismo.
- Varia la struttura della frase invece di ripetere sempre lo stesso schema "Città: +X°C dal Y".`;

const SYSTEM_EN = `Write short social-sharing captions for Italia Rovente
(italiarovente.app), a site showing real temperature data for Italian cities
since 1940 (source: ERA5/ECMWF via Open-Meteo).

STRICT RULES:
- Use ONLY the numbers provided in the message, exactly as written. Never invent others.
- Reply with A SINGLE LINE of text: one sentence, full stop. Do not propose alternatives,
  do not list options, do not break lines for any reason.
- Maximum 160 characters, in English.
- No markdown, no hashtags, no emoji (the site adds them), no quotation marks.
- Direct, factual tone: the data speaks for itself, no need for emphasis or alarmism.
- Vary the sentence structure instead of always repeating the same "City: +X°C since Y" pattern.`;

async function ask(prompt: string, fallback: string, lang: "it" | "en" = "it"): Promise<string> {
  if (!process.env.MISTRAL_API_KEY) return fallback;
  try {
    const { text } = await generateText({
      model: MODEL,
      system: lang === "en" ? SYSTEM_EN : SYSTEM_IT,
      prompt,
      maxOutputTokens: 100,
    });
    // Rete di sicurezza: se il modello propone comunque più righe/alternative
    // (ignorando "una sola riga"), tieni solo la prima frase.
    const cleaned = text
      .split("\n")[0]
      .trim()
      .replace(/^["“]|["”]$/g, "");
    return cleaned && cleaned.length <= 220 ? cleaned : fallback;
  } catch (e) {
    console.error("caption generation failed", e);
    return fallback;
  }
}

// Didascalie per città (/condividi/[slug]): insieme finito (53 città),
// precalcolate al build da scripts/generate-captions.mjs e salvate in
// src/data/captions.json — nessuna chiamata AI a runtime per queste pagine
// (solo per l'italiano: il file precalcolato resta italiano-only).
const CITY_CAPTIONS = cityCaptionsData as Record<string, string>;

// Variante inglese: non precalcolata (il JSON resta IT-only, fuori scope
// rigenerarlo), quindi generata a richiesta ma cachata a lungo (30 giorni,
// stesso approccio di getBirthYearCaption) — non una chiamata AI per ogni
// visita, solo la prima per ogni città.
const getCityCaptionEn = unstable_cache(
  async (slug: string, fallback: string): Promise<string> => {
    return ask(`Caption fact: ${fallback}`, fallback, "en");
  },
  ["city-caption-en"],
  { revalidate: 60 * 60 * 24 * 30 },
);

export async function getCityCaption(
  slug: string,
  fallback: string,
  lang: "it" | "en" = "it",
): Promise<string> {
  if (lang === "en") return getCityCaptionEn(slug, fallback);
  return CITY_CAPTIONS[slug] ?? fallback;
}

// Didascalia per /condividi/[slug]/[anno]: l'anno di nascita è un parametro
// libero (non un insieme finito come le città), quindi non precalcolabile.
// Generata a richiesta ma cachata a lungo (30 giorni): non una chiamata AI
// per ogni visita, solo la prima per ogni coppia città+anno.
export const getBirthYearCaption = unstable_cache(
  async (cityName: string, year: number, delta: number, lang: "it" | "en" = "it"): Promise<string> => {
    const deltaText = fmtAnomaly(delta, 1);
    const fallback =
      lang === "en"
        ? `${cityName} since ${year}: ${deltaText}. Calculate your own climate on Italia Rovente 🔥`
        : `${cityName} dal ${year}: ${deltaText}. Calcola il tuo clima su Italia Rovente 🔥`;
    const prompt =
      lang === "en"
        ? `City: ${cityName}. Since I was born in ${year}, the temperature has changed by ${deltaText}.`
        : `Città: ${cityName}. Da quando sono nato/a nel ${year} a oggi, la temperatura è cambiata di ${deltaText}.`;
    return ask(prompt, fallback, lang);
  },
  ["birth-year-caption"],
  { revalidate: 60 * 60 * 24 * 30 },
);
