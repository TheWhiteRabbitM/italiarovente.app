// Client Redis condiviso (Upstash) — unica istanza per tutto il sito, così
// stats.ts e push.ts non duplicano l'inizializzazione. `null` se le variabili
// d'ambiente non sono configurate (fallback ad altri backend nei chiamanti).
import "server-only";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
