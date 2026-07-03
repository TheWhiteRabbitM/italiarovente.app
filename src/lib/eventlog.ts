// Registro degli eventi rilevati dal cron (record battuti, ondate di calore,
// recap mensile): una lista Redis limitata, usata per popolare /feed.xml.
// Sganciato dalle notifiche push (che restano il canale primario) — qui
// teniamo solo uno storico leggero, pubblico, senza dati personali.
import "server-only";
import { redis } from "./redis";

const EVENTS_KEY = "mi:events";
const MAX_EVENTS = 50;

export type SiteEvent = {
  date: string; // ISO 8601
  type: "record" | "heatwave" | "monthly";
  it: { title: string; body: string; url: string };
  en: { title: string; body: string; url: string };
};

export async function logEvent(event: SiteEvent): Promise<void> {
  if (!redis) return;
  const p = redis.pipeline();
  p.lpush(EVENTS_KEY, JSON.stringify(event));
  p.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1);
  await p.exec();
}

export async function getEvents(limit = MAX_EVENTS): Promise<SiteEvent[]> {
  if (!redis) return [];
  const raw = await redis.lrange<string>(EVENTS_KEY, 0, limit - 1);
  if (!raw) return [];
  return raw.flatMap((r) => {
    try {
      return [typeof r === "string" ? JSON.parse(r) : r];
    } catch {
      return [];
    }
  });
}
