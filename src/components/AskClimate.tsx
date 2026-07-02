"use client";

import { useState } from "react";

type Msg = { q: string; a: string | null; error?: boolean };

const STR = {
  it: {
    title: "Chiedi al clima 🤖",
    subtitle: "Fai una domanda sui dati: risponde solo con numeri reali, mai a memoria.",
    placeholder: "Es: come è cambiata la temperatura di Bologna?",
    ask: "Chiedi",
    asking: "Sto controllando i dati…",
    examples: [
      "Come è cambiata la temperatura di Milano dal 1940?",
      "Qual è l'anno più caldo di sempre in Italia?",
      "Che tendenza ha Napoli per decennio?",
    ],
    error: "Il servizio non è disponibile in questo momento. Riprova tra poco.",
  },
  en: {
    title: "Ask the climate 🤖",
    subtitle: "Ask a question about the data — answers use only real numbers, never guesses.",
    placeholder: "E.g. how has Milan's temperature changed?",
    ask: "Ask",
    asking: "Checking the data…",
    examples: [
      "How has Rome's temperature changed since 1940?",
      "What's the hottest year on record in Italy?",
      "What's the trend in Naples per decade?",
    ],
    error: "The service is unavailable right now. Please try again shortly.",
  },
} as const;

export function AskClimate({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<Msg | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setMsg({ q: trimmed, a: null });
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "error");
      setMsg({ q: trimmed, a: j.answer });
    } catch {
      setMsg({ q: trimmed, a: t.error, error: true });
    } finally {
      setLoading(false);
      setQ("");
    }
  }

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-1">{t.title}</h2>
      <p className="text-sm text-on-surface-variant mb-4">{t.subtitle}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-2 mb-3"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          maxLength={300}
          className="flex-1 rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-4 py-2.5 font-medium text-on-surface placeholder:text-on-surface-variant"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="m3-chip bg-primary text-on-primary px-5 disabled:opacity-50 shrink-0"
        >
          {t.ask}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {t.examples.map((ex) => (
          <button
            key={ex}
            onClick={() => ask(ex)}
            disabled={loading}
            className="m3-chip bg-surface-container-high text-on-surface-variant text-xs hover:bg-surface-container-highest transition-colors disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      {msg && (
        <div className="rounded-2xl bg-surface-container-high p-4">
          <div className="text-sm font-bold mb-1.5">{msg.q}</div>
          {msg.a == null ? (
            <div className="text-sm text-on-surface-variant animate-pulse">{t.asking}</div>
          ) : (
            <div
              className="text-sm leading-relaxed"
              style={msg.error ? { color: "var(--error)" } : undefined}
            >
              {msg.a}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
