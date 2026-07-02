// Contatori e voti del sito: visite, voto conferma/nega temperatura, sensazione
// caldo/freddo — globali, per città e per zona.
//
// Backend (scelto automaticamente):
//  1) Redis (Upstash) se sono presenti le variabili KV_REST_API_* / UPSTASH_* →
//     INCR atomici, tempo reale (consigliato).
//  2) Vercel Blob (fallback) → ogni evento è un blob a sé (nome univoco via
//     addRandomSuffix): la scrittura non legge mai lo stato precedente, quindi
//     due richieste concorrenti non si "pestano i piedi" e non si perdono
//     incrementi. La lettura conta i blob con list() (sempre fresca, nessuna
//     cache CDN da bypassare). Cresce di un piccolo file per evento: adeguato
//     al traffico di un progetto personale; se un giorno diventasse un collo
//     di bottiglia si può aggiungere una compattazione periodica.
//  3) In-memory (solo sviluppo senza storage) → volatile.

import "server-only";
import { put, list } from "@vercel/blob";
import { redis } from "./redis";
import { CITIES, ZONES, type Zone } from "./cities";

export type VoteKind = "confirm" | "deny" | "hot" | "cold";
type Counter = { confirm: number; deny: number; hot: number; cold: number };

export type Stats = {
  visits: number;
  total: Counter;
  byCity: Record<string, Counter>;
  byZone: Record<string, Counter>;
  updated: string;
};

const KINDS: VoteKind[] = ["confirm", "deny", "hot", "cold"];
const CITY_SLUGS = new Set(CITIES.map((c) => c.slug));

function emptyCounter(): Counter {
  return { confirm: 0, deny: 0, hot: 0, cold: 0 };
}
function emptyStats(): Stats {
  const byZone: Record<string, Counter> = {};
  for (const z of ZONES) byZone[z] = emptyCounter();
  return { visits: 0, total: emptyCounter(), byCity: {}, byZone, updated: new Date().toISOString() };
}

// --- selezione backend ------------------------------------------------------
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export function statsBackend(): "redis" | "blob" | "memory" {
  if (redis) return "redis";
  if (BLOB_TOKEN) return "blob";
  return "memory";
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
function toCounter(h: Record<string, unknown> | null): Counter {
  const c = emptyCounter();
  if (h) for (const k of KINDS) c[k] = num(h[k]);
  return c;
}

// ===========================================================================
// REDIS
// ===========================================================================
const kMeta = "mi:meta";
const kTotal = "mi:total";
const kCity = (s: string) => `mi:city:${s}`;
const kZone = (z: string) => `mi:zone:${z}`;

async function redisStats(): Promise<Stats> {
  const r = redis!;
  const p = r.pipeline();
  p.hgetall(kMeta);
  p.hgetall(kTotal);
  CITIES.forEach((c) => p.hgetall(kCity(c.slug)));
  ZONES.forEach((z) => p.hgetall(kZone(z)));
  const res = (await p.exec()) as (Record<string, unknown> | null)[];

  let i = 0;
  const meta = res[i++];
  const total = toCounter(res[i++]);
  const byCity: Record<string, Counter> = {};
  CITIES.forEach((c) => {
    const cc = toCounter(res[i++]);
    if (cc.confirm || cc.deny || cc.hot || cc.cold) byCity[c.slug] = cc;
  });
  const byZone: Record<string, Counter> = {};
  ZONES.forEach((z) => (byZone[z] = toCounter(res[i++])));

  return {
    visits: num(meta?.visits),
    total,
    byCity,
    byZone,
    updated: new Date().toISOString(),
  };
}

// ===========================================================================
// BLOB (fallback) — un blob per evento, conteggio via list()
// ===========================================================================
const VISIT_PREFIX = "events/visit/";
const VOTE_PREFIX = "events/vote/";

async function putEvent(path: string): Promise<void> {
  await put(path, "1", {
    access: "public",
    contentType: "text/plain",
    addRandomSuffix: true,
    token: BLOB_TOKEN,
  });
}

// Elenca TUTTI i blob sotto un prefisso (paginando finché serve).
async function listAll(prefix: string) {
  const all: { pathname: string }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix, cursor, limit: 1000, token: BLOB_TOKEN });
    all.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return all;
}

