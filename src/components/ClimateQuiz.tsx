"use client";

// Quiz del clima — client interattivo. Le domande arrivano dal server già
// costruite (deterministiche per giorno, vedi src/app/quiz/page.tsx): qui solo
// presentazione, feedback e punteggio. Le opzioni che sono DELTA di
// temperatura viaggiano come numeri (°C) e vengono formattate al volo
// nell'unità scelta dall'utente (toggle C/F) — mai stringhe pre-formattate.

import { trackEvent } from "@/lib/track";
import { useState } from "react";
import { useUnit } from "@/components/UnitProvider";
import { fmtAnomaly } from "@/lib/format";

export type QuizQuestionType =
  | "warmestYear"
  | "warmingDelta"
  | "whichCity"
  | "tropicalNights"
  | "decade";

// Un'opzione porta UNO di questi campi: `deltaC` (delta °C, formattato
// client-side con l'unità corrente), `nights`/`decade` (conteggi/decenni,
// etichettati per lingua) oppure `label` (testo già pronto, es. anni o città).
export type QuizOption = {
  label?: string;
  deltaC?: number;
  nights?: number;
  decade?: number;
};

// Numeri veri per la riga di spiegazione (il sito insegna, non gamifica e
// basta): il client li compone nel testo localizzato e nell'unità corrente.
export type QuizExplain = {
  year?: number;
  anomalyC?: number;
  deltaC?: number;
  city?: string;
  deltaC2?: number;
  city2?: string;
  nights?: number;
  decade?: number;
};

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  textParams: { city?: string };
  options: QuizOption[];
  correctIndex: number;
  explain: QuizExplain;
};

type Lang = "it" | "en";
type FmtDelta = (v: number | undefined) => string;

const STR = {
  it: {
    progress: (i: number, n: number) => `Domanda ${i} di ${n}`,
    question: {
      warmestYear: (city: string) => `Qual è stato l'anno più caldo di sempre a ${city}?`,
      warmingDelta: (city: string) =>
        `Di quanto si è scaldata ${city} (normale 1991–2020 vs 1961–1990)?`,
      whichCity: () => "Quale città si è scaldata di più (1991–2020 vs 1961–1990)?",
      tropicalNights: (city: string) =>
        `Quante notti tropicali (minima ≥20°) fa in media ${city} oggi?`,
      decade: (city: string) => `In che decennio ${city} ha avuto la media annua più alta?`,
    },
    explain: {
      warmestYear: (e: QuizExplain, f: FmtDelta) =>
        `È stato il ${e.year}: ${f(e.anomalyC)} rispetto alla normale 1961–1990.`,
      warmingDelta: (e: QuizExplain, f: FmtDelta) =>
        `Tra le due normali climatiche la media annua è salita di ${f(e.deltaC)}.`,
      whichCity: (e: QuizExplain, f: FmtDelta) =>
        `${e.city}: ${f(e.deltaC)} · ${e.city2}: ${f(e.deltaC2)} (1991–2020 vs 1961–1990).`,
      tropicalNights: (e: QuizExplain) =>
        `In media ${e.nights} notti all'anno negli ultimi 5 anni completi.`,
      decade: (e: QuizExplain, f: FmtDelta) =>
        `Gli anni ${e.decade}: ${f(e.anomalyC)} rispetto alla normale 1961–1990.`,
    },
    nightsOpt: (n: number) => `≈ ${n} notti`,
    decadeOpt: (d: number) => `Anni ${d}`,
    correct: "✓ Giusto!",
    wrong: "✗ Non proprio…",
    next: "Prossima domanda →",
    seeResult: "Vedi il risultato →",
    resultHeading: "Il tuo risultato",
    scoreLine: (s: number, n: number) => `${s} su ${n}`,
    titleByScore: (s: number) =>
      s >= 5
        ? "🌡️ Climatologo!"
        : s === 4
          ? "🔥 Espertissimo/a"
          : s === 3
            ? "🌤️ Sulla buona strada"
            : "🧊 C'è da studiare — riprova domani!",
    share: "📤 Condividi il risultato",
    copied: "Copiato negli appunti ✓",
    shareText: (s: number, n: number, url: string) =>
      `Ho fatto ${s}/${n} al quiz del clima di Italia Rovente 🌡️ Prova tu: ${url}`,
    tomorrow: "Il quiz cambia ogni giorno: torna domani per 5 domande nuove.",
  },
  en: {
    progress: (i: number, n: number) => `Question ${i} of ${n}`,
    question: {
      warmestYear: (city: string) => `What was the hottest year on record in ${city}?`,
      warmingDelta: (city: string) =>
        `How much has ${city} warmed (1991–2020 normal vs 1961–1990)?`,
      whichCity: () => "Which city has warmed the most (1991–2020 vs 1961–1990)?",
      tropicalNights: (city: string) =>
        `How many tropical nights (minimum ≥20°C) does ${city} average today?`,
      decade: (city: string) => `In which decade did ${city} have its highest yearly mean?`,
    },
    explain: {
      warmestYear: (e: QuizExplain, f: FmtDelta) =>
        `It was ${e.year}: ${f(e.anomalyC)} vs the 1961–1990 normal.`,
      warmingDelta: (e: QuizExplain, f: FmtDelta) =>
        `Between the two climate normals the yearly mean rose by ${f(e.deltaC)}.`,
      whichCity: (e: QuizExplain, f: FmtDelta) =>
        `${e.city}: ${f(e.deltaC)} · ${e.city2}: ${f(e.deltaC2)} (1991–2020 vs 1961–1990).`,
      tropicalNights: (e: QuizExplain) =>
        `On average ${e.nights} nights per year over the last 5 full years.`,
      decade: (e: QuizExplain, f: FmtDelta) =>
        `The ${e.decade}s: ${f(e.anomalyC)} vs the 1961–1990 normal.`,
    },
    nightsOpt: (n: number) => `≈ ${n} nights`,
    decadeOpt: (d: number) => `${d}s`,
    correct: "✓ Correct!",
    wrong: "✗ Not quite…",
    next: "Next question →",
    seeResult: "See your result →",
    resultHeading: "Your result",
    scoreLine: (s: number, n: number) => `${s} out of ${n}`,
    titleByScore: (s: number) =>
      s >= 5
        ? "🌡️ Climatologist!"
        : s === 4
          ? "🔥 True expert"
          : s === 3
            ? "🌤️ On the right track"
            : "🧊 Time to hit the books — try again tomorrow!",
    share: "📤 Share your score",
    copied: "Copied to clipboard ✓",
    shareText: (s: number, n: number, url: string) =>
      `I scored ${s}/${n} on the Italia Rovente climate quiz 🌡️ Try it: ${url}`,
    tomorrow: "The quiz changes every day: come back tomorrow for 5 new questions.",
  },
} as const;

