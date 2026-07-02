<div align="center">

# 🔥 Italia Rovente

**Real daily and historical temperatures for 107 Italian cities, from 1940 to today.**
**Just the data, no opinions.**

[![Live site](https://img.shields.io/badge/live-italiarovente.app-ef4444?style=flat-square)](https://italiarovente.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Data source](https://img.shields.io/badge/data-ERA5%20%2F%20ECMWF-0891b2?style=flat-square)](https://open-meteo.com/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

[italiarovente.app](https://italiarovente.app) · [Methodology & FAQ](https://italiarovente.app/disclaimer) · [Open data](https://italiarovente.app/dati)

</div>

---

Italia Rovente is a bilingual (Italian / English) climate-data site built to let anyone check, in
a few seconds and with a stated, verifiable method, how much a given Italian city has actually
warmed since 1940 — without narrative, without cherry-picking, and without deciding for the reader
what conclusion to draw.

## 📍 What it shows

- **107 Italian cities**, from the main ones (with real daily highs/lows) to provincial capitals.
- **City pages** (`/citta/[slug]`) — current weather, 7-day forecast, the full temperature series
  since 1940, warming stripes, monthly climatology, absolute hot/cold records, heat-day and
  tropical-night counts, UV/air-quality/pollen chips, and a handful of data-only "curiosities":
  - 🕰️ **Climate twin** — which other monitored city had, in a past decade, the same average
    annual temperature this city has today.
  - 🔥 **Summer record vs. today** — how today's temperature compares with the city's all-time
    summer record (shown only in season).
  - 🏠 **Heating degree days ("gradi giorno")** — an estimate based on Italy's official DPR 412/93
    heating-demand indicator, with the city's climate zone (A–F).
  - Each curiosity has its own shareable mini-page with a matching Open Graph preview image.
- 🏆 **Rankings** (`/classifiche`) — fastest-warming and "coolest" cities, per-decade pace,
  absolute records, tropical nights, and diurnal temperature range.
- 🗺️ **Regions** (`/regioni`) — average warming per Italian region.
- 📈 **National trend** (`/clima`) — is the warming real? put to the test with the full dataset.
- ⚖️ **City vs. city** (`/confronto`) and **Italy vs. 14 European capitals** (`/europa`), same
  method, same data source.
- 📅 **"What was the weather like on…"** — look up any day since 1940.
- 🧠 **Daily climate quiz** (`/quiz`) built entirely from the site's real numbers.
- 🤖 **"Ask the climate"** — an AI assistant that answers only with figures returned by this
  site's own data tools, never from memory; if it doesn't have the number, it says so.
- 📄 **Open data** (`/dati`) — a downloadable CSV of the per-city historical aggregates, with
  `Dataset` structured data for search engines and AI answer engines.
- 📊 **Anonymous, aggregated stats** — human visits and AI-bot/crawler traffic (by category),
  shown publicly on the disclaimer page — no personal data.
- 🔔 Push notifications for new heatwaves and a monthly recap (opt-in).
- 🌡️ Fahrenheit/Celsius toggle, light/dark theme, shareable posters and social images.

## 🧪 Data source and method

Historical data comes from the **ERA5 reanalysis by ECMWF / Copernicus Climate Change Service**
(2 m air temperature since 1940), distributed via [Open-Meteo](https://open-meteo.com/) — no API
key required. Current weather and forecasts come from Open-Meteo's IFS/ICON models.

| | |
|---|---|
| **Warming** | 1991–2020 climate normal minus the 1961–1990 one (WMO reference period) — the difference between two 30-year averages, never a recent year against the past. Used identically on every page. |
| **Trend** | Linear regression on annual means; R² indicates how well the line fits. |
| **Grid resolution** | Each city is a single ERA5 grid point (~25–31 km across) — indicative of the area, not one weather station; doesn't capture urban heat islands. |
| **Missing data** | Excluded from averages, never treated as zero; a year needs ≥360 valid days to enter trend/decade/record calculations. |
| **Daily records** | Exclude the last ~4 months, since ERA5's preliminary data is superseded by a slightly revised "reanalyzed" version. |

Full methodology, caveats and FAQ: [`/disclaimer`](https://italiarovente.app/disclaimer).

## 🛠️ Tech stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **Tailwind CSS v4**, custom Material 3 Expressive design tokens
- **Recharts** for charts, `next/og` (Satori) for generated share images
- **Upstash Redis** for stats, votes and push-subscription storage (**Vercel Blob** as fallback)
- **AI SDK** (Mistral) for the "Ask the climate" tool-grounded assistant
- **web-push** for opt-in browser notifications
- Deployed on **Vercel**, with a daily cron job

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # fetches the historical snapshot, then builds for production
npm start
```

### Environment variables

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis backend for stats/votes/push subscriptions |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Legacy alias, same purpose |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob fallback for stats storage |
| `MISTRAL_API_KEY` | "Ask the climate" AI assistant |
| `VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push notifications |
| `CRON_SECRET` | If set, `/api/refresh` requires `Authorization: Bearer <CRON_SECRET>` (Vercel sends this automatically) |
| `FETCH_BUDGET_MS`, `REFRESH_ALL` | Tuning for the historical-data fetch scripts |

All are optional in development — the site degrades gracefully (no stats backend, no push, no AI
assistant) when a variable is missing.

### Deploying

```bash
vercel            # preview
vercel --prod     # production (enables the daily cron)
```

The historical dataset for all cities is pre-computed at build time into `src/data/history.json`
(see `scripts/fetch-history.mjs`) so that city pages read instantly at runtime instead of hitting
the Open-Meteo Archive API on every request. A daily Vercel cron (`/api/refresh`) revalidates the
"recent" tail of the data and checks for new heatwaves.

## 📁 Project structure

```
src/
├─ app/
│  ├─ page.tsx                     # Home
│  ├─ citta/[slug]/page.tsx        # City detail page
│  ├─ citta/[slug]/giorno/[data]/  # "What was the weather like on…"
│  ├─ classifiche/ regioni/ clima/ confronto/ europa/ quiz/
│  ├─ condividi/                   # Shareable pages + OG images/posters
│  ├─ dati/                        # Open data / CSV export
│  ├─ disclaimer/                  # Methodology, FAQ, license, live stats
│  ├─ en/                          # Thin English wrappers for every route above
│  └─ api/                         # refresh (cron), ask (AI), push, stats, vote, export
├─ components/                     # Charts, WarmingStripes, ShareButtons, QuickShare, ...
└─ lib/
   ├─ cities.ts                    # City list, coordinates, region/zone metadata
   ├─ weather.ts                   # Open-Meteo fetch + aggregation (yearly/monthly/decades)
   ├─ climateAnalog.ts, degreedays.ts, curiosities.ts
   ├─ format.ts                    # Temperature formatting, Celsius/Fahrenheit, colors
   └─ redis.ts, stats.ts, botstats.ts
scripts/
├─ fetch-history.mjs               # Pre-computes src/data/history.json at build time
└─ fetch-europe.mjs                # One-time fetch for the 14 European capitals dataset
vercel.json                        # Daily cron configuration
```

## 📄 License

Code is released under the **MIT License** (see [LICENSE](LICENSE)). The **weather data** is not
covered by the MIT license: it belongs to Open-Meteo / ECMWF / Copernicus Climate Change Service
and is subject to their respective terms and attribution requirements.

> ⚠️ Illustrative/informational use — not an official weather service, not for critical decisions.

---

<div align="center">

Data © Open-Meteo · ERA5 © ECMWF / Copernicus · Code © 2026 Italia Rovente (MIT)

</div>
