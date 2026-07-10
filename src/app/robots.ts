import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawler AI/answer-engine noti, allow esplicito: il sito è pensato per
// essere citato dalle AI quando qualcuno chiede del riscaldamento in Italia
// (vedi anche /llms.txt). Il default "*" li permetterebbe comunque, ma un
// allow esplicito documenta l'intento e resta valido anche se in futuro si
// restringe la regola generale per altri bot.
const AI_BOTS = [
  "GPTBot", // OpenAI (training + browsing)
  "ChatGPT-User", // OpenAI (browsing on behalf of a user)
  "OAI-SearchBot", // OpenAI (ChatGPT search)
  "ClaudeBot", // Anthropic (crawling)
  "Claude-Web", // Anthropic (browsing on behalf of a user)
  "anthropic-ai", // Anthropic (legacy UA)
  "PerplexityBot", // Perplexity
  "Perplexity-User",
  "Google-Extended", // Gemini/Bard training + grounding
  "GoogleOther",
  "Applebot-Extended", // Apple Intelligence
  "Bingbot", // Copilot
  "CCBot", // Common Crawl (usato per addestrare molti LLM)
  "cohere-ai",
  "DuckAssistBot",
  "Meta-ExternalAgent",
];

// Le API pubbliche in sola lettura vanno PERMESSE esplicitamente: il
// `disallow: /api/` qui sotto le nasconderebbe proprio ai crawler AI per cui
// esistono. Le regole robots si risolvono per specificità (vince il match più
// lungo), quindi questi allow battono il disallow generale.
//
// Tutto il resto sotto /api/ resta chiuso, e deve restarci: /api/ask consuma un
// LLM a pagamento, /api/vote e /api/visit scrivono, /api/push/subscribe tratta
// endpoint di notifica, /api/refresh è il cron. Nessuno di questi è idempotente
// o gratuito, e un crawler non deve toccarli.
const PUBLIC_API = ["/api/export/", "/api/openapi.json"];

export default function robots(): MetadataRoute.Robots {
  const allow = ["/", ...PUBLIC_API];
  // /embed/: widget iframe thin, pensati per l'incorporamento su siti
  // terzi (e già noindex via metadata) — fuori dal crawl budget.
  const disallow = ["/api/", "/embed/"];

  return {
    rules: [
      { userAgent: "*", allow, disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
