"use client";

import { trackEvent } from "@/lib/track";
import { PLAY_URL, PLAY_AVAILABLE } from "@/lib/site";
import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STR = {
  it: { label: "Installa l'app", short: "Installa", play: "Google Play" },
  en: { label: "Install the app", short: "Install", play: "Google Play" },
} as const;

// Pulsante "Installa app": appare solo quando il browser segnala che la PWA è
// installabile (evento beforeinstallprompt) e non è già installata.
// Su Android, se l'app è pubblica sul Play (PLAY_AVAILABLE), diventa invece un
// link diretto al Play Store.
export function InstallButton({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [android] = useState(
    () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
  );

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

  // Android + app pubblica sul Play → link allo Store (sempre visibile, non
  // legato a beforeinstallprompt).
  if (PLAY_AVAILABLE && android) {
    return (
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="m3-chip bg-primary text-on-primary hover:scale-105 transition-transform"
        aria-label={t.label}
      >
        ▶️ <span className="hidden sm:inline">{t.play}</span>
      </a>
    );
  }

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
