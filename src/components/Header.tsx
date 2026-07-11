"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VisitCounter } from "./VisitCounter";
import { InstallButton } from "./InstallButton";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UnitToggle } from "./UnitToggle";
import { LangToggle } from "./LangToggle";
import { openAppMenu } from "./AppMenu";
import { SITE_TAGLINE, SITE_TAGLINE_EN } from "@/lib/site";

const STR = {
  it: { citta: "Città", regioni: "Regioni", confronto: "Confronto", clima: "Clima", classifiche: "Classifiche", mese: "Il mese", tagline: SITE_TAGLINE },
  en: { citta: "Cities", regioni: "Regions", confronto: "Compare", clima: "Climate", classifiche: "Rankings", mese: "The month", tagline: SITE_TAGLINE_EN },
} as const;

export function Header() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const p = (path: string) => (lang === "en" ? `/en${path}` : path);
  const t = STR[lang];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--surface)]/70 border-b border-[var(--outline-variant)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={lang === "en" ? "/en" : "/"} className="flex items-center gap-2.5 group min-w-0">
          <Logo
            size={32}
            className="transition-transform group-hover:scale-110 shrink-0"
          />
          <span className="hidden sm:flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-lg leading-tight tracking-tight">
              Italia<span className="text-primary">Rovente</span>
            </span>
            <span className="hidden md:block text-[10px] leading-tight text-on-surface-variant truncate">
              {t.tagline}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LangToggle />
          <UnitToggle lang={lang} />
          <ThemeToggle lang={lang} />
          <nav className="app-hide-standalone flex items-center gap-1 sm:gap-2 text-sm font-semibold">
            {/* Hamburger: solo su mobile browser, dove le voci testuali qui
                sotto sono nascoste (md:inline-flex). Apre il menu completo. */}
            <button
              type="button"
              onClick={openAppMenu}
              aria-label={lang === "en" ? "Open menu" : "Apri menu"}
              className="md:hidden m3-chip bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors w-9 h-9 !p-0 flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            <InstallButton lang={lang} />
          <span className="hidden sm:inline-flex">
            <VisitCounter compact lang={lang} />
          </span>
          <Link
            href={p("/citta")}
            className="m3-chip bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            {t.citta}
          </Link>
          <span className="hidden md:inline-flex">
            <Link
              href={p("/regioni")}
              className="m3-chip bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              {t.regioni}
            </Link>
          </span>
          <Link
            href={p("/confronto")}
            className="m3-chip bg-surface-container-high text-on-surface hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
          >
            {t.confronto}
          </Link>
          <Link
            href={p("/clima")}
            className="m3-chip bg-surface-container-high text-on-surface hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
          >
            {t.clima}
          </Link>
          <span className="hidden md:inline-flex">
            <Link
              href={p("/classifiche")}
              className="m3-chip bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              {t.classifiche}
            </Link>
          </span>
          <span className="hidden md:inline-flex">
            <Link
              href={p("/mese")}
              className="m3-chip bg-surface-container-high text-on-surface hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
            >
              {t.mese}
            </Link>
          </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
