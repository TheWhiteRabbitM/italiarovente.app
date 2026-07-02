"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CITIES, cityName } from "@/lib/cities";
import { VoteWidget } from "./VoteWidget";
import { isInstallOpen, onInstallClosed } from "@/lib/popups";

const STR = {
  it: { fab: "Dì la tua", close: "Chiudi", scopeFallback: "Italia" },
  en: { fab: "Have your say", close: "Close", scopeFallback: "Italy" },
} as const;

// "Di la tua" come popup: appare dopo 10s (una volta per sessione), è
// contestuale alla città se sei su una pagina città, e resta riapribile con un
// pulsante flottante.
export function VotePopup() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const match = pathname.match(/^\/(?:en\/)?citta\/([^/]+)/);
  const city = match ? CITIES.find((c) => c.slug === match[1]) : undefined;
  const citySlug = city?.slug;
  const scopeLabel = city ? cityName(city, lang) : t.scopeFallback;

  useEffect(() => {
    setMounted(true);
    const seen = sessionStorage.getItem("mi_popup_seen");
    if (seen) return;
    let offClosed: (() => void) | undefined;
    const show = () => {
      setOpen(true);
      sessionStorage.setItem("mi_popup_seen", "1");
    };
    const t = setTimeout(() => {
      // Non sovrapporsi al popup di installazione: se è aperto, aspetta che si
      // chiuda, poi mostra il voto con un piccolo ritardo.
      if (isInstallOpen()) {
        offClosed = onInstallClosed(() => setTimeout(show, 700));
      } else {
        show();
      }
    }, 10000);
    return () => {
      clearTimeout(t);
      offClosed?.();
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Pulsante flottante per (ri)aprire */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="vote-fab fixed z-40 bottom-4 right-4 m3-chip bg-primary text-on-primary px-5 py-3 text-sm shadow-lg hover:scale-105 active:scale-95 transition-transform"
          style={{ boxShadow: "var(--shadow-lift)" }}
          aria-label={t.fab}
        >
          💬 {t.fab}
        </button>
      )}

      {/* Popup */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_.25s_ease]"
            onClick={() => setOpen(false)}
            aria-label={t.close}
          />
          <div className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] popup-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 right-3 sm:-top-3 sm:-right-3 z-10 w-9 h-9 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold shadow-md hover:scale-110 transition-transform border border-[var(--outline-variant)]"
              aria-label={t.close}
            >
              ✕
            </button>
            <VoteWidget citySlug={citySlug} scopeLabel={scopeLabel} lang={lang} />
          </div>
        </div>
      )}
    </>
  );
}
