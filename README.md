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
  - 📅 **Longest heatwave / longest cold snap on record** — the longest consecutive run of days
    ≥35 °C, and separately the longest run of frost days (min ≤0 °C), computed from the same
    daily series already fetched for the yearly aggregates.
  - Each curiosity has its own shareable mini-page with a matching Open Graph preview image, and
    the homepage headline itself rotates through a live curiosity on every visit.
- 🏆 **Rankings** (`/classifiche`) — fastest-warming and "coolest" cities, per-decade pace,
  absolute records, days of extreme/"African" heat (≥30 °C), tropical nights, and diurnal
  temperature range.
- 📅 **Monthly bulletin** (`/mese`) — the Copernicus-style question ("was this the hottest June on
  record?") answered for Italy only: the month just ended, its anomaly against the 1961–1990
  normal *of that same calendar month*, its rank among every other instance of that month since
  1940, warming stripes restricted to that single month, and a city-by-city breakdown. The page
  states explicitly that it neither replicates nor verifies Copernicus' bulletins — different
  domain (only our monitored cities) and often a different baseline, so different numbers are
  expected rather than a sign one side is wrong.
- 🌊 **Sea temperatures** — today's surface temperature for six open-water points, each with the
  last 365 days of daily means from our own archive (since 2022-11-24) and the warmest day on
  record *for that series*. Explicitly no trend: three years is not a climate signal.
- 👤 **Follow your city** — an optional, no-account, `localStorage`-only shortcut on the homepage
  that shows a saved city's current temperature and warming figure at a glance.
- 🗺️ **Regions** (`/regioni`) — average warming per Italian region.
- 📈 **National trend** (`/clima`) — is the warming real? put to the test with the full dataset.
- ⚖️ **City vs. city** (`/confronto`) and **Italy vs. 14 European capitals** (`/europa`), same
  method, same data source.
- 📅 **"What was the weather like on…"** — look up any day since 1940.
- 🧠 **Daily climate quiz** (`/quiz`) built entirely from the site's real numbers.
- 🤖 **"Ask the climate"** — an AI assistant that answers only with figures returned by this
  site's own data tools, never from memory; if it doesn't have the number, it says so.
- 📄 **Open data** (`/dati`) — downloadable CSV and JSON of the per-city historical aggregates,
  with `Dataset` structured data for search engines and AI answer engines.
- 🔌 **Public API** (`/dati/api`) — read-only, no key, CORS enabled, with an OpenAPI 3.1 spec at
  `/api/openapi.json`. Cities (all, or one in full), the monthly bulletin, and the sea archive, as
  JSON or CSV. Every response ships its own provenance and a SHA-256 fingerprint, so a reader can
  recompute the numbers instead of trusting them.
- 🧭 **AEO-friendly by design** — [`/llms.txt`](https://italiarovente.app/llms.txt) points AI
  assistants to the right page for common questions and gives ready-to-use, live-numbered
  citation examples, on top of `FAQPage`/`Dataset`/`Organization` structured data site-wide.
- 📡 **RSS feed** (`/feed.xml`) — new absolute records, incoming heatwaves, and the monthly recap.
- 📊 **Anonymous, aggregated stats** — human visits and AI-bot/crawler traffic (by category),
  including a daily history table, shown publicly on the disclaimer page — no personal data.
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

### Monthly comparison

Ranking a month against history needs a different aggregate from the ones above. `monthly` holds
the *climatology* — one average per calendar month over the whole series — which cannot answer
"was this June the hottest?". So each snapshot also carries `monthlySeries`: the mean of every
individual `(year, month)` pair, plus its day count.

Everything on `/mese` is built from it, with three deliberate constraints:

- **Baseline is the 1961–1990 normal of that same calendar month**, not the whole-series average —
  the same reference the warming stripes, the annual anomalies and the Verdict already use. A month
  needs ≥20 years inside that window or no anomaly is published for it.
- **A month counts only with ≥24 valid days**, so a month still in progress is never presented as
  concluded. The national figure additionally requires at least half of the cities that have a
  monthly series.
- **A rank needs ≥15 years** of the same calendar month behind it, and the direction shown is
  whichever end is closer ("2nd hottest of 87", never the same fact restated as "86th coldest").

Because the snapshot fills in city by city across builds (Open-Meteo rate limits), `/mese` prints
how many cities actually back the national number rather than implying all 107.

### Summer mugginess (apparent temperature), stated honestly

Main-city snapshots also carry `summerApparent` — the Jun–Aug mean of the daily *apparent*
maximum (Open-Meteo's model of felt temperature: humidity, wind, radiation) alongside the dry
maximum, per year, available since 1940. The widget on main city pages compares the two 30-year
normals, same method as everything else.

The framing is deliberately restrained, because the data demands it. The felt summer has risen
(+2.1 °C in Rome between the two periods), but **most of that is the dry heat itself** — the dry
maximum rose +1.9 °C. Humidity adds only a little on top, and unevenly: the apparent-minus-dry gap
grows by just 0.1–0.5 °C, more on the humid coasts (Naples, Genoa) than inland (Bologna). The
component says all of this out loud rather than selling "mugginess is exploding", and repeats that
apparent temperature is a model estimate, less solid than the measured value. Only main cities have
it (the 4-variable fetch), so it is optional everywhere and simply absent on the rest.

### The sea archive (and why it has no trend)

Sea surface temperature comes from a different source (Open-Meteo **Marine** API,
separate rate limit from the ERA5 archive) and a much shorter series. We keep our own
daily archive of it in `src/data/sea-history.json`, rebuilt incrementally by
[`scripts/fetch-sea.mjs`](scripts/fetch-sea.mjs) at build time, with the same
`_meta` provenance + SHA-256 fingerprint as `history.json`.

Six open-water points, daily mean/max/min, **from 2022-11-24** — the first day the
source returns a value for all six (before that it is `null` everywhere). Storage is
a start date plus three parallel arrays indexed by day offset, so a date is never
repeated 1300 times and gaps stay explicit.

Three properties are enforced by tests rather than by convention:

- **The source's gaps are preserved as `null`.** There is a genuine 14-day hole in the
  upstream data (2025-01-29 → 2025-02-11, verified by querying the API directly). We
  keep it. Interpolating it would mean inventing two weeks of measurements.
- **The last days are re-fetched, not trusted.** Recent marine analysis can be revised,
  so each run rewrites a 10-day window instead of appending blindly. Today's value never
  enters the archive at all — it is a forecast, and stays a live figure on the homepage.
- **The mean may sit up to 0.1 °C outside its own min–max.** The source rounds all three
  to one decimal independently, so a winter day with almost no diurnal range reads
  `mean=16.9, min=max=17.0`. That is a rounding artifact of the source, bounded by one
  rounding unit across all 7,860 valid days; `min > max` never happens.

**There is deliberately no trend function in `src/lib/seahistory.ts`, and none should be
added.** Three years measures interannual noise, not climate. The archive is for records
*of the series*, seasonality, and year-over-year comparison of the same calendar day —
which is why `sameDayPreviousYears` lists the two or three past values individually
instead of averaging them into a fake "normal". For a trend, use the air data since 1940.

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

### Confidence interval on the trend

`trend.perDecadeCi95` is the ± margin of a **95% confidence interval on the regression slope**,
also computed independently in both files — not indispensable, but the difference between "we
see warming" and "we can bound how uncertain that pace is":

```
residual_i = y_i − (intercept + slope·x_i)
SSE        = Σ residual_i²                        (sum of squared residuals)
Sxx        = Σx² − (Σx)²/n                         (sum of squared deviations of x from its mean)
SE(slope)  = √[ SSE / (n−2) / Sxx ]                 (standard error of the slope)
CI95       = t(0.975, df=n−2) · SE(slope)           (± margin, same units as slope)
```

`t(0.975, df)` (two-tailed, 95%) is read from a small table of standard critical values and
linearly interpolated between tabulated degrees of freedom; for `df ≥ 120` the normal
approximation (1.96) is used, which for this site's series (n ≈ 80–86 years, df ≈ 78–84) differs
from an exact tabulated value by roughly a thousandth — a documented approximation, not a hidden
rounding error. See `T_TABLE`/`tCrit95` in
[`scripts/fetch-history.mjs`](scripts/fetch-history.mjs) and
[`src/lib/weather.ts`](src/lib/weather.ts).

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

Open-Meteo not versioning ERA5 upstream, and the fact that the "true" published ERA5T→ERA5
revision isn't independently re-fetchable after the fact, are acknowledged limits of this
project's reproducibility that no amount of local tooling can fully close — see the note above on
why daily records exclude the last ~4 months.

### Dataset provenance and integrity

Every `src/data/history.json` build writes a `_meta` block (see `scripts/fetch-history.mjs`):

```json
{
  "generatedAt": "2026-07-03",
  "source": "Open-Meteo Archive API — ERA5 reanalysis (ECMWF/Copernicus C3S)",
  "commit": "73fd5b4",
  "sha256": "…64 hex chars…"
}
```

`sha256` is a fingerprint of every city's aggregated output (sorted by slug for a deterministic
result independent of fetch order): a SHA-256 hash over each `slug + JSON.stringify(aggregate)`
pair, concatenated. Recomputing `aggregate()` on the same raw daily series and getting the same
hash is an independent check that the published numbers weren't altered in between — this is
surfaced on [`/dati`](https://italiarovente.app/dati) and in
[`/api/export/citta.json`](https://italiarovente.app/api/export/citta.json)
(`dataset_generated_at`/`dataset_source`/`dataset_build`).

### E-OBS cross-check — live on the 12 main city pages

The site's historical numbers all come from **ERA5**, a *reanalysis* (a physical model constrained
by observations, not raw station data). To sanity-check ERA5 independently, `scripts/fetch-cds.mjs`
fetches a second, genuinely independent data source: **E-OBS**, the station-based gridded dataset
from the [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/) (CDS), built by
[ECA&D](https://www.ecad.eu/) from actual European weather-station records — not model output.

**Licensing**: E-OBS carries a stricter clause than the general Copernicus CC-BY 4.0 license,
restricting use to *"non-commercial research and non-commercial education projects only."* ECA&D
(eca@knmi.nl) confirmed by email on 2026-07-03 that italiarovente.app's described use — validating
our own ERA5-derived analyses and publishing only derived aggregate statistics (yearly means, never
the raw E-OBS data) with attribution — falls within that non-commercial scope, conditional on: the
project staying non-commercial, never redistributing raw E-OBS data, and displaying the required
citation (E-OBS/ECA&D/UERRA/Copernicus + Cornes et al. 2018 — see `EOBS_ATTRIBUTION` in
`scripts/fetch-cds.mjs`). `fetch-cds.mjs` enforces the "aggregates only" condition in code: daily
values are read via NetCDF hyperslab slicing and aggregated to yearly means entirely in memory,
never written to disk.

**How it works**: CDS's job-submission API returned real results in 20–60 seconds in testing — far
faster than the multi-hour worst case documented publicly, though latency isn't guaranteed. Three
real bugs only surfaced once actually run against live data (each independently verified and
fixed): the result is a **zip** wrapping the NetCDF, not a raw NetCDF; the temperature variable is
packed as 16-bit integers requiring `scale_factor`/`add_offset` unpacking (not plain floats); and
because E-OBS is **land-only**, the naive nearest grid cell for a coastal city can land in the sea
(all-fill-value) — `fetch-cds.mjs` now searches outward for the nearest grid cell with real data.
Runs monthly via `.github/workflows/eobs-refresh.yml` (`workflow_dispatch` also available for a
manual run) — E-OBS versions are released periodically, not daily, and job latency is unpredictable
enough to be a poor fit for the live Vercel build.

**Current status**: `src/data/eobs.json` holds real per-city yearly means for all 12 main cities,
`_meta.status: "confirmed"`. Both sources agree on the *direction* of warming everywhere; the
*magnitude* varies city by city (e.g. Rome: +0.90 °C E-OBS vs +0.88 °C ERA5, very close; Florence:
+0.26 °C vs +0.99 °C, a real divergence) — expected given the different methodologies (station
network vs model reanalysis), and exactly the kind of signal a genuine cross-check should surface.

`src/lib/eobs.ts`'s `getEobsComparison(citySlug)` computes the same "two 30-year normals" warming
figure used everywhere on the site, applied to the E-OBS series — same method, different source. The
[`EobsCrossCheck`](src/components/EobsCrossCheck.tsx) component shows it right after the Verdetto
card on each of the 12 main cities' pages (absent on the other 95 cities, which have no E-OBS data).
It's deliberately framed as a **comparison, not a confirmation**: both warming figures are shown side
by side, with an explicit note that a difference of a few tenths of a degree between the two is
normal — different methods, resolutions and station networks — not a sign either source is wrong.
The required E-OBS/ECA&D/Cornes et al. citation is shown in every card, and a dedicated
[disclaimer FAQ entry](https://italiarovente.app/disclaimer) explains the methodology gap in more
depth (also feeds the page's `FAQPage` structured data).

If/when this goes live, it will run on its own schedule: a separate, **monthly**
`.github/workflows/eobs-refresh.yml` GitHub Actions workflow (E-OBS versions are released
periodically, not daily, and CDS job latency can range from minutes to 20+ hours under congestion —
incompatible with the daily Vercel build cron).

### Automated tests

```bash
npm test
```

[`scripts/test-aggregation.mjs`](scripts/test-aggregation.mjs) feeds the same `aggregate()`
function used to build `history.json` a synthetic daily series with a known, noise-free linear
trend, then checks its output against values computed independently by closed-form arithmetic
(not derived from the code under test) — climate normals, warming, decade means, regression
slope/R²/confidence interval, leap-year day counts, and record detection.

A separate **golden dataset test** guards against silent algorithm drift on *real* data: a fixed
5-year daily series for Rome (2015–2019, fetched once from Open-Meteo and committed at
[`scripts/fixtures/golden-roma-2015-2019.json`](scripts/fixtures/golden-roma-2015-2019.json)) is
run through `aggregate()`, and specific outputs (a year's mean, the trend, the hot/cold records —
which happen to land on the well-documented August 2017 heatwave and the February 2018 "Burian"
cold snap) are asserted against values frozen once and committed alongside the fixture. Unlike the
synthetic tests above, this doesn't prove the numbers are *correct* in an absolute sense — it
proves the algorithm's output on this exact real input hasn't silently changed. An intentional
algorithm change that alters these values must update the frozen expectations deliberately, in the
same commit, with a stated reason.

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

### The public API surface

Only `/api/export/*` and `/api/openapi.json` are public. They are `GET`-only, idempotent, free to
serve, and carry no personal data; `src/lib/publicapi.ts` gives them a single set of headers (CORS,
`Cache-Control`, `X-Attribution` — exposed via `Access-Control-Expose-Headers`, or cross-origin JS
could not read it).

Everything else under `/api/` stays disallowed in `robots.txt` and undocumented: `/api/ask` spends
money on an LLM, `/api/vote`, `/api/visit` and `/api/push/subscribe` write, `/api/refresh` is the
cron. **`robots.txt` previously disallowed `/api/` wholesale**, which quietly hid the CSV and JSON
exports from the very AI crawlers they were built for — the allow rules for the public paths are
what make them reachable, since robots resolves by longest match.

No `OPTIONS` handlers, deliberately: a cross-origin `GET` without custom headers is a *simple
request* and never triggers a preflight, while exporting `OPTIONS` would force Next to make the
route dynamic and lose build-time static generation.

When adding a public endpoint, add it to `PUBLIC_API` in `src/app/robots.ts`, to the OpenAPI spec,
and to `/dati/api`. A spec that lies is worse than no spec.

### iOS splash screens

Android generates its launch screen from the manifest (icon + colors). **iOS
ignores the manifest for this** — without `apple-touch-startup-image` links an
installed PWA shows a blank screen on launch. `scripts/gen-splash.mjs`
(`npm run gen-splash`) renders one branded splash per common iPhone/iPad
resolution, light and dark, into `public/splash/`; the device list lives in
`src/data/ios-splash.json` and the layout emits the `<link>` tags from that
same list, so images and media queries can't drift apart. The dark variant is
listed after the light one for each device because iOS applies the last match.

### Android app (TWA) — what's prepared, what's yours to do

The manifest is already TWA-ready, and `/.well-known/assetlinks.json` is served
by a route that reads the signing-key fingerprint from an env var — so the
site side is done and the file populates itself once you have a key, with no
code change:

1. `npm i -g @bubblewrap/cli` (Bubblewrap can install the JDK + Android SDK it
   needs), then `bubblewrap init --manifest https://italiarovente.app/manifest.webmanifest`
   using package name `app.italiarovente.twa`. Or use [PWABuilder](https://www.pwabuilder.com/).
2. `bubblewrap build` produces a signed AAB and prints the key's **SHA-256
   fingerprint**.
3. Set that fingerprint on Vercel as `ANDROID_CERT_FINGERPRINT` (comma-separate
   several; also `ANDROID_APP_PACKAGE` if you changed the package) and redeploy.
   `/.well-known/assetlinks.json` goes from `[]` to the real link — verify with
   Google's [statement-list tester](https://developers.google.com/digital-asset-links/tools/generator).
   Only then does the TWA open full-screen without Chrome's address bar.
4. Upload the AAB to the Play Console (needs a Google Play Developer account,
   a one-time $25).

This repo can't do steps 1–4: they need the Android SDK, a keystore, and a Play
account, none of which live here. **Home-screen widgets are a separate matter
entirely** — they require native Android code (`AppWidgetProvider`), not
reachable from a PWA or a plain TWA; the manifest `widgets` field targets only
Windows 11's widget board, not Android's home screen.

### Shipping to the PWA, not just to the web

The site installs a service worker, so **a deploy is not live until installed users get it too.**
`public/sw.js` derives its cache name from the build (`ir-<commit>`): `PWARegister` registers
`/sw.js?v=<build>`, the changed URL makes the browser install the new worker, and `activate` then
deletes every `ir-*` cache that is not the current one. Without that, `activate` had nothing to
delete and the precached `offline.html`, `manifest.webmanifest` and icons stayed frozen forever on
installed devices.

In development the worker is **not** registered, and any existing one is unregistered on load.
`next dev` serves chunks under stable, unhashed URLs, so the worker's cache-first strategy would
hand back the previous version of a component you just edited — a hydrated DOM that contradicts the
served HTML, and a genuinely nasty thing to debug.

When verifying a deploy, check the served content *and* the worker. If the DOM disagrees with the
HTML you just fetched, suspect the service worker first:

```js
await navigator.serviceWorker.getRegistrations()   // which script URL is active?
await caches.keys()                                // should be exactly one ir-<commit>
```

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
├─ fetch-cds.mjs                   # E-OBS cross-check via Copernicus CDS (scaffolding, not yet live)
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
