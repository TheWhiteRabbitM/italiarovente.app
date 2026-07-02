"use client";

import { useEffect, useState } from "react";

type Counter = { confirm: number; deny: number; hot: number; cold: number };
type VoteKind = keyof Counter;

const today = () => new Date().toISOString().slice(0, 10);

const STR = {
  it: {
    title: (scope: string) => `Dì la tua · ${scope}`,
    subtitle: "Partecipa: i risultati sono in tempo reale e contribuiscono alle statistiche del sito.",
    tempQuestion: "La temperatura mostrata ti sembra corretta?",
    yesCorrect: "Sì, è corretta",
    noWrong: "No, sbagliata",
    confirmPct: (p: number) => `${p}% conferma`,
    denyPct: (p: number) => `${p}% nega`,
    votedTemp: "Grazie, voto registrato! ✓",
    feelQuestion: "Come ti senti adesso?",
    hot: "Sento caldo",
    cold: "Sento freddo",
    hotPct: (p: number) => `${p}% caldo`,
    coldPct: (p: number) => `${p}% freddo`,
    votedFeel: "Grazie, voto registrato! ✓",
    votes: (n: number) => `${n} voti`,
  },
  en: {
    title: (scope: string) => `Have your say · ${scope}`,
    subtitle: "Take part: results are real-time and contribute to the site's stats.",
    tempQuestion: "Does the temperature shown seem correct to you?",
    yesCorrect: "Yes, it's correct",
    noWrong: "No, it's wrong",
    confirmPct: (p: number) => `${p}% confirm`,
    denyPct: (p: number) => `${p}% deny`,
    votedTemp: "Thanks, your vote is registered! ✓",
    feelQuestion: "How do you feel right now?",
    hot: "I feel hot",
    cold: "I feel cold",
    hotPct: (p: number) => `${p}% hot`,
    coldPct: (p: number) => `${p}% cold`,
    votedFeel: "Thanks, your vote is registered! ✓",
    votes: (n: number) => `${n} votes`,
  },
} as const;

export function VoteWidget({
  citySlug,
  scopeLabel,
  lang = "it",
}: {
  citySlug?: string;
  scopeLabel: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const [c, setC] = useState<Counter>({ confirm: 0, deny: 0, hot: 0, cold: 0 });
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const guardKey = (g: "temp" | "feel") =>
    `mi_vote_${g}_${citySlug ?? "global"}_${today()}`;

  useEffect(() => {
    setVoted({
      temp: !!localStorage.getItem(guardKey("temp")),
      feel: !!localStorage.getItem(guardKey("feel")),
    });
    fetch("/api/stats")
      .then((r) => r.json())
      .then((s) => {
        const src = citySlug ? s.byCity?.[citySlug] : s.total;
        if (src) setC({ confirm: 0, deny: 0, hot: 0, cold: 0, ...src });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

  async function vote(kind: VoteKind, group: "temp" | "feel") {
    if (voted[group] || busy) return;
    setBusy(kind);
    // ottimistico
    setC((p) => ({ ...p, [kind]: p[kind] + 1 }));
    try {
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, citySlug }),
      });
      const s = await r.json();
      const src = citySlug ? s.byCity?.[citySlug] : s.total;
      if (src) setC({ confirm: 0, deny: 0, hot: 0, cold: 0, ...src });
      localStorage.setItem(guardKey(group), kind);
      setVoted((v) => ({ ...v, [group]: true }));
    } catch {
      setC((p) => ({ ...p, [kind]: Math.max(0, p[kind] - 1) }));
    } finally {
      setBusy(null);
    }
  }

  const tempTot = c.confirm + c.deny;
  const feelTot = c.hot + c.cold;
  const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <section className="m3-card rise p-5 sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight mb-1">
        {t.title(scopeLabel)}
      </h2>
      <p className="text-sm text-on-surface-variant mb-5">
        {t.subtitle}
      </p>

      {/* TEMPERATURA: conferma / nega */}
      <div className="mb-6">
        <div className="font-bold mb-2 text-sm">
          {t.tempQuestion}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <VoteButton
            onClick={() => vote("confirm", "temp")}
            disabled={voted.temp}
            active={busy === "confirm"}
            bg="var(--secondary-container)"
            fg="var(--on-secondary-container)"
            emoji="✅"
            label={t.yesCorrect}
          />
          <VoteButton
            onClick={() => vote("deny", "temp")}
            disabled={voted.temp}
            active={busy === "deny"}
            bg="var(--primary-container)"
            fg="var(--on-primary-container)"
            emoji="❌"
            label={t.noWrong}
          />
        </div>
        <SplitBar
          left={{ value: c.confirm, color: "#2563eb", label: t.confirmPct(pct(c.confirm, tempTot)) }}
          right={{ value: c.deny, color: "#ef4444", label: t.denyPct(pct(c.deny, tempTot)) }}
          total={tempTot}
          votesLabel={t.votes}
        />
        {voted.temp && (
          <p className="text-xs text-tertiary font-semibold mt-1">
            {t.votedTemp}
          </p>
        )}
      </div>

      {/* SENSAZIONE: caldo / freddo */}
      <div>
        <div className="font-bold mb-2 text-sm">{t.feelQuestion}</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <VoteButton
            onClick={() => vote("hot", "feel")}
            disabled={voted.feel}
            active={busy === "hot"}
            bg="var(--primary-container)"
            fg="var(--on-primary-container)"
            emoji="🥵"
            label={t.hot}
          />
          <VoteButton
            onClick={() => vote("cold", "feel")}
            disabled={voted.feel}
            active={busy === "cold"}
            bg="var(--secondary-container)"
            fg="var(--on-secondary-container)"
            emoji="🥶"
            label={t.cold}
          />
        </div>
        <SplitBar
          left={{ value: c.hot, color: "#f97316", label: t.hotPct(pct(c.hot, feelTot)) }}
          right={{ value: c.cold, color: "#0891b2", label: t.coldPct(pct(c.cold, feelTot)) }}
          total={feelTot}
          votesLabel={t.votes}
        />
        {voted.feel && (
          <p className="text-xs text-tertiary font-semibold mt-1">
            {t.votedFeel}
          </p>
        )}
      </div>
    </section>
  );
}

function VoteButton({
  onClick,
  disabled,
  active,
  bg,
  fg,
  emoji,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  bg: string;
  fg: string;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
      style={{ background: bg, color: fg }}
    >
      <span className={`text-lg ${active ? "animate-bounce" : ""}`}>{emoji}</span>
      {label}
    </button>
  );
}

function SplitBar({
  left,
  right,
  total,
  votesLabel,
}: {
  left: { value: number; color: string; label: string };
  right: { value: number; color: string; label: string };
  total: number;
  votesLabel: (n: number) => string;
}) {
  const lp = total ? (left.value / total) * 100 : 50;
  return (
    <div>
      <div className="flex h-6 rounded-full overflow-hidden bg-surface-container-high">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${lp}%`, background: left.color }}
        />
        <div
          className="h-full flex-1 transition-all duration-500"
          style={{ background: right.color }}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold mt-1">
        <span style={{ color: left.color }}>{left.label}</span>
        <span className="text-on-surface-variant">{votesLabel(total)}</span>
        <span style={{ color: right.color }}>{right.label}</span>
      </div>
    </div>
  );
}
