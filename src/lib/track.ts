import { track } from "@vercel/analytics";

// Eventi personalizzati per Vercel Web Analytics: oltre alle pagine viste,
// registrano le AZIONI che contano (voto, condivisione, installazione, push).
//
// Policy privacy, deliberata e coerente col resto del sito: solo eventi
// anonimi e aggregati. Nessun identificativo utente, nessun dato personale.
// Le uniche proprietà ammesse sono valori pubblici e non identificanti — lo
// slug di una città, il tipo di voto — mai un IP, un id o testo scritto
// dall'utente. Vercel Analytics è già senza cookie e non traccia PII: qui non
// aggiungiamo nulla che lo cambi.
//
// Wrapper sottile: un unico punto dove vive la policy, e un no-op sicuro se lo
// script analytics non è caricato (adblock, sviluppo locale) — un evento non
// deve mai far fallire l'interazione che lo ha generato.

export type AppEvent =
  | "vote" // { kind: confirm|deny|hot|cold }
  | "share" // { where?: city|app|curiosity }
  | "pwa_install"
  | "push_subscribe"
  | "quiz_complete"; // { score: 0..5 }

type Props = Record<string, string | number | boolean>;

export function trackEvent(event: AppEvent, props?: Props): void {
  try {
    track(event, props);
  } catch {
    /* analytics non disponibile: silenzioso di proposito */
  }
}
