"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

const SUN = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>
);
const MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;

const STR = {
  it: { toLight: "Passa al tema chiaro", toDark: "Passa al tema scuro" },
  en: { toLight: "Switch to light theme", toDark: "Switch to dark theme" },
} as const;

export function ThemeToggle({ lang = "it" }: { lang?: "it" | "en" }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const t = STR[lang];

  useEffect(() => {
    setMounted(true);
    const current =
      (document.documentElement.dataset.theme as Theme | undefined) ?? "dark";
    setTheme(current);
  }, []);

  if (!mounted) return <span className="w-9 h-9 inline-block" aria-hidden />;

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? t.toLight : t.toDark;

  return (
    <button
      onClick={() => {
        setTheme(next);
        apply(next);
      }}
      className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors"
      title={label}
      aria-label={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {theme === "dark" ? MOON : SUN}
      </svg>
    </button>
  );
}
