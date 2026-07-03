"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Curiosity = {
  eyebrow: string;
  pageTitle: string;
  bigText: string;
  bigColor: string;
  subLine: string;
  citySlug: string;
  cityName: string;
  kind: string;
};

const ROTATE_MS = 7000;
const FADE_MS = 350;
const POOL_SIZE = 6;

// Hero che alterna il dato nazionale (sempre il primo, per SEO e caricamento
// senza JS) a curiosità pescate a caso dalle città — "un hero a rotazione",
// non una card separata sotto. Nessuna chiamata a Open-Meteo: le curiosità
// vengono tutte dallo snapshot già in cache (vedi src/lib/curiosities.ts).
export function RotatingHero({
  lang,
  defaultHeadline,
  defaultBig,
  defaultCaption,
  defaultColor,
}: {
  lang: "it" | "en";
  defaultHeadline: string;
  defaultBig: React.ReactNode;
  defaultCaption: string;
  defaultColor: string;
}) {
  const [pool, setPool] = useState<Curiosity[]>([]);
  const [index, setIndex] = useState(-1); // -1 = dato nazionale (default)
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch(`/api/curiosity/random?lang=${lang}&count=${POOL_SIZE}`)
      .then((r) => r.json())
      .then((data) => setPool(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (pool.length === 0) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i >= pool.length - 1 ? -1 : i + 1));
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [pool]);

  const current = index >= 0 ? pool[index] : null;
  const cityHref = current ? `${lang === "en" ? "/en" : ""}/citta/${current.citySlug}` : null;
  const fade = `transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`;

  return (
    <>
      <h1
        className={`text-4xl sm:text-6xl font-extrabold tracking-tighter leading-[1.02] max-w-3xl mx-auto ${fade}`}
      >
        {current && cityHref ? (
          <Link href={cityHref} className="hover:underline decoration-4 underline-offset-4">
            {current.pageTitle}
          </Link>
        ) : (
          <span className="bg-gradient-to-r from-[var(--on-surface)] to-[var(--primary)] bg-clip-text text-transparent">
            {defaultHeadline}
          </span>
        )}
      </h1>

      <div className={`mt-6 flex flex-col items-center ${fade}`}>
        <div
          className="text-7xl sm:text-8xl font-extrabold tracking-tighter leading-none"
          style={{ color: current ? current.bigColor : defaultColor }}
        >
          {current ? current.bigText : defaultBig}
        </div>
        <div className="text-sm sm:text-base font-bold text-on-surface-variant mt-1">
          {current ? current.subLine : defaultCaption}
        </div>
      </div>
    </>
  );
}
