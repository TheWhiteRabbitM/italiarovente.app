"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openAppMenu } from "./AppMenu";

// Icone line (stile Lucide), ereditano il colore dal tab (currentColor).
const ICONS: Record<string, React.ReactNode> = {
  oggi: <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />,
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
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
};

const TABS_IT = [
  { href: "/", label: "Oggi", key: "oggi", match: (p: string) => p === "/" },
  { href: "/citta", label: "Città", key: "citta", match: (p: string) => p.startsWith("/citta") },
  { href: "/regioni", label: "Regioni", key: "regioni", match: (p: string) => p.startsWith("/regioni") },
  { href: "/clima", label: "Clima", key: "clima", match: (p: string) => p === "/clima" },
  { href: "/confronto", label: "Confronto", key: "confronto", match: (p: string) => p === "/confronto" },
];

const TABS_EN = [
  { href: "/en", label: "Today", key: "oggi", match: (p: string) => p === "/en" },
  { href: "/en/citta", label: "Cities", key: "citta", match: (p: string) => p.startsWith("/en/citta") },
  { href: "/en/regioni", label: "Regions", key: "regioni", match: (p: string) => p.startsWith("/en/regioni") },
  { href: "/en/clima", label: "Climate", key: "clima", match: (p: string) => p === "/en/clima" },
  { href: "/en/confronto", label: "Compare", key: "confronto", match: (p: string) => p === "/en/confronto" },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const TABS = lang === "en" ? TABS_EN : TABS_IT;
  return (
    <nav className="bottom-nav" aria-label={lang === "en" ? "App navigation" : "Navigazione app"}>
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="bottom-nav-item"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? 2.4 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="bottom-nav-icon"
            >
              {ICONS[t.key]}
            </svg>
            <span className="bottom-nav-label">{t.label}</span>
          </Link>
        );
      })}
      {/* Menu completo: dà accesso alle pagine che non stanno nei 5 tab
          (Classifiche, Mese, Europa, Quiz, Dati...), altrimenti irraggiungibili
          in PWA dove header-nav e footer sono nascosti. */}
      <button
        type="button"
        onClick={openAppMenu}
        className="bottom-nav-item appearance-none bg-transparent border-0 cursor-pointer"
        aria-label={lang === "en" ? "Open menu" : "Apri menu"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="bottom-nav-icon"
        >
          {ICONS.menu}
        </svg>
        <span className="bottom-nav-label">Menu</span>
      </button>
    </nav>
  );
}
