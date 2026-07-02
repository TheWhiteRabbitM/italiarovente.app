"use client";

import { useEffect, useState } from "react";
import type { Unit } from "@/lib/format";
import { useUnit } from "./UnitProvider";

const STR = {
  it: { toF: "Passa a Fahrenheit", toC: "Passa a Celsius" },
  en: { toF: "Switch to Fahrenheit", toC: "Switch to Celsius" },
} as const;

export function UnitToggle({ lang = "it" }: { lang?: "it" | "en" }) {
  const { unit, setUnit } = useUnit();
  const [mounted, setMounted] = useState(false);
  const t = STR[lang];

  useEffect(() => setMounted(true), []);

  if (!mounted) return <span className="w-9 h-9 inline-block" aria-hidden />;

  const next: Unit = unit === "c" ? "f" : "c";
  const label = unit === "c" ? t.toF : t.toC;

  return (
    <button
      onClick={() => setUnit(next)}
      className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors font-extrabold text-xs"
      title={label}
      aria-label={label}
    >
      °{unit.toUpperCase()}
    </button>
  );
}
