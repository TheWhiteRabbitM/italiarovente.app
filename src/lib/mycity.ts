// Preferenza "la mia città": solo localStorage, nessun account, nessun dato
// inviato al server finché non si chiede lo snapshot (e in quel caso è solo
// lo slug nell'URL, come già succede visitando /citta/[slug]).
const KEY = "mi:my-city";

export function getMyCity(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setMyCity(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    /* ignora (storage pieno/bloccato) */
  }
}

export function clearMyCity(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
