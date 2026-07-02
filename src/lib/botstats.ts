// Conteggio anonimo delle richieste di crawler/bot/assistenti AI, distinto
// dalle "visite" umane (VisitCounter, sessione-based via beacon JS). Qui si
// classifica solo lo User-Agent della richiesta (nessun dato personale, nessun
// IP salvato) in una manciata di categorie note, e si incrementa un contatore
// aggregato — coerente con la policy privacy del sito (solo conteggi anonimi).
import "server-only";
import { redis } from "./redis";

const BOT_KEY = "mi:bots";

export type BotCategory =
  | "gptbot"
  | "claudebot"
  | "perplexity"
  | "googlebot"
  | "bingbot"
  | "meta"
  | "other";

// Ordine rilevante: i pattern specifici (AI/answer-engine noti) vengono
// controllati prima del pattern generico, così un bot nominato finisce nella
// sua categoria e non nel bucket "other".
const NAMED_RULES: [RegExp, BotCategory][] = [
  [/GPTBot|ChatGPT-User|OAI-SearchBot/i, "gptbot"],
  [/ClaudeBot|Claude-Web|anthropic-ai/i, "claudebot"],
  [/PerplexityBot|Perplexity-User/i, "perplexity"],
  [/Googlebot|Google-Extended|GoogleOther/i, "googlebot"],
  [/bingbot|BingPreview/i, "bingbot"],
  [/Meta-ExternalAgent|facebookexternalhit/i, "meta"],
];

// Bucket generico: altri crawler/bot noti (SEO, social preview, addestramento
// LLM) che non hanno una categoria dedicata sopra.
const GENERIC_BOT =
  /bot|spider|crawl|slurp|CCBot|DuckAssistBot|cohere-ai|Applebot|WhatsApp|TelegramBot|Discordbot|Twitterbot|LinkedInBot|SkypeUriPreview|Slackbot|Yandex|Baiduspider|curl\/|python-requests|Go-http-client|okhttp|node-fetch|axios\//i;

export function classifyBot(userAgent: string): BotCategory | null {
  if (!userAgent) return null;
  for (const [re, category] of NAMED_RULES) {
    if (re.test(userAgent)) return category;
  }
  if (GENERIC_BOT.test(userAgent)) return "other";
  return null;
}

export async function bumpBot(category: BotCategory): Promise<void> {
  if (!redis) return;
  const p = redis.pipeline();
  p.hincrby(BOT_KEY, "total", 1);
  p.hincrby(BOT_KEY, category, 1);
  await p.exec();
}

export async function getBotStats(): Promise<Record<string, number> | null> {
  if (!redis) return null;
  const h = await redis.hgetall<Record<string, string | number>>(BOT_KEY);
  if (!h) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(h)) out[k] = Number(v) || 0;
  return out;
}
