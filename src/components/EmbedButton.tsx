"use client";

import { useState } from "react";

const STR = {
  it: {
    toggle: "Incorpora questo grafico sul tuo sito",
    hint: "Copia e incolla questo codice sul tuo sito o blog. Il widget si aggiorna da solo e linka sempre alla fonte.",
    copy: "Copia codice",
    copied: "✓ Copiato!",
  },
  en: {
    toggle: "Embed this chart on your site",
    hint: "Copy and paste this code onto your site or blog. The widget updates itself and always links back to the source.",
    copy: "Copy code",
    copied: "✓ Copied!",
  },
} as const;

export function EmbedButton({
  citySlug,
  lang = "it",
}: {
  citySlug: string;
  lang?: "it" | "en";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = STR[lang];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedPath = lang === "en" ? `/en/embed/${citySlug}` : `/embed/${citySlug}`;
  const snippet = `<iframe src="${origin}${embedPath}" width="380" height="140" style="border:0;border-radius:16px;overflow:hidden" loading="lazy" title="Warming stripes ${citySlug}"></iframe>`;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs"
      >
        {"</>"} {t.toggle}
      </button>
      {open && (
        <div className="m3-card p-4 mt-3">
          <p className="text-xs text-on-surface-variant mb-2">{t.hint}</p>
          <textarea
            readOnly
            value={snippet}
            rows={3}
            className="w-full rounded-xl bg-surface-container-highest border border-[var(--outline-variant)] p-2.5 text-xs font-mono text-on-surface-variant"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="m3-chip bg-primary text-on-primary text-xs mt-2"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
    </div>
  );
}
