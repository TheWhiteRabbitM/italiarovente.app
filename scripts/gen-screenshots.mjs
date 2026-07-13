// Genera gli screenshot del manifest (public/screenshots/*.png), usati dal
// Play Store (via PWABuilder/TWA) e dalla finestra di installazione "ricca" di
// Chrome. Non sono mockup vuoti: i numeri e le strisce vengono dai dati reali
// in src/data/history.json, così l'anteprima mostra il sito com'è davvero.
//
//   node scripts/gen-screenshots.mjs
//
// Stesso stack delle altre immagini (sharp, SVG → PNG) e stessa palette/logo
// di gen-splash.mjs / gen-icons.mjs. Formato 1080×1920 (form_factor "narrow").

import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "screenshots");
mkdirSync(OUT, { recursive: true });

const W = 1080;
const H = 1920;
const BG = "#29241f";
const FG = "#f5f0ea";
const SUB = "#a89a8f";
const BRAND = "#f97316";
const CARD = "#342d27";

const history = JSON.parse(readFileSync(join(ROOT, "src", "data", "history.json"), "utf8"));
const CITIES = history.cities || history;
const meta = JSON.parse(readFileSync(join(ROOT, "src", "data", "cities.json"), "utf8"));
const nameOf = new Map((Array.isArray(meta) ? meta : Object.values(meta)).map((c) => [c.slug, c.name]));

const THERMO = `
  <path d="M24 4.5a7 7 0 0 1 7 7v15.2a11 11 0 1 1-14 0V11.5a7 7 0 0 1 7-7z" fill="#ffffff"/>
  <rect x="20.5" y="12" width="7" height="20" rx="3.5" fill="url(#merc)"/>
  <circle cx="24" cy="35.5" r="8" fill="#e11d2a"/>
  <g stroke="#c9d4e3" stroke-width="1.6" stroke-linecap="round">
    <line x1="31.5" y1="14" x2="35" y2="14"/>
    <line x1="31.5" y1="18.5" x2="33.6" y2="18.5"/>
    <line x1="31.5" y1="23" x2="35" y2="23"/>
  </g>`;
const MERC = `
  <linearGradient id="merc" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3b82f6"/>
    <stop offset="0.45" stop-color="#a855f7"/>
    <stop offset="0.8" stop-color="#f97316"/>
    <stop offset="1" stop-color="#e11d2a"/>
  </linearGradient>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n, d = 1) => (n >= 0 ? "+" : "") + n.toFixed(d).replace(".", ",");

function lerp(a, b, k) {
  return a.map((x, i) => Math.round(x + (b[i] - x) * k));
}
const hex = (rgb) => "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");

// Colore "warming stripe": blu (freddo) → neutro → rosso (caldo), dall'anomalia
// in °C rispetto alla normale di base della città.
function stripeColor(anom) {
  const t = Math.max(-1, Math.min(1, anom / 1.5));
  if (t < 0) return hex(lerp([214, 224, 235], [26, 82, 156], -t));
  return hex(lerp([245, 222, 200], [200, 22, 22], t));
}

function warming(s) {
  return s?.trend ? s.trend.recentNormal - s.trend.baselineMean : NaN;
}

// Strisce nazionali: per ogni anno, media fra le città dell'anomalia annua
// (media dell'anno − normale di base della città).
function nationalStripes() {
  const acc = new Map();
  for (const slug of Object.keys(CITIES)) {
    const s = CITIES[slug];
    if (!s?.trend || !Array.isArray(s.yearly)) continue;
    const base = s.trend.baselineMean;
    for (const y of s.yearly) {
      if (y.count < 360 || y.mean == null) continue;
      const a = acc.get(y.year) || { sum: 0, n: 0 };
      a.sum += y.mean - base;
      a.n++;
      acc.set(y.year, a);
    }
  }
  return [...acc.entries()]
    .map(([year, a]) => ({ year, anom: a.sum / a.n }))
    .filter((d) => d.year < 2026) // 2026 è ancora parziale
    .sort((a, b) => a.year - b.year);
}

function cityStripes(s) {
  const base = s.trend.baselineMean;
  return s.yearly
    .filter((y) => y.count >= 360 && y.mean != null && y.year < 2026)
    .map((y) => ({ year: y.year, anom: y.mean - base }));
}

// Banda di strisce verticali dentro il rettangolo (x,y,w,h).
function stripesBand(data, x, y, w, h) {
  const bw = w / data.length;
  return data
    .map((d, i) => `<rect x="${(x + i * bw).toFixed(2)}" y="${y}" width="${(bw + 0.5).toFixed(2)}" height="${h}" fill="${stripeColor(d.anom)}"/>`)
    .join("");
}

function header() {
  return `
    <svg x="90" y="96" width="70" height="70" viewBox="0 0 48 48">${THERMO}</svg>
    <text x="176" y="148" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44" fill="${FG}">Italia<tspan fill="${BRAND}">Rovente</tspan></text>`;
}

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${MERC}</defs>
    <rect width="${W}" height="${H}" fill="${BG}"/>
    ${header()}
    ${inner}
    <text x="90" y="${H - 90}" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="${SUB}">i dati, non le opinioni · ${Object.keys(CITIES).length} città · ERA5 / Copernicus</text>
  </svg>`;
}

// --- 1. HERO: strisce nazionali + riscaldamento medio -----------------------
function heroSvg() {
  const nat = nationalStripes();
  const meanWarming =
    Object.keys(CITIES)
      .map((k) => warming(CITIES[k]))
      .filter(Number.isFinite)
      .reduce((a, b) => a + b, 0) /
    Object.keys(CITIES).filter((k) => Number.isFinite(warming(CITIES[k]))).length;
  const inner = `
    <text x="90" y="380" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="76" fill="${FG}">Quanto si è</text>
    <text x="90" y="470" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="76" fill="${FG}">scaldata l'Italia</text>
    <text x="90" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="76" fill="${BRAND}">dal 1940</text>

    ${stripesBand(nat, 90, 700, W - 180, 560)}
    <text x="90" y="1310" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="${SUB}">Ogni striscia è un anno — blu più freddo, rosso più caldo</text>

    <text x="90" y="1520" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="150" fill="${FG}">${fmt(meanWarming)}<tspan font-size="70" fill="${SUB}">°C</tspan></text>
    <text x="90" y="1590" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="34" fill="${SUB}">in media, tra le normali 1961–1990 e 1991–2020</text>`;
  return frame(inner);
}

// --- 2. CLASSIFICHE: top 5 città che si scaldano di più ---------------------
function rankingSvg() {
  const rows = Object.keys(CITIES)
    .map((slug) => ({ slug, w: warming(CITIES[slug]), pd: CITIES[slug]?.trend?.perDecade }))
    .filter((r) => Number.isFinite(r.w))
    .sort((a, b) => b.w - a.w)
    .slice(0, 5);
  const y0 = 460;
  const rh = 200;
  const items = rows
    .map((r, i) => {
      const y = y0 + i * rh;
      const col = stripeColor(r.w);
      return `
      <text x="90" y="${y + 70}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="${SUB}">${i + 1}</text>
      <rect x="150" y="${y}" width="${W - 240}" height="${rh - 30}" rx="28" fill="${CARD}"/>
      <text x="200" y="${y + 78}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="46" fill="${FG}">${esc(nameOf.get(r.slug) || r.slug)}</text>
      <text x="200" y="${y + 128}" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="${SUB}">${fmt(r.pd, 2)}°C / decennio</text>
      <rect x="${W - 320}" y="${y + 40}" width="180" height="90" rx="24" fill="${col}"/>
      <text x="${W - 230}" y="${y + 100}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="46" fill="#1a1410">${fmt(r.w)}</text>`;
    })
    .join("");
  const inner = `
    <text x="90" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="62" fill="${FG}">Le città che si</text>
    <text x="90" y="372" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="62" fill="${FG}">scaldano di più</text>
    ${items}`;
  return frame(inner);
}

