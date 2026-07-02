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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /embed/: widget iframe thin, pensati per l'incorporamento su siti
        // terzi (e già noindex via metadata) — fuori dal crawl budget.
        disallow: ["/api/", "/embed/"],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/embed/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
