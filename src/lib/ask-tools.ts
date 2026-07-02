// Tool per l'assistente "Chiedi al clima": ogni tool legge SOLO dai dati reali
// dello snapshot storico (ERA5) già usato dal resto del sito. Il modello non
// deve mai inventare numeri: ogni cifra nella risposta deve venire da qui.
import { tool } from "ai";
import { z } from "zod";
import { CITIES } from "./cities";
import { getArchiveStats, getForecast, getMinMaxWarming } from "./weather";
import { getLifetimeData } from "./lifetime";

export const listCities = tool({
  description:
    "Elenca le città disponibili (slug, nome, regione, zona) per trovare quella giusta a partire da un nome scritto dall'utente, anche impreciso.",
  inputSchema: z.object({}),
  execute: async () =>
    CITIES.map((c) => ({ slug: c.slug, name: c.name, region: c.region, zone: c.zone })),
});

export const getCityClimate = tool({
  description:
    "Statistiche climatiche storiche reali (dal 1940, fonte ERA5/ECMWF) di una città: normali climatiche, tendenza di riscaldamento, riscaldamento separato di massime e minime, record di caldo/freddo, anno più caldo/fresco. Usa lo slug esatto ottenuto da listCities.",
  inputSchema: z.object({ citySlug: z.string().describe("slug della città, es. 'roma'") }),
  execute: async ({ citySlug }) => {
    const city = CITIES.find((c) => c.slug === citySlug);
    if (!city) return { error: `Città sconosciuta: ${citySlug}` };
    const s = getArchiveStats(city);
    if (!s) return { error: `Dati storici non disponibili per ${city.name}` };
    const minMax = getMinMaxWarming(s);
    return {
      city: city.name,
      region: city.region,
      dataFrom: s.startYear,
      dataTo: s.trend.lastYear,
      baseline1961_1990: s.trend.baselineMean,
      normal1991_2020: s.trend.recentNormal,
      warmingVsBaseline: Math.round((s.trend.recentNormal - s.trend.baselineMean) * 100) / 100,
      // Riscaldamento separato di massime e minime (stessa finestra 1961-1990
      // vs 1991-2020): dà più contesto di una sola media — spesso le notti
      // (minime) e i giorni (massime) non si scaldano allo stesso ritmo.
      ...(minMax
        ? {
            maxWarmingVsBaseline: Math.round(minMax.deltaMax * 100) / 100,
            minWarmingVsBaseline: Math.round(minMax.deltaMin * 100) / 100,
          }
        : {}),
      perDecadeTrendC: s.trend.perDecade,
      r2: s.trend.r2,
      hottestYear: s.records.warmestYear.year,
      hottestYearMean: s.records.warmestYear.mean,
      coolestYear: s.records.coolestYear.year,
      coolestYearMean: s.records.coolestYear.mean,
      ...(s.precise !== false
        ? {
            allTimeHottestDay: s.records.hottest.date,
            allTimeHottestValue: s.records.hottest.value,
            allTimeColdestDay: s.records.coldest.date,
            allTimeColdestValue: s.records.coldest.value,
            recordsNote:
              "I record giornalieri escludono gli ultimi mesi: i dati ERA5 più recenti sono preliminari (non ancora ri-analizzati in versione finale) e potrebbero essere rivisti.",
          }
        : {}),
    };
  },
});

export const getNationalClimate = tool({
  description:
    "Statistiche climatiche nazionali (media delle città italiane monitorate), dal 1940, incluso il riscaldamento separato di massime e minime. Usa questo per domande generali sull'Italia, non su una città specifica.",
  inputSchema: z.object({}),
  execute: async () => {
    const data = getLifetimeData();
    const italia = data.cities.find((c) => c.slug === "italia");
    if (!italia) return { error: "Dati nazionali non disponibili" };
    const top = [...italia.years].sort((a, b) => b.m - a.m)[0];

    // Media (tra le città con dati max/min reali) del riscaldamento separato
    // di massime e minime — stesso metodo a due trentenni, non una media
    // degli ultimi anni.
    const minMaxByCity = CITIES.map((c) => {
      const s = getArchiveStats(c);
      return s ? getMinMaxWarming(s) : null;
    }).filter((x): x is NonNullable<typeof x> => x != null);
    const avg = (key: "deltaMax" | "deltaMin") =>
      minMaxByCity.length
        ? Math.round((minMaxByCity.reduce((sum, x) => sum + x[key], 0) / minMaxByCity.length) * 100) / 100
        : null;

    return {
      dataFrom: italia.years[0]?.y,
      dataTo: italia.years[italia.years.length - 1]?.y,
      baseline1961_1990: Math.round(italia.baseline * 100) / 100,
      normal1991_2020: Math.round(italia.recentNormal * 100) / 100,
      warmingVsBaseline: Math.round((italia.recentNormal - italia.baseline) * 100) / 100,
      // Media tra le città monitorate con dati precisi (non è un dato
      // nazionale ufficiale, ma una media delle città di questo sito).
      maxWarmingVsBaselineAvg: avg("deltaMax"),
      minWarmingVsBaselineAvg: avg("deltaMin"),
      hottestYear: top?.y,
      hottestYearMean: top?.m,
      citiesMonitored: data.cities.length - 1,
    };
  },
});

export const getCurrentWeather = tool({
  description:
    "Temperatura ATTUALE (in tempo reale, non storica) di una città. Usa solo se l'utente chiede esplicitamente il meteo di oggi/adesso.",
  inputSchema: z.object({ citySlug: z.string() }),
  execute: async ({ citySlug }) => {
    const city = CITIES.find((c) => c.slug === citySlug);
    if (!city) return { error: `Città sconosciuta: ${citySlug}` };
    try {
      const f = await getForecast(city);
      return { city: city.name, currentTempC: f.current.temp, time: f.current.time };
    } catch {
      return { error: "Dati attuali non disponibili in questo momento" };
    }
  },
});

export const askTools = { listCities, getCityClimate, getNationalClimate, getCurrentWeather };
