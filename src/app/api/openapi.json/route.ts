import { SITE_URL } from "@/lib/site";
import { CITIES } from "@/lib/cities";
import { publicHeaders, SITE_LICENSE } from "@/lib/publicapi";

export const revalidate = 86400;


// Specifica OpenAPI 3.1 delle API pubbliche in sola lettura.
//
// Descrive SOLO gli endpoint sotto /api/export/: quelli che scrivono, costano
// (LLM) o servono al cron non sono documentati e sono vietati in robots.txt.
// Se aggiungi un endpoint pubblico, aggiungilo anche qui e a PUBLIC_API in
// src/app/robots.ts: una specifica incompleta è peggio di nessuna specifica.
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Italia Rovente — Open Climate API",
      version: "1.0.0",
      summary: "Historical temperature aggregates for Italian cities and seas.",
      description: [
        "Read-only, unauthenticated, CORS-enabled JSON and CSV endpoints.",
        "",
        "Air data: ERA5 reanalysis (ECMWF/Copernicus C3S) via Open-Meteo, daily since 1940, aggregated into a snapshot at build time. Sea data: Open-Meteo Marine API, daily since 2022-11-24.",
        "",
        "Every response carries `dataset_generated_at` and `dataset_sha256`: the fingerprint lets you verify that the published aggregates were not altered, by re-running the same aggregation on the same raw data. Method and caveats are stated in each payload rather than assumed.",
        "",
        "No API key, no rate limit beyond ordinary CDN fair use. Attribution required: \"Italia Rovente (italiarovente.app), dati ERA5/ECMWF via Open-Meteo\".",
      ].join("\n"),
      license: { name: SITE_LICENSE, url: `${SITE_URL}/disclaimer#licenza` },
      contact: { url: `${SITE_URL}/dati/api` },
    },
    servers: [{ url: SITE_URL }],
    externalDocs: { description: "Human documentation", url: `${SITE_URL}/dati/api` },
    tags: [
      { name: "cities", description: "Per-city historical aggregates (air temperature)" },
      { name: "month", description: "The most recently concluded month, ranked against history" },
      { name: "seas", description: "Daily sea surface temperature archive" },
    ],
    paths: {
      "/api/export/citta.json": {
        get: {
          tags: ["cities"],
          summary: "All monitored cities, one row each",
          description:
            "Climate normals (1961-1990 and 1991-2020), warming, per-decade trend with its 95% confidence interval, R², and the first year of the series.",
          responses: {
            "200": {
              description: "OK",
              content: { "application/json": { schema: { $ref: "#/components/schemas/CitiesExport" } } },
            },
          },
        },
      },
      "/api/export/citta.csv": {
        get: {
          tags: ["cities"],
          summary: "The same city aggregates, as CSV",
          responses: {
            "200": { description: "OK", content: { "text/csv": { schema: { type: "string" } } } },
          },
        },
      },
      "/api/export/citta/{slug}": {
        get: {
          tags: ["cities"],
          summary: "One city, in full",
          description:
            "Everything needed to recompute this city's published numbers from scratch: the yearly series, annual anomalies, decade means, monthly climatology, the per-(year, month) series behind /mese, absolute records, and the trend with its confidence interval.",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              description: `City identifier, e.g. "roma". The full list is in /api/export/citta.json (${CITIES.length} cities).`,
              schema: { type: "string", examples: ["roma", "milano", "palermo"] },
            },
          ],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { type: "object" } } } },
            "404": { description: "Unknown slug", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "503": { description: "City known, but its snapshot is not built yet", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/export/mese.json": {
        get: {
          tags: ["month"],
          summary: "The month just ended, ranked against every same-calendar month since 1940",
          description:
            "National anomaly against the 1961-1990 normal of that same calendar month, its rank, the full year-by-year series for that month, and a city-by-city breakdown. Ties share a rank. Not a replication of Copernicus' bulletins: different domain and baseline.",
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { type: "object" } } } },
            "503": { description: "Not enough cities covered yet", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/export/mari.json": {
        get: {
          tags: ["seas"],
          summary: "Daily sea surface temperature, six open-water points",
          description:
            "Mean, max and min per day since 2022-11-24. Days missing upstream are omitted rather than interpolated. About three years: too short for a climate trend, and none is published.",
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SeasExport" } } } },
          },
        },
      },
      "/api/export/mari.csv": {
        get: {
          tags: ["seas"],
          summary: "The same sea archive, long format (one row per sea per day)",
          responses: {
            "200": { description: "OK", content: { "text/csv": { schema: { type: "string" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: { type: "string", examples: ["not-found", "no-data", "not-ready"] },
            message: { type: "string" },
          },
        },
        Provenance: {
          type: "object",
          description: "Present on every successful response.",
          properties: {
            source: { type: "string", const: "Italia Rovente (italiarovente.app)" },
            license: { type: "string" },
            documentation: { type: "string", format: "uri" },
            dataset_source: { type: ["string", "null"] },
            dataset_generated_at: {
              type: ["string", "null"],
              format: "date",
              description: "When the underlying snapshot was recomputed — not the time of this HTTP request.",
            },
            dataset_sha256: {
              type: ["string", "null"],
              description: "SHA-256 of the per-entity aggregates, for independent verification.",
            },
            fetched_at: { type: "string", format: "date-time" },
          },
        },
        City: {
          type: "object",
          properties: {
            slug: { type: "string", examples: ["roma"] },
            name: { type: "string", examples: ["Roma"] },
            region: { type: "string" },
            lat: { type: "number" },
            lon: { type: "number" },
            baseline_1961_1990: { type: "number", description: "WMO climate normal, °C" },
            normal_1991_2020: { type: "number", description: "°C" },
            warming_c: { type: "number", description: "normal_1991_2020 − baseline_1961_1990" },
            per_decade_c: { type: "number", description: "OLS slope on annual means, °C/decade" },
            per_decade_ci95: {
              type: ["number", "null"],
              description: "± margin of the 95% CI on the slope. null when not computable.",
            },
            r2: { type: "number" },
            series_start_year: { type: "integer" },
          },
        },
        CitiesExport: {
          allOf: [
            { $ref: "#/components/schemas/Provenance" },
            {
              type: "object",
              properties: {
                method: { type: "string" },
                count: { type: "integer" },
                cities: { type: "array", items: { $ref: "#/components/schemas/City" } },
              },
            },
          ],
        },
        SeaDay: {
          type: "object",
          properties: {
            date: { type: "string", format: "date" },
            mean: { type: "number" },
            max: { type: "number" },
            min: { type: "number" },
          },
        },
        SeasExport: {
          allOf: [
            { $ref: "#/components/schemas/Provenance" },
            {
              type: "object",
              properties: {
                series_start: { type: ["string", "null"], format: "date" },
                last_date: { type: ["string", "null"], format: "date" },
                units: { type: "string", const: "degrees Celsius" },
                caveats: { type: "array", items: { type: "string" } },
                seas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slug: { type: "string", examples: ["tirreno"] },
                      name: { type: "string" },
                      name_en: { type: "string" },
                      lat: { type: "number" },
                      lon: { type: "number" },
                      days: { type: "integer" },
                      series: { type: "array", items: { $ref: "#/components/schemas/SeaDay" } },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  };

  return Response.json(spec, { headers: publicHeaders() });
}
