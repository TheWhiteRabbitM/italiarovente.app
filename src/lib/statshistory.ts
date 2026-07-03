// Storico giornaliero di visite umane vs richieste bot: uno snapshot al
// giorno (dedup su Redis), per vedere l'andamento nel tempo invece del solo
// totale attuale. Nessun dato personale: solo conteggi aggregati, stessa
// policy privacy di stats.ts/botstats.ts.
import "server-only";
import { redis } from "./redis";
import { getStats } from "./stats";
import { getBotStats } from "./botstats";

const HISTORY_KEY = "mi:stats-history";
const LAST_SNAPSHOT_KEY = "mi:stats-history:last";
const MAX_SNAPSHOTS = 120; // ~4 mesi a un punto al giorno

export type StatsSnapshot = {
  date: string; // YYYY-MM-DD
  visits: number;
  botsTotal: number;
};

// Uno snapshot al giorno: se già scattato oggi, non ne aggiunge un altro
// (il cron gira più volte al giorno per altri motivi, questo non deve
// duplicare la riga).
export async function logDailyStatsSnapshot(): Promise<StatsSnapshot | { skipped: true }> {
  if (!redis) return { skipped: true };
  const today = new Date().toISOString().slice(0, 10);
  const last = await redis.get<string>(LAST_SNAPSHOT_KEY);
  if (last === today) return { skipped: true };

  const [stats, bots] = await Promise.all([getStats(), getBotStats()]);
  const snapshot: StatsSnapshot = {
    date: today,
    visits: stats.visits,
    botsTotal: bots?.total ?? 0,
  };

  const p = redis.pipeline();
  p.lpush(HISTORY_KEY, JSON.stringify(snapshot));
  p.ltrim(HISTORY_KEY, 0, MAX_SNAPSHOTS - 1);
  p.set(LAST_SNAPSHOT_KEY, today);
  await p.exec();
  return snapshot;
}

// Più vecchio -> più recente, comodo per disegnare un grafico da sinistra a destra.
export async function getStatsHistory(limit = MAX_SNAPSHOTS): Promise<StatsSnapshot[]> {
  if (!redis) return [];
  const raw = await redis.lrange<string>(HISTORY_KEY, 0, limit - 1);
  if (!raw) return [];
  const parsed = raw.flatMap((r) => {
    try {
      return [typeof r === "string" ? JSON.parse(r) : r] as StatsSnapshot[];
    } catch {
      return [];
    }
  });
  return parsed.reverse();
}
