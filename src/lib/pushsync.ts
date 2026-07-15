// Tiene allineata l'iscrizione push con la città seguita ("La tua città").
// Solo client: se esiste già una PushSubscription attiva, la ri-invia al
// server con lingua e città correnti (il server tratta il re-POST come
// aggiornamento silenzioso, senza nuova notifica di benvenuto). Se l'utente
// non è iscritto alle notifiche non fa nulla — la scelta della città non
// attiva mai il push da sola.
import { getMyCity } from "./mycity";

export async function syncPushCity(lang: "it" | "en"): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (!sub) return; // non iscritto: niente da sincronizzare
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sub.toJSON(), lang, city: getMyCity() ?? undefined }),
    });
  } catch {
    /* best effort: la sincronizzazione riproverà al prossimo cambio */
  }
}