// --- 3. CITTÀ: la più calda, col suo numero e le sue strisce ----------------
function citySvg() {
  const top = Object.keys(CITIES)
    .map((slug) => ({ slug, s: CITIES[slug], w: warming(CITIES[slug]) }))
    .filter((r) => Number.isFinite(r.w) && Array.isArray(r.s.yearly))
    .sort((a, b) => b.w - a.w)[0];
  const name = nameOf.get(top.slug) || top.slug;
  const st = cityStripes(top.s);
  const rec = top.s.records?.hottest;
  const inner = `
    <text x="90" y="330" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="96" fill="${FG}">${esc(name)}</text>
    <text x="90" y="400" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="36" fill="${SUB}">si è scaldata di</text>
    <text x="90" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="170" fill="${BRAND}">${fmt(top.w)}<tspan font-size="80" fill="${SUB}">°C</tspan></text>
    <text x="90" y="630" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="36" fill="${SUB}">dal 1940 — tra le normali 1961–1990 e 1991–2020</text>

    ${stripesBand(st, 90, 760, W - 180, 520)}
    <text x="90" y="1330" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="${SUB}">Le sue strisce del riscaldamento, anno per anno</text>

    <rect x="90" y="1440" width="${W - 180}" height="150" rx="28" fill="${CARD}"/>
    <text x="130" y="1505" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="32" fill="${SUB}">Ritmo</text>
    <text x="130" y="1555" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="${FG}">${fmt(top.s.trend.perDecade, 2)}°C / decennio</text>
    ${rec && Number.isFinite(rec.value) ? `<text x="${W - 130}" y="1505" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="32" fill="${SUB}">Record</text>
    <text x="${W - 130}" y="1555" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="${FG}">${rec.value.toFixed(1).replace(".", ",")}°C</text>` : ""}`;
  return frame(inner);
}

const shots = [
  ["screenshot-1-hero.png", heroSvg()],
  ["screenshot-2-classifiche.png", rankingSvg()],
  ["screenshot-3-citta.png", citySvg()],
];

for (const [file, svg] of shots) {
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, file));
  console.log(`✓ ${file}`);
}
console.log(`Done. ${shots.length} screenshot in public/screenshots/`);
