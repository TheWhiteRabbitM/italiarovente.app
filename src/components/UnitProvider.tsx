"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Unit } from "@/lib/format";

const UnitContext = createContext<{ unit: Unit; setUnit: (u: Unit) => void }>({
  unit: "c",
  setUnit: () => {},
});

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<Unit>("c");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("unit");
      if (stored === "f" || stored === "c") setUnitState(stored);
    } catch {
      // localStorage non disponibile (privacy mode ecc.): resta su "c".
    }
  }, []);

  const setUnit = (u: Unit) => {
    setUnitState(u);
    try {
      localStorage.setItem("unit", u);
    } catch {
      // no-op
    }
  };

  return (
    <UnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
