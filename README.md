<div align="center">

# 🔥 Italia Rovente

**Real daily and historical temperatures for 107 Italian cities, from 1940 to today.**
**Just the data, no opinions.**

[![Live site](https://img.shields.io/badge/live-italiarovente.app-ef4444?style=flat-square)](https://italiarovente.app)
[![tests](https://github.com/TheWhiteRabbitM/italiarovente.app/actions/workflows/test.yml/badge.svg)](https://github.com/TheWhiteRabbitM/italiarovente.app/actions/workflows/test.yml)
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
| **Warming** | 1991–2020 climate normal minus the 1961–1990 one — the difference between two 30-year averages, never a recent year against the past. **Why 1961–1990**: it's the World Meteorological Organization's long-standing reference climate normal, the most widely used baseline in climate science for comparability across studies and decades (WMO has since also published a 1991–2020 normal, which is what "recent" means here). Used identically on every page. |
| **Trend** | Linear regression on annual means; R² indicates how well the line fits. |
| **Grid resolution** | Each city is a single ERA5 grid point (~25–31 km across) — indicative of the area, not one weather station; doesn't capture urban heat islands. |
| **Missing data** | Excluded from averages, never treated as zero; a year needs ≥360 valid days to enter trend/decade/record calculations. |
| **Daily records** | Exclude the last ~4 months, since ERA5's preliminary data is superseded by a slightly revised "reanalyzed" version. |

Full methodology, caveats and FAQ: [`/disclaimer`](https://italiarovente.app/disclaimer).

### The exact API call

For full transparency, this is precisely what's requested from Open-Meteo (see
[`scripts/fetch-history.mjs`](scripts/fetch-history.mjs) and [`src/lib/weather.ts`](src/lib/weather.ts)):

```
GET https://archive-api.open-meteo.com/v1/archive
    ?latitude={lat}&longitude={lon}
    &start_date=1940-01-01&end_date={today}
    &daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min
    &timezone=Europe/Rome
```

- **Variables**: `temperature_2m_mean`/`_max`/`_min` for the main cities; `temperature_2m_mean`
  only for the rest, to fit within Open-Meteo's rate limits across 107 cities.
  `temperature_2m_mean` is Open-Meteo's **daily mean of air temperature at 2 m**, aggregated
  from the underlying sub-daily ERA5 data — **not** a `(max + min) / 2` estimate. This project
  doesn't recompute it; it's used exactly as returned. See
  [Open-Meteo's Historical Weather API docs](https://open-meteo.com/en/docs/historical-weather-api)
  for how they define it.
- **Units**: no `temperature_unit` parameter is passed, so Open-Meteo returns °C directly — no
  conversion is applied on our side.
- **No interpolation, no correction**: the values returned by this endpoint are used as-is; the
  only transformation this project applies is aggregation (daily → yearly/monthly/decadal means,
  anomalies, linear regression).
- For how Open-Meteo itself sources and processes ERA5, see
  [Open-Meteo's own documentation](https://open-meteo.com/en/docs/historical-weather-api) — that
  layer is outside this project's code and not something we can independently verify beyond
  what they publish.
- **Other Open-Meteo endpoints used elsewhere on the site**: the
  [Forecast API](https://open-meteo.com/en/docs) (`api.open-meteo.com/v1/forecast`) for current
  conditions and the 7-day forecast, and the
  [Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (`air-quality-api.open-meteo.com/v1/air-quality`)
  for the UV/AQI/pollen chips. Historical warming figures only ever come from the Archive API
  above.
- **Data freshness**: each city's precomputed snapshot in `history.json` carries a `lastDate`
  field — the most recent day actually covered by that snapshot. The site doesn't stamp a global
  "fetched on" date, but this per-city field is an honest, always-accurate substitute.

### Regression formula

`trend.perDecade` and `trend.r2` (shown throughout the site) come from an ordinary least squares
fit on `(year, annual mean)` pairs — the same textbook formulas, computed independently in both
[`scripts/fetch-history.mjs`](scripts/fetch-history.mjs) (build time) and
[`src/lib/weather.ts`](src/lib/weather.ts) (live fallback):

```
slope     = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)
intercept = (Σy − slope·Σx) / n
r         = (n·Σxy − Σx·Σy) / √[(n·Σx² − (Σx)²)(n·Σy² − (Σy)²)]
R²        = r²
```

### Worked example: Rome

Real numbers pulled live from [`/api/export/citta.csv`](https://italiarovente.app/api/export/citta.csv):

```
baseline (1961–1990 normal) = 14.83 °C   (average of all valid daily means in those 30 years)
recent   (1991–2020 normal) = 15.70 °C   (same calculation, next 30-year window)

warming  = recent − baseline = 15.70 − 14.83 = +0.87 °C
```

An individual year's **anomaly** (used for warming stripes and the anomaly chart) is that year's
mean minus the 1961–1990 baseline — e.g. a year averaging 15.90 °C in Rome has an anomaly of
`15.90 − 14.83 = +1.07 °C` (shown in red on the stripes; a year below 14.83 °C would be blue).

No smoothing, no outlier removal, no weighting — every complete year (≥360 valid days) counts
equally.

### How a city's coordinates are chosen

Each city in [`src/data/cities.json`](src/data/cities.json) has a fixed `lat`/`lon` — generally
close to the city's best-known central landmark (e.g. Milan's point matches Piazza del Duomo).
These were curated once, by hand, when the city list was built; there's no automated geocoding
step in this repo, and no single documented source. In practice this matters little: ERA5's grid
is ~25–31 km wide, so any reasonable point within a city almost always resolves to the same grid
cell — the choice of exact landmark doesn't change the result.

### ERA5 data revisions

Open-Meteo doesn't expose an ERA5 version number to API consumers, and this project doesn't pin
one: every fetch simply gets whatever Open-Meteo currently serves. ECMWF publishes a preliminary
"ERA5T" version within ~5 days, then a slightly revised final reanalysis a few months later. This
is exactly why absolute daily records (🔥/❄️) exclude the last ~4 months of data — see
`RECORD_CUTOFF_DAYS` in [`src/lib/weather.ts`](src/lib/weather.ts) — while yearly/monthly
aggregates, which are far less sensitive to small revisions, use the full series.

### Automated tests

```bash
npm test
```

[`scripts/test-aggregation.mjs`](scripts/test-aggregation.mjs) feeds the same `aggregate()`
function used to build `history.json` a synthetic daily series with a known, noise-free linear
trend, then checks its output against values computed independently by closed-form arithmetic
(not derived from the code under test) — climate normals, warming, decade means, regression
slope/R², leap-year day counts, and record detection.

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
├─ fetch-europe.mjs                # One-time fetch for the 14 European capitals dataset
└─ test-aggregation.mjs            # Aggregation math tested against independent expected values
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
