import { NextRequest, NextResponse } from "next/server";
import { generateText, stepCountIs } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { askTools } from "@/lib/ask-tools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// API diretta di Mistral (api.mistral.ai, chiave MISTRAL_API_KEY) — non passa
// dal Vercel AI Gateway, quindi non richiede la carta di credito su Vercel.
const MODEL = mistral("mistral-medium-latest");
const MAX_QUESTION_LEN = 300;

const SYSTEM = `Sei l'assistente climatico di Italia Rovente (italiarovente.app), un sito che mostra
dati reali di temperatura delle città italiane dal 1940 (fonte ERA5/ECMWF via Open-Meteo).

REGOLE FERREE:
- Rispondi SOLO usando i numeri restituiti dai tool. Non inventare né stimare mai una cifra a memoria.
- Se ti serve un dato su una città, chiama prima listCities per trovare lo slug corretto, poi getCityClimate.
- Se l'utente chiede dell'Italia in generale, usa getNationalClimate.
- Se non hai un tool con il dato richiesto, dillo chiaramente invece di indovinare.
- Cita sempre il periodo di riferimento (es. "dal 1940" o "rispetto al 1961-1990").
- Quando riporti un riscaldamento (una media), aggiungi sempre anche quanto sono aumentate
  separatamente le temperature massime e le minime, se il tool le fornisce (maxWarmingVsBaseline /
  minWarmingVsBaseline): danno più contesto di una sola media, spesso giorni e notti non si scaldano
  allo stesso ritmo.
- Se il tool restituisce "recordsNote", tienine conto: i record giornalieri più recenti sono dati
  preliminari non ancora ri-analizzati in via definitiva, non trattarli come definitivi al 100%.
- Rispondi nella stessa lingua della domanda (italiano o inglese).
- Sii breve e diretto: 2-4 frasi, niente preamboli, tono naturale (non un elenco di cifre incolonnate).
- Testo semplice, niente markdown: la risposta viene mostrata così com'è in chat, quindi non usare
  **asterischi**, elenchi puntati, titoli o altra formattazione — solo frasi, con i numeri dentro.
- Resta sul tema clima/temperature italiane. Se la domanda è fuori tema, spiega gentilmente che puoi
  rispondere solo su questo.`;

// Rete di sicurezza: se il modello usa comunque markdown, ripulisci prima di
// mostrare il testo (il componente lo renderizza come testo semplice).
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "");
}

export async function POST(req: NextRequest) {
  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, MAX_QUESTION_LEN);
  if (!question) {
    return NextResponse.json({ error: "missing question" }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: MODEL,
      system: SYSTEM,
      prompt: question,
      tools: askTools,
      stopWhen: stepCountIs(4),
    });

    return NextResponse.json(
      { answer: stripMarkdown(result.text) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("ask error", e);
    return NextResponse.json(
      { error: "Il servizio è momentaneamente non disponibile. Riprova tra poco." },
      { status: 503 },
    );
  }
}
