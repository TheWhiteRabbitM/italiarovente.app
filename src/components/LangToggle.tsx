"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Passa alla versione italiana/inglese della PAGINA CORRENTE (non alla home):
// gli alberi /citta/[slug] <-> /en/citta/[slug] ecc. sono rotte gemelle allo
// stesso path, quindi basta aggiungere/togliere il prefisso "/en".
function otherLangHref(pathname: string): string {
  if (pathname.startsWith("/en")) {
    const rest = pathname.slice(3);
    return rest === "" ? "/" : rest;
  }
  return pathname === "/" ? "/en" : `/en${pathname}`;
}

export function LangToggle() {
  const pathname = usePathname() ?? "/";
  const isEn = pathname.startsWith("/en");
  const label = isEn ? "IT" : "EN";
  const title = isEn ? "Passa all'italiano" : "Switch to English";

  return (
    <Link
      href={otherLangHref(pathname)}
      className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors font-extrabold text-xs"
      title={title}
      aria-label={title}
    >
      {label}
    </Link>
  );
}
