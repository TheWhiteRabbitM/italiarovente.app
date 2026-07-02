"use client";

import { usePathname } from "next/navigation";

// Nasconde l'"arredamento" del sito (header, footer, bottom-nav, popup) sulle
// pagine /embed/* — che devono restare un widget pulito e isolato, incorporabile
// in un iframe su siti terzi.
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/embed")) return null;
  return <>{children}</>;
}
