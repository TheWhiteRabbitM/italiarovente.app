"use client";

import { fmtTemp, fmtAnomaly } from "@/lib/format";
import { useUnit } from "./UnitProvider";

// Wrapper client per mostrare una temperatura/delta nell'unità scelta
// dall'utente (localStorage tramite UnitProvider), usabile come figlio di
// Server Component che fanno il fetch dati lato server (che non possono
// chiamare useUnit() direttamente).
export function Temp({
  value,
  digits = 1,
  delta = false,
  locale,
  showUnit,
}: {
  value: number | null | undefined;
  digits?: number;
  delta?: boolean;
  locale?: "it" | "en";
  showUnit?: boolean;
}) {
  const { unit } = useUnit();
  if (value === null || value === undefined || Number.isNaN(value)) return <>–</>;
  if (delta) return <>{fmtAnomaly(value, digits, unit, { locale, showUnit })}</>;
  return <>{fmtTemp(value, digits, unit, { locale })}</>;
}
