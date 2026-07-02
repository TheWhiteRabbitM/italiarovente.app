"use client";

import { useState } from "react";

const STR = {
  it: {
    whatsapp: "Condividi su WhatsApp",
    x: "Condividi su X",
    facebook: "Condividi su Facebook",
    telegram: "Condividi su Telegram",
    copyLink: "Copia link",
    downloadStory: "Scarica immagine per le Storie",
    otherApps: "Altre app",
  },
  en: {
    whatsapp: "Share on WhatsApp",
    x: "Share on X",
    facebook: "Share on Facebook",
    telegram: "Share on Telegram",
    copyLink: "Copy link",
    downloadStory: "Download image for Stories",
    otherApps: "Other apps",
  },
} as const;

export function ShareButtons({
  url,
  text,
  storyUrl,
  downloadName,
  lang = "it",
}: {
  url: string;
  text: string;
  storyUrl: string;
  downloadName: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const whatsapp = `https://wa.me/?text=${enc(`${text} ${url}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
  const telegram = `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignora */
    }
  }

  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title: "Italia Rovente", text, url });
    } catch {
      /* annullato dall'utente */
    }
  }

  const btn =
    "w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest hover:scale-110 transition-all";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btn} title="WhatsApp" aria-label={t.whatsapp}>
        <BrandIcon d={ICONS.whatsapp} />
      </a>
      <a href={x} target="_blank" rel="noopener noreferrer" className={btn} title="X / Twitter" aria-label={t.x}>
        <BrandIcon d={ICONS.x} />
      </a>
      <a href={facebook} target="_blank" rel="noopener noreferrer" className={btn} title="Facebook" aria-label={t.facebook}>
        <BrandIcon d={ICONS.facebook} />
      </a>
      <a href={telegram} target="_blank" rel="noopener noreferrer" className={btn} title="Telegram" aria-label={t.telegram}>
        <BrandIcon d={ICONS.telegram} />
      </a>
      <button onClick={copyLink} className={btn} title={t.copyLink} aria-label={t.copyLink}>
        {copied ? (
          <LineIcon>
            <path d="M20 6 9 17l-5-5" />
          </LineIcon>
        ) : (
          <LineIcon>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </LineIcon>
        )}
      </button>
      <a
        href={storyUrl}
        download={downloadName}
        className={btn}
        title={t.downloadStory}
        aria-label={t.downloadStory}
      >
        <LineIcon>
          <path d="M12 15V3" />
          <path d="m7 10 5 5 5-5" />
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        </LineIcon>
      </a>
      <button onClick={nativeShare} className={`${btn} sm:hidden`} title={t.otherApps} aria-label={t.otherApps}>
        <LineIcon>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </LineIcon>
      </button>
    </div>
  );
}

// Icone brand (path pieni, da glifi ufficiali semplificati — currentColor).
const ICONS = {
  whatsapp:
    "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.36-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.9 9.88m8.42-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.33-1.66a11.88 11.88 0 0 0 5.66 1.44h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.48-8.4",
  x: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z",
  facebook:
    "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07",
  telegram:
    "M11.94 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.06 0m4.96 7.22c.1 0 .32.02.46.14a.5.5 0 0 1 .17.33c.02.1.04.32.02.5-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.06-1.23-.46-1.9-.9-1.06-.7-1.66-1.13-2.69-1.81-1.19-.78-.42-1.21.26-1.91.18-.18 3.25-2.98 3.31-3.23.01-.03.01-.15-.06-.21s-.18-.04-.25-.02c-.11.02-1.8 1.14-5.08 3.35-.48.33-.92.49-1.31.48-.43-.01-1.26-.24-1.87-.44-.76-.25-1.36-.38-1.3-.8.02-.22.32-.44.9-.68 3.53-1.54 5.88-2.55 7.06-3.04 3.36-1.4 4.06-1.64 4.51-1.65",
} as const;

function BrandIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function LineIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}
