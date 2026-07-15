// Notifiche push PWA: iscrizioni salvate su Redis (hash "push:subs", un
// campo per iscritto) se configurato, altrimenti su blob (un file per
// iscritto) come fallback. Nessun dato personale: solo l'endpoint del
// browser necessario per inviare la notifica e la lingua scelta (it/en) per
// localizzare il testo.
import "server-only";
import { put, list, del } from "@vercel/blob";
import { redis } from "./redis";
import webpush from "web-push";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SUB_HASH = "push:subs";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:hello@italiarovente.app";

const SUB_PREFIX = "push/subs/";

export type PushLang = "it" | "en";

// Iscrizione come salvata su Redis/blob: la PushSubscription del browser più
// la lingua scelta al momento dell'iscrizione e (facoltativa) la città
// seguita, per le notifiche mirate. Le voci storiche non hanno `lang` (vale
// "it") né `city` (valgono le sole notifiche nazionali).
type StoredSubscription = webpush.PushSubscription & { lang?: PushLang; city?: string };

export function pushConfigured(): boolean {
  return !!((redis || BLOB_TOKEN) && VAPID_PUBLIC && VAPID_PRIVATE);
}

function keyFor(endpoint: string): string {
  // hash semplice e stabile dell'endpoint, per usarlo come nome campo/file
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  return `${SUB_PREFIX}${Math.abs(h)}.json`;
}

// Esiste già un'iscrizione per questo endpoint? Serve alla route di
// iscrizione per distinguere una NUOVA iscrizione (→ notifica di benvenuto)
// da un semplice aggiornamento (cambio lingua/città → silenzioso).
export async function existsSubscription(endpoint: string): Promise<boolean> {
  const key = keyFor(endpoint);
  if (redis) {
    return (await redis.hexists(SUB_HASH, key)) === 1;
  }
  if (!BLOB_TOKEN) return false;
  try {
    const res = await list({ prefix: key, limit: 1, token: BLOB_TOKEN });
    return res.blobs.some((b) => b.pathname === key);
  } catch {
    return false;
  }
}

export async function saveSubscription(
  sub: webpush.PushSubscription,
  lang: PushLang = "it",
  city?: string,
): Promise<void> {
  const key = keyFor(sub.endpoint);
  const stored: StoredSubscription = { ...sub, lang, ...(city ? { city } : {}) };
  if (redis) {
    await redis.hset(SUB_HASH, { [key]: JSON.stringify(stored) });
    return;
  }
  if (!BLOB_TOKEN) return;
  await put(key, JSON.stringify(stored), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: BLOB_TOKEN,
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const key = keyFor(endpoint);
  if (redis) {
    await redis.hdel(SUB_HASH, key);
    return;
  }
  if (!BLOB_TOKEN) return;
  try {
    await del(key, { token: BLOB_TOKEN });
  } catch {
    /* già rimossa */
  }
}

async function listSubscriptions(): Promise<StoredSubscription[]> {
  if (redis) {
    const all = await redis.hgetall<Record<string, string>>(SUB_HASH);
    if (!all) return [];
    const subs: StoredSubscription[] = [];
    for (const raw of Object.values(all)) {
      try {
        subs.push(typeof raw === "string" ? JSON.parse(raw) : (raw as StoredSubscription));
      } catch {
        /* voce corrotta, ignorata */
      }
    }
    return subs;
  }
  if (!BLOB_TOKEN) return [];
  const subs: StoredSubscription[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix: SUB_PREFIX, cursor, limit: 1000, token: BLOB_TOKEN });
    const fetched = await Promise.allSettled(
      res.blobs.map(async (b) => {
        const r = await fetch(b.url, { cache: "no-store" });
        return r.ok ? ((await r.json()) as StoredSubscription) : null;
      }),
    );
    for (const f of fetched) if (f.status === "fulfilled" && f.value) subs.push(f.value);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return subs;
}

// `tag` fa collassare le notifiche dello stesso evento invece di accumularle;
// `cta` è l'etichetta del pulsante d'azione mostrato dal service worker.
export type PushPayload = { title: string; body: string; url?: string; tag?: string; cta?: string };
export type LocalizedPayloads = Record<PushLang, PushPayload>;

// Cuore dell'invio: consegna a un gruppo di iscritti il payload della loro
// lingua, rimuovendo le iscrizioni scadute/non più valide (410/404).
async function sendToSubs(
  subs: StoredSubscription[],
  byLang: LocalizedPayloads,
): Promise<{ sent: number; removed: number }> {
  const serialized: Record<PushLang, string> = {
    it: JSON.stringify(byLang.it),
    en: JSON.stringify(byLang.en),
  };
  let sent = 0;
  let removed = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, serialized[sub.lang === "en" ? "en" : "it"]);
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(sub.endpoint);
          removed++;
        }
      }
    }),
  );
  return { sent, removed };
}

// Invia la notifica a tutti gli iscritti. Accetta un payload singolo (stesso
// testo per tutti, retro-compatibile) oppure un payload per lingua
// ({ it, en }): ogni iscritto riceve quello della lingua salvata con la sua
// iscrizione (fallback "it" per le voci storiche senza lingua).
export async function notifyAll(
  payload: PushPayload | LocalizedPayloads,
): Promise<{ sent: number; removed: number }> {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);
  const byLang: LocalizedPayloads =
    "title" in payload ? { it: payload, en: payload } : payload;
  return sendToSubs(await listSubscriptions(), byLang);
}

// Notifiche mirate: raggruppa gli iscritti per città seguita (null = nessuna
// città, cioè solo notifiche nazionali) e chiede al chiamante il payload di
// ciascun gruppo. `build` può restituire null per saltare un gruppo — così il
// cron decide, dati alla mano, chi ha qualcosa di rilevante da ricevere.
export async function notifyGrouped(
  build: (city: string | null) => LocalizedPayloads | null | Promise<LocalizedPayloads | null>,
): Promise<{ sent: number; removed: number; groups: number }> {
  if (!pushConfigured()) return { sent: 0, removed: 0, groups: 0 };
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);

  const byCity = new Map<string | null, StoredSubscription[]>();
  for (const sub of await listSubscriptions()) {
    const key = sub.city ?? null;
    const group = byCity.get(key);
    if (group) group.push(sub);
    else byCity.set(key, [sub]);
  }

  let sent = 0;
  let removed = 0;
  let groups = 0;
  for (const [city, group] of byCity) {
    const payloads = await build(city);
    if (!payloads) continue;
    groups++;
    const r = await sendToSubs(group, payloads);
    sent += r.sent;
    removed += r.removed;
  }
  return { sent, removed, groups };
}

// Notifica di benvenuto a UN solo iscritto, subito dopo l'iscrizione: la
// conferma immediata che il canale funziona (altrimenti il primo segno di
// vita arriverebbe solo al prossimo evento, magari tra settimane).
export async function sendWelcome(
  sub: webpush.PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
