"use client";

import { trackEvent } from "@/lib/track";
import { getMyCity } from "@/lib/mycity";
import { syncPushCity } from "@/lib/pushsync";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "idle" | "loading" | "subscribed" | "denied" | "unsupported";

const STR = {
  it: {
    subscribed: "🔔 Ti avviseremo: record, ondate di calore e recap mensile",
    denied: "🔕 Notifiche bloccate dal browser",
    loading: "Un attimo…",
    subscribe: "🔔 Avvisami: record, ondate di calore e recap mensile",
  },
  en: {
    subscribed: "🔔 You'll get alerts: records, heatwaves and monthly recap",
    denied: "🔕 Notifications blocked by the browser",
    loading: "One moment…",
    subscribe: "🔔 Notify me: records, heatwaves and monthly recap",
  },
} as const;

export function NotifyButton({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") setState("denied");
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setState("subscribed");
          // Migrazione dolce: riallinea l'iscrizione esistente con lingua e
          // città correnti (aggiornamento lato server silenzioso). Così anche
          // chi si era iscritto PRIMA delle notifiche per-città viene
          // agganciato alla città che segue, senza dover rifare nulla.
          void syncPushCity(lang);
        }
      }),
    );
  }, [lang]);

  async function subscribe() {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
      setState("unsupported");
      return;
    }
    setState("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "idle");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Se l'utente segue una città ("La tua città"), l'iscrizione la
        // include: riceverà anche gli avvisi mirati su quella città.
        body: JSON.stringify({ ...sub.toJSON(), lang, city: getMyCity() ?? undefined }),
      });
      setState("subscribed");
      trackEvent("push_subscribe");
    } catch {
      setState("idle");
    }
  }

  if (state === "unsupported") return null;

  if (state === "subscribed") {
    return (
      <span className="m3-chip bg-secondary-container text-on-secondary-container text-xs">
        {t.subscribed}
      </span>
    );
  }

  if (state === "denied") {
    return (
      <span className="m3-chip bg-surface-container-high text-on-surface-variant text-xs">
        {t.denied}
      </span>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={state === "loading"}
      className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs disabled:opacity-60"
    >
      {state === "loading" ? t.loading : t.subscribe}
    </button>
  );
}
