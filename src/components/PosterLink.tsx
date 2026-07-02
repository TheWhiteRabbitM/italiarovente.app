"use client";

import { useEffect, useState } from "react";
import { useUnit } from "./UnitProvider";

// Blocco poster (anteprima + link di download): il poster è generato
// server-side (Satori, poster/route.tsx) e non può leggere
// UnitProvider/localStorage, quindi l'unità scelta dall'utente viene passata
// via query string (?unit=f) — letta da poster/route.tsx con
// new URL(req.url).searchParams. Stesso meccanismo per la lingua (?lang=en,
// dalle pagine /en) e per il tema (?theme=light). Sia l'anteprima <img> che il
// link di download puntano allo stesso URL, così restano sempre coerenti.
export function PosterLink({
  posterUrl,
  downloadName,
  alt,
  label,
  lang = "it",
}: {
  posterUrl: string;
  downloadName: string;
  alt: string;
  label: string;
  lang?: "it" | "en";
}) {
  const { unit } = useUnit();
  // Il tema è su document.documentElement.dataset.theme (impostato dallo script
  // inline pre-idratazione e da ThemeToggle). Osserviamo l'attributo così
  // l'anteprima del poster segue dal vivo il toggle chiaro/scuro dell'utente.
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setTheme(el.dataset.theme === "light" ? "light" : "dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const query = [
    unit === "f" ? "unit=f" : "",
    lang === "en" ? "lang=en" : "",
    theme === "light" ? "theme=light" : "",
  ]
    .filter(Boolean)
    .join("&");
  const href = query ? `${posterUrl}?${query}` : posterUrl;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={href}
        alt={alt}
        className="w-full rounded-2xl border border-[var(--outline-variant)] mb-3"
        loading="lazy"
      />
      <div className="flex justify-center">
        <a
          href={href}
          download={downloadName}
          className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform inline-flex"
        >
          {label}
        </a>
      </div>
    </>
  );
}
