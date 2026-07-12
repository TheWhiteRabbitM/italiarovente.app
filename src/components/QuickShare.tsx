"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/track";

const STR = {
  it: { share: "Condividi", copied: "Copiato!" },
  en: { share: "Share", copied: "Copied!" },
} as const;

// Condivisione leggera per un singolo dato/curiosità (non l'intera pagina):
// Web Share nativo dove disponibile, altrimenti copia testo+link. Nessuna
// immagine da generare — pensato per essere leggero e stare dentro le card.
export function QuickShare({
  text,
  url,
  lang = "it",
}: {
  text: string;
  url: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Italia Rovente", text, url });
        trackEvent("share", { where: "curiosity" });
      } catch {
        /* annullato dall'utente */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("share", { where: "curiosity" });
    } catch {
      /* ignora */
    }
  }

  return (
    <button
      onClick={share}
      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? t.copied : t.share}
    </button>
  );
}
