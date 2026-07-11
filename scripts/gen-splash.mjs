// Genera le schermate di avvio iOS (apple-touch-startup-image) per la PWA.
//   node scripts/gen-splash.mjs
//
// Perché servono: iOS, a differenza di Android, IGNORA il manifest per lo
// splash. Senza queste immagini una PWA installata su iPhone/iPad mostra uno
// schermo vuoto all'avvio. Ne generiamo una per ciascuna risoluzione comune,
// in variante chiara e scura, con il logo del sito centrato sullo sfondo del
// brand — le stesse dimensioni fisiche del device, perché iOS non le scala.
//
// La lista dei device è condivisa con il layout (src/data/ios-splash.json),
// che da quella genera i <link>: una sola fonte, niente disallineamenti.

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, "..", "public");
const OUT = join(PUB, "splash");
mkdirSync(OUT, { recursive: true });

const DEVICES = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "ios-splash.json"), "utf8"),
);

// Logo termometro (stesso di gen-icons.mjs / componente Logo).
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

// Sfondi coerenti col manifest (background_color) e col tema chiaro del sito.
const THEME = {
  light: { bg: "#f6efe6", sub: "#6c5a52", brand: "#c2410c" },
  dark: { bg: "#29241f", sub: "#a89a8f", brand: "#f97316" },
};

function splashSvg(wPx, hPx, mode) {
  const t = THEME[mode];
  // Logo dimensionato sul lato corto, centrato leggermente sopra la metà.
  const short = Math.min(wPx, hPx);
  const logo = Math.round(short * 0.26);
  const lx = Math.round((wPx - logo) / 2);
  const ly = Math.round(hPx / 2 - logo * 0.9);
  const fontMain = Math.round(short * 0.058);
  const fontSub = Math.round(short * 0.032);
  const tyMain = ly + logo + Math.round(short * 0.11);
  const tySub = tyMain + Math.round(fontSub * 1.7);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wPx}" height="${hPx}" viewBox="0 0 ${wPx} ${hPx}">
    <defs>${MERC}</defs>
    <rect width="${wPx}" height="${hPx}" fill="${t.bg}"/>
    <svg x="${lx}" y="${ly}" width="${logo}" height="${logo}" viewBox="0 0 48 48">${THERMO}</svg>
    <text x="${wPx / 2}" y="${tyMain}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${fontMain}" fill="${mode === "dark" ? "#f5f0ea" : "#241b16"}">Italia<tspan fill="${t.brand}">Rovente</tspan></text>
    <text x="${wPx / 2}" y="${tySub}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="600" font-size="${fontSub}" fill="${t.sub}">i dati, non le opinioni</text>
  </svg>`;
}

let n = 0;
for (const d of DEVICES) {
  const wPx = d.dw * d.dpr;
  const hPx = d.dh * d.dpr;
  for (const mode of ["light", "dark"]) {
    const svg = Buffer.from(splashSvg(wPx, hPx, mode));
    const suffix = mode === "dark" ? "-dark" : "";
    const file = `splash-${wPx}x${hPx}${suffix}.png`;
    await sharp(svg).png().toFile(join(OUT, file));
    n++;
  }
  console.log(`✓ ${d.name} (${wPx}x${hPx})`);
}
console.log(`Done. ${n} splash generate in public/splash/`);
