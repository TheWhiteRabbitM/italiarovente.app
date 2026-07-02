"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { SITE_TAGLINE, SITE_TAGLINE_EN } from "@/lib/site";

const STR = {
  it: {
    brandTagline: SITE_TAGLINE,
    tagline: "Temperature giornaliere e storiche delle principali città italiane, dal 1940 a oggi.",
    source: "Fonte dati",
    sourceText1: "— Storico basato sul reanalysis",
    sourceText2: "; dati attuali da modelli IFS/ICON.",
    project: "Progetto",
    disclaimer: "Disclaimer e metodo",
    license: "Licenza open source (MIT)",
    openData: "Dati aperti (CSV)",
    updates: (
      <>
        I dati si aggiornano <strong>ogni giorno</strong> automaticamente.
      </>
    ),
    bottom: (
      <>
        Dati © Open-Meteo · ERA5 © ECMWF / Copernicus Climate Change Service ·
        Codice open source (MIT). <strong>Uso illustrativo</strong>, non previsioni
        ufficiali — vedi il{" "}
      </>
    ),
    bottomLink: "disclaimer",
  },
  en: {
    brandTagline: SITE_TAGLINE_EN,
    tagline: "Daily and historical temperatures for Italy's major cities, from 1940 to today.",
    source: "Data source",
    sourceText1: "— Historical data based on the",
    sourceText2: "reanalysis; current data from IFS/ICON models.",
    project: "Project",
    disclaimer: "Disclaimer and methodology",
    license: "Open source license (MIT)",
    openData: "Open data (CSV)",
    updates: (
      <>
        Data updates <strong>every day</strong> automatically.
      </>
    ),
    bottom: (
      <>
        Data © Open-Meteo · ERA5 © ECMWF / Copernicus Climate Change Service ·
        Open source code (MIT). <strong>Illustrative use</strong>, not an
        official forecast — see the{" "}
      </>
    ),
    bottomLink: "disclaimer",
  },
} as const;

export function Footer() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const p = (path: string) => (lang === "en" ? `/en${path}` : path);
  const t = STR[lang];

  return (
    <footer className="app-hide-standalone mt-20 border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-base mb-2">
            <Logo size={24} /> Italia<span className="text-primary">Rovente</span>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            <span className="block font-semibold text-on-surface">{t.brandTagline}</span>
            {t.tagline}
          </p>
        </div>
        <div>
          <div className="font-bold mb-2">{t.source}</div>
          <p className="text-on-surface-variant leading-relaxed">
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary font-semibold hover:underline"
            >
              Open-Meteo
            </a>{" "}
            {t.sourceText1} <strong>ERA5 (ECMWF)</strong> {t.sourceText2}
          </p>
        </div>
        <div>
          <div className="font-bold mb-2">{t.project}</div>
          <ul className="text-on-surface-variant leading-relaxed space-y-1">
            <li>
              <Link href={p("/disclaimer")} className="hover:underline font-semibold">
                {t.disclaimer}
              </Link>
            </li>
            <li>
              <Link href={`${p("/disclaimer")}#licenza`} className="hover:underline font-semibold">
                {t.license}
              </Link>
            </li>
            <li>
              <Link href={p("/dati")} className="hover:underline font-semibold">
                {t.openData}
              </Link>
            </li>
            <li>{t.updates}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--outline-variant)] py-4 text-center text-xs text-on-surface-variant px-4">
        {t.bottom}
        <Link href={p("/disclaimer")} className="text-secondary hover:underline">
          {t.bottomLink}
        </Link>
        .
      </div>
    </footer>
  );
}
