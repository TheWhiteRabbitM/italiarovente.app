"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STR = {
  it: {
    title: "Pagina non trovata",
    body: "La città o la pagina che cerchi non esiste.",
    back: "← Torna alla home",
    home: "/",
  },
  en: {
    title: "Page not found",
    body: "The city or page you're looking for doesn't exist.",
    back: "← Back to home",
    home: "/en",
  },
} as const;

export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const t = STR[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
      <div className="text-7xl mb-4">🧭</div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">
        {t.title}
      </h1>
      <p className="text-on-surface-variant mb-6">
        {t.body}
      </p>
      <Link
        href={t.home}
        className="m3-chip bg-primary text-on-primary text-base px-6 py-3"
      >
        {t.back}
      </Link>
    </div>
  );
}