function addCounter(a: Counter, b: Counter): Counter {
  return {
    confirm: a.confirm + b.confirm,
    deny: a.deny + b.deny,
    hot: a.hot + b.hot,
    cold: a.cold + b.cold,
  };
}

// Offset "legacy": i conteggi accumulati nel vecchio schema (un unico blob
// JSON riscritto ad ogni evento, sostituito perché soggetto a race condition
// sotto richieste concorrenti). Letto una sola volta e sommato come base, così
// i numeri restano continui invece di azzerarsi con la migrazione.
const LEGACY_PATH = "stats/data.json";
let legacyCache: Stats | null = null;

async function legacyStats(): Promise<Stats> {
  if (legacyCache) return legacyCache;
  const empty = emptyStats();
  try {
    const { blobs } = await list({ prefix: LEGACY_PATH, limit: 1, token: BLOB_TOKEN });
    const blob = blobs.find((b) => b.pathname === LEGACY_PATH);
    if (blob) {
      const res = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const raw = await res.json();
        const byCity: Record<string, Counter> = {};
        for (const [slug, c] of Object.entries(raw.byCity ?? {})) {
          if (CITY_SLUGS.has(slug)) byCity[slug] = toCounter(c as Record<string, unknown>);
        }
        const byZone: Record<string, Counter> = {};
        for (const z of ZONES) byZone[z] = toCounter(raw.byZone?.[z] ?? null);
        legacyCache = { visits: num(raw.visits), total: toCounter(raw.total), byCity, byZone, updated: empty.updated };
        return legacyCache;
      }
    }
  } catch {
    /* nessun blob legacy o errore: parti da zero */
  }
  legacyCache = empty;
  return legacyCache;
}

async function blobStats(): Promise<Stats> {
  const [visitBlobs, voteBlobs, legacy] = await Promise.all([
    listAll(VISIT_PREFIX),
    listAll(VOTE_PREFIX),
    legacyStats(),
  ]);

  const total = { ...legacy.total };
  const byCity: Record<string, Counter> = {};
  for (const [slug, c] of Object.entries(legacy.byCity)) byCity[slug] = { ...c };
  const byZone: Record<string, Counter> = {};
  for (const z of ZONES) byZone[z] = { ...legacy.byZone[z] };

  for (const b of voteBlobs) {
    // events/vote/{kind}/{zone}/{citySlug}/hit-XXXXX
    const parts = b.pathname.split("/");
    const kind = parts[2] as VoteKind;
    const zone = parts[3];
    const citySlug = parts[4];
    if (!KINDS.includes(kind)) continue;
    total[kind]++;
    if (zone && zone !== "_" && byZone[zone]) byZone[zone][kind]++;
    if (citySlug && citySlug !== "_" && CITY_SLUGS.has(citySlug)) {
      byCity[citySlug] = addCounter(byCity[citySlug] ?? emptyCounter(), toCounter({ [kind]: 1 }));
    }
  }

  return {
    visits: legacy.visits + visitBlobs.length,
    total,
    byCity,
    byZone,
    updated: new Date().toISOString(),
  };
}

// ===========================================================================
// API pubblica
// ===========================================================================
let memory: Stats | null = null;

export async function getStats(): Promise<Stats> {
  if (redis) return redisStats();
  if (BLOB_TOKEN) return blobStats();
  return (memory ??= emptyStats());
}

export async function bumpVisit(): Promise<Stats> {
  if (redis) {
    await redis.hincrby(kMeta, "visits", 1);
    return redisStats();
  }
  if (BLOB_TOKEN) {
    await putEvent(`${VISIT_PREFIX}hit`);
    return blobStats();
  }
  memory ??= emptyStats();
  memory.visits += 1;
  return memory;
}

export async function recordVote(
  kind: VoteKind,
  citySlug: string | null,
  zone: Zone | null,
): Promise<Stats> {
  if (redis) {
    const p = redis.pipeline();
    p.hincrby(kTotal, kind, 1);
    if (citySlug) p.hincrby(kCity(citySlug), kind, 1);
    if (zone) p.hincrby(kZone(zone), kind, 1);
    await p.exec();
    return redisStats();
  }
  if (BLOB_TOKEN) {
    await putEvent(`${VOTE_PREFIX}${kind}/${zone ?? "_"}/${citySlug ?? "_"}/hit`);
    return blobStats();
  }
  memory ??= emptyStats();
  memory.total[kind] += 1;
  return memory;
}
