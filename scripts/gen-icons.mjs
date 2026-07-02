// Genera le icone PWA (PNG) dal logo vettoriale (termometro warming-stripes).
//   node scripts/gen-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = join(__dirname, "..", "public");

// Termometro in coordinate 0 0 48 48 (corpo bianco, colonna warming-stripes,
// bulbo rosso, tacche). Usato anche dal componente Logo del sito.
const THERMO = `
  <path d="M24 4.5a7 7 0 0 1 7 7v15.2a11 11 0 1 1-14 0V11.5a7 7 0 0 1 7-7z" fill="#ffffff"/>
  <rect x="20.5" y="12" width="7" height="20" rx="3.5" fill="url(#merc)"/>
  <circle cx="24" cy="35.5" r="8" fill="#e11d2a"/>
  <g stroke="#c9d4e3" stroke-width="1.6" stroke-linecap="round">
    <line x1="31.5" y1="14" x2="35" y2="14"/>
    <line x1="31.5" y1="18.5" x2="33.6" y2="18.5"/>
    <line x1="31.5" y1="23" x2="35" y2="23"/>
  </g>`;

const GRADS = `
  <linearGradient id="merc" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3b82f6"/>
    <stop offset="0.45" stop-color="#a855f7"/>
    <stop offset="0.8" stop-color="#f97316"/>
    <stop offset="1" stop-color="#e11d2a"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="42%" r="55%">
    <stop offset="0" stop-color="#7c2d12" stop-opacity="0.85"/>
    <stop offset="1" stop-color="#15100d" stop-opacity="0"/>
  </radialGradient>`;

function icon(rx) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>${GRADS}</defs>
    <rect width="512" height="512" rx="${rx}" fill="#15100d"/>
    <rect width="512" height="512" rx="${rx}" fill="url(#glow)"/>
    <svg x="136" y="120" width="240" height="240" viewBox="0 0 48 48">${THERMO}</svg>
  </svg>`;
}

const rounded = Buffer.from(icon(120));
const full = Buffer.from(icon(0)); // maskable

async function out(buf, size, name) {
  await sharp(buf).resize(size, size).png().toFile(join(PUB, name));
  console.log("✓", name, size);
}

await out(rounded, 192, "icon-192.png");
await out(rounded, 512, "icon-512.png");
await out(full, 512, "icon-maskable-512.png");
await out(rounded, 180, "apple-icon.png");
console.log("Done.");
