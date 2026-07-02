// Dati e testi condivisi per le "curiosità" delle città (record estivo,
// gemello climatico, gradi giorno): un unico posto che calcola sia il
// contenuto della mini-pagina di condivisione sia l'immagine OG dedicata,
// così il link condiviso mostra davvero il fatto specifico e non la scheda
// generica della città.
import { getCity, cityName, type City } from "./cities";
import { getArchiveStats, getForecast } from "./weather";
import { getClimateAnalog, fmtDecade } from "./climateAnalog";
import { gradiGiorno, ggZone } from "./degreedays";
import { fmtTemp, fmtDate } from "./format";

export type CuriosityKind = "record-estivo" | "gemello-climatico" | "gradi-giorno";
export const CURIOSITY_KINDS: CuriosityKind[] = ["record-estivo", "gemello-climatico", "gradi-giorno"];

export type CuriosityPayload = {
  eyebrow: string;
  pageTitle: string;
  bigText: string;
  bigColor: string;
  subLine: string;
  shareText: string;
  metaTitle: string;
  metaDescription: string;
};

async function recordEstivo(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive || archive.precise === false) return null;
  const hot = archive.records.hottest;
  const hotYear = parseInt(hot.date.slice(0, 4), 10);
  const hotMonth = parseInt(hot.date.slice(5, 7), 10);
  if (hotMonth < 6 || hotMonth > 8) return null;

  const forecast = await getForecast(city);
  const curTemp = forecast.current.temp;
  if (curTemp == null) return null;
  const nowDate = new Date();
  const curMonth = nowDate.getUTCMonth() + 1;
  if (curMonth < 6 || curMonth > 9) return null;
  const yearsAgo = nowDate.getUTCFullYear() - hotYear;
  if (yearsAgo <= 0) return null;

  const cooler = curTemp < hot.value;
  const date = fmtDate(hot.date, lang);
  const curT = fmtTemp(curTemp, 0);
  const hotT = fmtTemp(hot.value, 1);

  const text =
    lang === "en"
      ? cooler
        ? `With ${curT} in ${name} today, take comfort: on ${date} (${yearsAgo} years ago) it hit ${hotT} here — the all-time record since 1940.`
        : `With ${curT}, ${name} today is very close to the all-time record: ${hotT} on ${date} (${yearsAgo} years ago).`
      : cooler
        ? `Con ${curT} a ${name} oggi, consolati: il ${date} (${yearsAgo} anni fa) qui si toccarono ${hotT} — il record assoluto della serie dal 1940.`
        : `Con ${curT}, ${name} oggi è vicinissima al record assoluto di sempre: ${hotT} del ${date} (${yearsAgo} anni fa).`;

  return {
    eyebrow: lang === "en" ? "🔥 Summer record" : "🔥 Record estivo",
    pageTitle: lang === "en" ? `${name}'s all-time summer record` : `Il record estivo assoluto di ${name}`,
    bigText: hotT,
    bigColor: "#ffab98",
    subLine:
      lang === "en"
        ? `${date} — ${yearsAgo} years ago. Today: ${curT}.`
        : `${date} — ${yearsAgo} anni fa. Oggi: ${curT}.`,
    shareText: text,
    metaTitle:
      lang === "en" ? `${name}: the all-time summer record is ${hotT}` : `${name}: il record estivo assoluto è ${hotT}`,
    metaDescription: text,
  };
}

async function gemelloClimatico(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const analog = getClimateAnalog(city.slug);
  if (!analog) return null;
  const decade = fmtDecade(analog.decade, lang);
  const meanNow = fmtTemp(analog.meanNow, 1);
  const meanThen = fmtTemp(analog.meanThen, 1);
  const text =
    lang === "en"
      ? `${name}'s average annual temperature today matches what ${analog.cityName} had in ${decade} — ${meanNow} vs ${meanThen}.`
      : `${name} ha oggi la stessa temperatura media annua che aveva ${analog.cityName} negli ${decade} — ${meanNow} contro ${meanThen}.`;

  return {
    eyebrow: lang === "en" ? "🕰️ Climate twin" : "🕰️ Gemello climatico",
    pageTitle: lang === "en" ? `${name}'s climate twin` : `Il gemello climatico di ${name}`,
    bigText: analog.cityName,
    bigColor: "#ffd27a",
    subLine: lang === "en" ? `${decade} — ${meanNow} vs ${meanThen}` : `${decade} — ${meanNow} contro ${meanThen}`,
    shareText: text,
    metaTitle:
      lang === "en" ? `${name}'s climate twin: ${analog.cityName} in ${decade}` : `Il gemello climatico di ${name}: ${analog.cityName} negli ${decade}`,
    metaDescription: text,
  };
}

async function gradiGiornoCuriosity(city: City, name: string, lang: "it" | "en"): Promise<CuriosityPayload | null> {
  const archive = getArchiveStats(city);
  if (!archive) return null;
  const gg = gradiGiorno(archive.monthly);
  if (gg == null) return null;
  const zone = ggZone(gg);
  const ggStr = gg.toLocaleString(lang === "it" ? "it-IT" : "en-US", { useGrouping: true });
  const text =
    lang === "en"
      ? `${name}: an estimated ${ggStr} heating degree days (zone ${zone}) — based on Italy's official DPR 412/93 indicator of a building's heating demand.`
      : `${name}: stima di ${ggStr} gradi giorno (zona ${zone}) — basata sull'indicatore ufficiale italiano (DPR 412/93) del fabbisogno di riscaldamento degli edifici.`;

  return {
    eyebrow: lang === "en" ? "🏠 Heating degree days" : "🏠 Gradi giorno",
    pageTitle: lang === "en" ? `${name}'s heating degree days` : `I gradi giorno di ${name}`,
    bigText: `${ggStr} GG`,
    bigColor: "#b3c5ff",
    subLine:
      lang === "en"
        ? `Estimated · zone ${zone} (DPR 412/93)`
        : `Stima · zona ${zone} (DPR 412/93)`,
    shareText: text,
    metaTitle: lang === "en" ? `${name}: ${ggStr} heating degree days (zone ${zone})` : `${name}: ${ggStr} gradi giorno (zona ${zone})`,
    metaDescription: text,
  };
}

export async function getCuriosity(
  slug: string,
  kind: CuriosityKind,
  lang: "it" | "en" = "it",
): Promise<CuriosityPayload | null> {
  const city = getCity(slug);
  if (!city) return null;
  const name = cityName(city, lang);

  if (kind === "record-estivo") return recordEstivo(city, name, lang);
  if (kind === "gemello-climatico") return gemelloClimatico(city, name, lang);
  if (kind === "gradi-giorno") return gradiGiornoCuriosity(city, name, lang);
  return null;
}
