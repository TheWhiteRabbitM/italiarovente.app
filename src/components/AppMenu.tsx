"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";

// Evento globale per aprire il menu: BottomNav (tab "Menu") e Header (hamburger
// su mobile) lo lanciano, questo componente — montato una volta sola in
// layout — lo ascolta. Niente context né prop-drilling per un pannello che ha
// due punti d'ingresso.
export const OPEN_APP_MENU = "open-app-menu";
export function openAppMenu() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_APP_MENU));
}

// Icone line (stile Lucide), ereditano il colore dal testo (currentColor).
const ICON: Record<string, React.ReactNode> = {
  oggi: <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />,
  citta: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  regioni: (
    <>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </>
  ),
  clima: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  confronto: (
    <>
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="10" />
    </>
  ),
  classifiche: (
    <>
      <path d="M4 20h4v-8H4zM10 20h4V4h-4zM16 20h4v-5h-4z" />
    </>
  ),
  mese: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </>
  ),
  europa: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 1 1 4 2.5c-.9.5-1.2 1-1.2 1.8" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </>
  ),
  dati: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  api: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  disclaimer: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12" y2="16.01" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
};

type Item = { key: string; href: string; it: string; en: string };

// Ordine del menu: le sezioni principali prima, poi gli approfondimenti, poi
// gli strumenti. È l'indice completo del sito, non un doppione della bottom-nav.
const ITEMS: Item[] = [
  { key: "oggi", href: "/", it: "Oggi", en: "Today" },
  { key: "citta", href: "/citta", it: "Città", en: "Cities" },
  { key: "regioni", href: "/regioni", it: "Regioni", en: "Regions" },
  { key: "clima", href: "/clima", it: "Clima", en: "Climate" },
  { key: "confronto", href: "/confronto", it: "Confronto", en: "Compare" },
  { key: "classifiche", href: "/classifiche", it: "Classifiche", en: "Rankings" },
  { key: "mese", href: "/mese", it: "Il mese", en: "The month" },
  { key: "europa", href: "/europa", it: "Italia vs Europa", en: "Italy vs Europe" },
  { key: "quiz", href: "/quiz", it: "Quiz", en: "Quiz" },
  { key: "dati", href: "/dati", it: "Dati aperti", en: "Open data" },
  { key: "api", href: "/dati/api", it: "API pubblica", en: "Public API" },
  { key: "disclaimer", href: "/disclaimer", it: "Disclaimer", en: "Disclaimer" },
];

const STR = {
  it: { title: "Menu", nav: "Naviga", tools: "Strumenti", share: "Condividi l'app", close: "Chiudi", shareText: "Italia Rovente — le temperature italiane dal 1940, i dati non le opinioni." },
  en: { title: "Menu", nav: "Navigate", tools: "Tools", share: "Share the app", close: "Close", shareText: "Italia Rovente — Italian temperatures since 1940, the data not the opinions." },
} as const;

function LineIcon({ k, size = 22 }: { k: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON[k]}
    </svg>
  );
}

export function AppMenu() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const base = lang === "en" ? "/en" : "";
  const t = STR[lang];
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_APP_MENU, onOpen);
    return () => window.removeEventListener(OPEN_APP_MENU, onOpen);
  }, []);

  // Chiudi con Esc e blocca lo scroll del body mentre il pannello è aperto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.origin + base : base;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Italia Rovente", text: t.shareText, url });
        trackEvent("share", { where: "app" });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        trackEvent("share", { where: "app" });
      }
    } catch {
      /* l'utente ha annullato: nessun errore da mostrare */
    }
    close();
  }, [base, t.shareText, close]);

  if (!open) return null;

  const active = (href: string) => {
    const full = href === "/" ? base || "/" : `${base}${href}`;
    return href === "/" ? pathname === full : pathname === full || pathname.startsWith(full + "/");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={t.title}>
      {/* Overlay */}
      <button
        aria-label={t.close}
        onClick={close}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      {/* Pannello */}
      <div
        className="relative bg-[var(--surface-container)] rounded-t-3xl border-t border-[var(--outline-variant)] shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="sticky top-0 bg-[var(--surface-container)] flex items-center justify-between px-5 pt-3 pb-2">
          <div className="mx-auto absolute left-1/2 -translate-x-1/2 top-1.5 h-1 w-10 rounded-full bg-[var(--outline-variant)]" />
          <h2 className="text-lg font-extrabold tracking-tight mt-2">{t.title}</h2>
          <button
            onClick={close}
            aria-label={t.close}
            className="mt-2 w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
          >
            <LineIcon k="close" size={20} />
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide px-1 mb-2">{t.nav}</div>
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.map((it) => (
              <Link
                key={it.key}
                href={`${base}${it.href === "/" ? "" : it.href}` || "/"}
                onClick={close}
                data-active={active(it.href)}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container transition-colors data-[active=true]:bg-primary-container data-[active=true]:text-on-primary-container"
              >
                <LineIcon k={it.key} />
                <span className="font-semibold text-sm truncate">{lang === "en" ? it.en : it.it}</span>
              </Link>
            ))}
          </div>

          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wide px-1 mt-4 mb-2">{t.tools}</div>
          <button
            onClick={share}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 bg-surface-container-high hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
          >
            <LineIcon k="share" />
            <span className="font-semibold text-sm">{t.share}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
