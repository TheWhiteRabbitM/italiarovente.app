"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { setInstallOpen } from "@/lib/popups";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mi_install_dismissed";
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function recentlyDismissed() {
  const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

const STR = {
  it: {
    dialogLabel: "Installa l'app",
    title: "Installa Italia Rovente",
    iosHint: "Tocca Condividi ⬆️ e poi «Aggiungi a Home»",
    androidHint: "Aprila al volo, anche offline — come un'app",
    install: "Installa",
    close: "Chiudi",
  },
  en: {
    dialogLabel: "Install the app",
    title: "Install Italia Rovente",
    iosHint: "Tap Share ⬆️ then “Add to Home Screen”",
    androidHint: "Open it instantly, even offline — like an app",
    install: "Install",
    close: "Close",
  },
} as const;

// Suggerisce l'installazione della PWA su mobile, dopo qualche secondo.
// Android/Chrome: pulsante "Installa" nativo. iOS: istruzioni "Aggiungi a Home".
// Renderizzato una sola volta in layout.tsx (Server Component, non conosce il
// pathname) quindi la lingua si autorileva qui, come Header/Footer/BottomNav.
export function InstallPrompt() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const t = STR[lang];
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || !isMobile() || recentlyDismissed()) return;

    const onIos = isIOS();
    setIos(onIos);
    let captured: BIPEvent | null = null;
    let elapsed = false;

    const maybeOpen = () => {
      if (elapsed && (captured || onIos) && !recentlyDismissed()) setOpen(true);
    };
    const onBIP = (e: Event) => {
      e.preventDefault();
      captured = e as BIPEvent;
      setDeferred(captured);
      maybeOpen();
    };
    const onInstalled = () => setOpen(false);

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const t = setTimeout(() => {
      elapsed = true;
      maybeOpen();
    }, 5000);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  }
  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    dismiss();
  }

  // Segnala lo stato al coordinatore dei popup (l'install ha priorità).
  useEffect(() => {
    setInstallOpen(open);
    return () => setInstallOpen(false);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] p-3 install-prompt"
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label={t.dialogLabel}
    >
      <div className="m3-card mx-auto max-w-md p-3.5 flex items-center gap-3 shadow-lg">
        <Logo size={46} className="shrink-0 rounded-2xl" />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold leading-tight">{t.title}</div>
          <div className="text-xs text-on-surface-variant leading-snug">
            {ios ? t.iosHint : t.androidHint}
          </div>
        </div>
        {!ios && (
          <button
            onClick={install}
            className="m3-chip bg-primary text-on-primary px-4 py-2.5 shrink-0 active:scale-95 transition-transform"
          >
            {t.install}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label={t.close}
          className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