// Tinte verde/rosso per il feedback: non esistono token "success" nel tema,
// quindi usiamo un verde fisso (leggibile in entrambi i temi come bordo/tinta,
// il testo resta on-surface) e --error per l'errore.
const GOOD = "#16a34a";
const GOOD_TINT = "rgba(34, 197, 94, 0.14)";
const BAD_TINT = "rgba(239, 68, 68, 0.12)";

export function ClimateQuiz({
  questions,
  lang = "it",
}: {
  questions: QuizQuestion[];
  lang?: Lang;
}) {
  const t = STR[lang];
  const { unit } = useUnit();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!questions.length) return null;

  const n = questions.length;
  const q = questions[idx];
  const picked = answers[idx];
  const answered = picked != null;
  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;

  const fmtD: FmtDelta = (v) =>
    v == null ? "–" : fmtAnomaly(v, 1, unit, { locale: lang });

  const optionLabel = (o: QuizOption): string => {
    if (o.deltaC != null) return fmtD(o.deltaC);
    if (o.nights != null) return t.nightsOpt(o.nights);
    if (o.decade != null) return t.decadeOpt(o.decade);
    return o.label ?? "–";
  };

  const questionText = (): string => {
    const city = q.textParams.city ?? "";
    switch (q.type) {
      case "warmestYear": return t.question.warmestYear(city);
      case "warmingDelta": return t.question.warmingDelta(city);
      case "whichCity": return t.question.whichCity();
      case "tropicalNights": return t.question.tropicalNights(city);
      case "decade": return t.question.decade(city);
    }
  };

  const explainText = (): string => {
    switch (q.type) {
      case "warmestYear": return t.explain.warmestYear(q.explain, fmtD);
      case "warmingDelta": return t.explain.warmingDelta(q.explain, fmtD);
      case "whichCity": return t.explain.whichCity(q.explain, fmtD);
      case "tropicalNights": return t.explain.tropicalNights(q.explain);
      case "decade": return t.explain.decade(q.explain, fmtD);
    }
  };

  const pick = (i: number) => {
    if (answered) return;
    setAnswers((prev) => prev.map((a, j) => (j === idx ? i : a)));
  };

  const share = async () => {
    const url = window.location.href;
    const text = t.shareText(score, n, url);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // annullato o non supportato: prova con la clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard non disponibile: nessun feedback possibile
    }
  };

  // --- Schermata finale ------------------------------------------------------
  if (finished) {
    return (
      <div className="m3-card p-6 sm:p-8 text-center">
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">
          {t.resultHeading}
        </p>
        <p className="text-6xl font-extrabold tracking-tight mt-3 tabular-nums">
          {score}
          <span className="text-2xl text-on-surface-variant">/{n}</span>
        </p>
        <p className="text-2xl font-extrabold mt-3">{t.titleByScore(score)}</p>
        <p className="text-sm text-on-surface-variant mt-1">{t.scoreLine(score, n)}</p>

        {/* Riepilogo pallini */}
        <div className="flex justify-center gap-2 mt-5" aria-hidden>
          {questions.map((qq, i) => (
            <span
              key={qq.id}
              className="w-3 h-3 rounded-full"
              style={{
                background: answers[i] === qq.correctIndex ? GOOD : "var(--error)",
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={share}
            className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform cursor-pointer"
          >
            {copied ? t.copied : t.share}
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mt-5">🗓️ {t.tomorrow}</p>
      </div>
    );
  }

  // --- Domanda corrente ------------------------------------------------------
  return (
    <div className="m3-card p-5 sm:p-7">
      {/* Progresso: contatore + pallini (verde/rosso per le già risposte) */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
          {t.progress(idx + 1, n)}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {questions.map((qq, i) => {
            const done = answers[i] != null;
            const ok = answers[i] === qq.correctIndex;
            return (
              <span
                key={qq.id}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{
                  background: done
                    ? ok
                      ? GOOD
                      : "var(--error)"
                    : i === idx
                      ? "var(--on-surface-variant)"
                      : "var(--outline-variant)",
                }}
              />
            );
          })}
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
        {questionText()}
      </h2>

      <div className="mt-5 grid gap-2.5">
        {q.options.map((o, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = i === picked;
          // Dopo la risposta: la corretta è sempre evidenziata in verde (anche
          // quando si è sbagliato), la scelta errata in rosso.
          const style: React.CSSProperties = !answered
            ? {}
            : isCorrect
              ? { background: GOOD_TINT, borderColor: GOOD }
              : isPicked
                ? { background: BAD_TINT, borderColor: "var(--error)" }
                : { opacity: 0.55 };
          return (
            <button
              key={`${q.id}-${i}`}
              type="button"
              onClick={() => pick(i)}
              disabled={answered}
              className={`m3-card text-left px-4 py-3 font-bold text-base transition-colors ${
                answered ? "" : "m3-card-interactive cursor-pointer hover:text-primary"
              }`}
              style={style}
              aria-pressed={isPicked}
            >
              <span className="tabular-nums">{optionLabel(o)}</span>
              {answered && isCorrect && (
                <span className="ml-2 text-sm font-extrabold" style={{ color: GOOD }}>
                  ✓
                </span>
              )}
              {answered && isPicked && !isCorrect && (
                <span className="ml-2 text-sm font-extrabold text-error">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback + spiegazione (il sito insegna: sempre il numero vero) */}
      {answered && (
        <div className="mt-5">
          <p
            className="font-extrabold text-sm"
            style={{ color: picked === q.correctIndex ? GOOD : "var(--error)" }}
          >
            {picked === q.correctIndex ? t.correct : t.wrong}
          </p>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            {explainText()}
          </p>
          <button
            type="button"
            onClick={() => {
              if (idx + 1 < n) {
                setIdx(idx + 1);
              } else {
                setFinished(true);
                trackEvent("quiz_complete", { score });
              }
            }}
            className="m3-chip bg-primary text-on-primary text-base px-6 py-3 mt-4 hover:scale-105 transition-transform cursor-pointer"
          >
            {idx + 1 < n ? t.next : t.seeResult}
          </button>
        </div>
      )}
    </div>
  );
}
