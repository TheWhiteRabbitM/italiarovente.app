"use client";

import { trackEvent } from "@/lib/track";
import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STR = {
  it: { label: "Installa l'app", short: "Installa" },
  en: { label: "Install the app", short: "Install" },
} as const;

// Pulsante "Installa app": appare solo quando il browser segnala che la PWA è
// installabile (evento beforeinstallprompt) e non è già installata.
export function InstallButton({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      trackEvent("pwa_install");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice.catch(() => {});
        setDeferred(null);
      }}
      className="m3-chip bg-primary text-on-primary hover:scale-105 transition-transform"
      aria-label={t.label}
    >
      ⬇️ <span className="hidden sm:inline">{t.short}</span>
    </button>
  );
}
