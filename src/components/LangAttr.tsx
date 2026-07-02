"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Keeps <html lang> in sync with the active locale without forcing the root
// layout into dynamic rendering. hreflang alternates remain the primary
// SEO signal; this fixes accessibility (screen readers) and JS-rendered SEO.
export function LangAttr() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    document.documentElement.lang = pathname.startsWith("/en") ? "en" : "it";
  }, [pathname]);

  return null;
}
