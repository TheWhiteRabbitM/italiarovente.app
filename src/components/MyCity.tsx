"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CITIES } from "@/lib/cities";
import { getMyCity, setMyCity, clearMyCity } from "@/lib/mycity";
import { syncPushCity } from "@/lib/pushsync";
import { Temp } from "./Temp";

const STR = {
  it: {
    title: "📍 La tua città",
    intro: "Salvala qui (resta solo su questo dispositivo, nessun account) per vederla sempre in evidenza.",
    placeholder: "🔎 Cerca la tua città…",
    empty: "Nessuna città trovata.",
    change: "Cambia",
    now: "ora",
    warmingLabel: "riscaldamento",
    seeAll: "Vedi tutti i dati →",
    loading: "Sto caricando…",
  },
  en: {
    title: "📍 Your city",
    intro: "Save it here (stays only on this device, no account) to always see it front and center.",
    placeholder: "🔎 Search your city…",
    empty: "No city found.",
    change: "Change",
    now: "now",
    warmingLabel: "warming",
    seeAll: "See all the data →",
    loading: "Loading…",
  },
} as const;

type Snapshot = { slug: string; name: string; temp: number | null; warming: number | null };

export function MyCity({ lang = "it" as "it" | "en" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [slug, setSlug] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [q, setQ] = useState("");

  useEffect(() => {
    setSlug(getMyCity());
  }, []);

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    fetch(`/api/city-snapshot/${slug}?lang=${lang}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setSnapshot(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [slug, lang]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.region.toLowerCase().includes(needle),
    ).slice(0, 6);
  }, [q]);

  function choose(citySlug: string) {
    setMyCity(citySlug);
    setSlug(citySlug);
    setQ("");
    // Se l'utente è iscritto alle notifiche, d'ora in poi riceverà anche gli
    // avvisi mirati su questa città (aggiornamento silenzioso, best effort).
    void syncPushCity(lang);
  }

  function reset() {
    clearMyCity();
    setSlug(null);
    setSnapshot(null);
    setStatus("idle");
    void syncPushCity(lang);
  }

  const cityHref = slug ? `${lang === "en" ? "/en" : ""}/citta/${slug}` : "";

  return (
    <section className="mb-12">
      <div className="m3-card rise p-5 sm:p-6 max-w-xl mx-auto">
        {!slug ? (
          <>
            <h2 className="text-lg font-extrabold tracking-tight mb-1">{t.title}</h2>
            <p className="text-sm text-on-surface-variant mb-4">{t.intro}</p>
            <div className="relative">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.placeholder}
                className="w-full rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] px-5 py-3 font-semibold text-on-surface placeholder:text-on-surface-variant"
              />
              {results.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-2xl bg-surface-container-high border border-[var(--outline-variant)] overflow-hidden shadow-lg">
                  {results.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => choose(c.slug)}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-container-highest transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className="text-xs text-on-surface-variant">{c.region}</span>
                    </button>
                  ))}
                </div>
              )}
              {q.trim() && results.length === 0 && (
                <p className="text-xs text-on-surface-variant mt-2">{t.empty}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                {t.title}
              </p>
              <h3 className="text-xl font-extrabold tracking-tight truncate">
                {snapshot?.name ?? "…"}
              </h3>
              {status === "ready" && snapshot ? (
                <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-extrabold tracking-tighter">
                    {snapshot.temp != null ? <Temp value={snapshot.temp} digits={0} /> : "–"}
                  </span>
                  {snapshot.warming != null && (
                    <span className="text-sm text-on-surface-variant">
                      <Temp value={snapshot.warming} digits={1} delta locale={lang} /> {t.warmingLabel}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant mt-1">{t.loading}</p>
              )}
              <Link href={cityHref} className="text-sm text-secondary font-semibold hover:underline mt-2 inline-block">
                {t.seeAll}
              </Link>
            </div>
            <button
              onClick={reset}
              className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs shrink-0"
            >
              {t.change}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
