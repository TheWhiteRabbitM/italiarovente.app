import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import { getHistoryMeta } from "@/lib/weather";
import { getSeaHistoryMeta } from "@/lib/seahistory";

export const metadata = {
  title: "API pubblica · Dati climatici italiani, senza chiave",
  description:
    "API pubblica, gratuita e senza autenticazione con le temperature storiche delle città italiane (ERA5 dal 1940) e l'archivio giornaliero dei mari. JSON e CSV, CORS aperto, specifica OpenAPI.",
  keywords: [
    "api clima italia",
    "api temperature italia",
    "open data api meteo",
    "api era5 italia",
    "italia rovente api",
  ],
  alternates: { canonical: "/dati/api", languages: { en: "/en/dati/api" } },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/dati/api`,
    title: "API pubblica · Italia Rovente",
    description:
      "Temperature storiche italiane via API: JSON, CSV, OpenAPI. Nessuna chiave, CORS aperto, con impronta SHA-256 per verificare i dati.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

type Lang = "it" | "en";

type Endpoint = {
  path: string;
  method: "GET";
  it: string;
  en: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    path: "/api/export/citta.json",
    method: "GET",
    it: "Tutte le città, una riga ciascuna: normali 1961–1990 e 1991–2020, riscaldamento, tendenza per decennio con intervallo di confidenza al 95%, R².",
    en: "All cities, one row each: 1961–1990 and 1991–2020 normals, warming, per-decade trend with its 95% confidence interval, R².",
  },
  {
    path: "/api/export/citta.csv",
    method: "GET",
    it: "Gli stessi aggregati, in CSV.",
    en: "The same aggregates, as CSV.",
  },
  {
    path: "/api/export/citta/roma",
    method: "GET",
    it: "Una città per intero: serie annua, anomalie, medie decennali, climatologia mensile, la serie mese-per-anno dietro /mese, i record e il trend. È l'endpoint per rifare i conti da zero.",
    en: "One city in full: yearly series, anomalies, decade means, monthly climatology, the per-(year, month) series behind /mese, records and trend. This is the endpoint for recomputing everything from scratch.",
  },
  {
    path: "/api/export/mese.json",
    method: "GET",
    it: "Il mese appena concluso: anomalia nazionale, posto in classifica fra tutti gli stessi mesi dal 1940, serie completa e dettaglio città per città.",
    en: "The month just ended: national anomaly, its rank among every same-calendar month since 1940, the full series and a city-by-city breakdown.",
  },
  {
    path: "/api/export/mari.json",
    method: "GET",
    it: "L'archivio giornaliero della temperatura del mare (media, max, min) per sei punti in mare aperto, dal 24 novembre 2022.",
    en: "The daily sea surface temperature archive (mean, max, min) for six open-water points, since 24 November 2022.",
  },
  {
    path: "/api/export/mari.csv",
    method: "GET",
    it: "Lo stesso archivio marino, una riga per mare e per giorno.",
    en: "The same sea archive, one row per sea per day.",
  },
  {
    path: "/api/openapi.json",
    method: "GET",
    it: "La specifica OpenAPI 3.1 di tutto quanto sopra.",
    en: "The OpenAPI 3.1 specification for everything above.",
  },
];

const STR = {
  it: {
    backLink: "← Dati aperti",
    backHref: "/dati",
    title: "API pubblica",
    subtitle:
      "Nessuna chiave, nessuna registrazione, CORS aperto. Solo GET: leggere questi dati non cambia nulla e non costa nulla.",
    endpointsTitle: "🔌 Endpoint",
    tryTitle: "▶️ Provala subito",
    trySub: "Copia e incolla: nessuna autenticazione, nessun header speciale.",
    verifyTitle: "🔍 Come verificare che i numeri siano veri",
    verifyBody: (sha: string | null) => (
      <>
        Ogni risposta porta con sé <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">dataset_generated_at</code> (quando lo
        snapshot è stato ricalcolato, non l&apos;ora della richiesta) e{" "}
        <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">dataset_sha256</code>, l&apos;impronta degli aggregati per-città.
        Riesegui{" "}
        <a className="text-secondary font-semibold hover:underline" href="https://github.com/TheWhiteRabbitM/italiarovente.app/blob/main/scripts/fetch-history.mjs">
          <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">aggregate()</code>
        </a>{" "}
        sugli stessi dati grezzi di Open-Meteo e devi riottenere esattamente questi numeri e questa
        impronta. Se non tornano, uno dei due ha sbagliato — e vogliamo saperlo.
        {sha ? (
          <>
            {" "}Impronta attuale: <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded break-all">{sha}</code>.
          </>
        ) : null}
      </>
    ),
    methodTitle: "🧪 Metodo, dichiarato dentro ogni risposta",
    methodItems: [
      <>
        <strong>Riscaldamento</strong> = normale 1991–2020 meno normale 1961–1990 (due trentenni
        WMO). Mai un anno recente contro il passato.
      </>,
      <>
        <strong>Tendenza</strong> = regressione lineare sulle medie annue dei soli anni completi,
        con intervallo di confidenza al 95% sulla pendenza.
      </>,
      <>
        <strong>Anomalia mensile</strong> = scarto dalla normale 1961–1990 <em>dello stesso mese di
        calendario</em>, non dalla media dell&apos;intera serie.
      </>,
      <>
        <strong>I mari non hanno una tendenza.</strong> La serie inizia nel novembre 2022: tre anni
        misurano il rumore interannuale, non il clima. Non pubblichiamo una pendenza, e non
        dovreste calcolarla nemmeno voi.
      </>,
    ],
    limitsTitle: "⚠️ Limiti dichiarati",
    limits: [
      "I giorni mancanti nella fonte non vengono interpolati: nell'archivio marino manca davvero il periodo 29 gennaio – 11 febbraio 2025, e resta mancante.",
      "I record giornalieri assoluti ignorano gli ultimi 120 giorni: ERA5 recente (ERA5T) è preliminare e può essere rivisto.",
      "La copertura dello snapshot cresce build dopo build (Open-Meteo limita le richieste): il dato nazionale mensile dichiara sempre su quante città poggia.",
      "Non è un servizio meteorologico ufficiale. Uso informativo e divulgativo, non per decisioni critiche.",
    ],
    licenseTitle: "📄 Licenza e attribuzione",
    licenseBody: (
      <>
        Uso libero, anche commerciale, con attribuzione a{" "}
        <strong>Italia Rovente (italiarovente.app)</strong> e alla fonte originale (ERA5 —
        ECMWF/Copernicus C3S, via Open-Meteo). Nessun rate limit oltre il normale uso corretto della
        CDN. Se costruisci qualcosa con questi dati, ci fa piacere saperlo.
      </>
    ),
    aiTitle: "🤖 Per assistenti AI",
    aiBody: (
      <>
        Gli endpoint sotto <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">/api/export/</code> sono esplicitamente permessi in{" "}
        <Link className="text-secondary font-semibold hover:underline" href="/robots.txt">robots.txt</Link>. L&apos;indice pensato per i
        modelli è <Link className="text-secondary font-semibold hover:underline" href="/llms.txt">llms.txt</Link>, la specifica leggibile a
        macchina è <Link className="text-secondary font-semibold hover:underline" href="/api/openapi.json">openapi.json</Link>. Tutto il resto
        sotto <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">/api/</code> è vietato ai crawler: scrive, costa, oppure è il
        cron interno.
      </>
    ),
    coverage: (cities: number, seaStart: string | null, gen: string | null) =>
      [
        `${cities} città`,
        seaStart ? `mari dal ${seaStart}` : null,
        gen ? `snapshot del ${gen}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
  en: {
    backLink: "← Open data",
    backHref: "/en/dati",
    title: "Public API",
    subtitle:
      "No key, no signup, CORS enabled. GET only: reading this data changes nothing and costs nothing.",
    endpointsTitle: "🔌 Endpoints",
    tryTitle: "▶️ Try it now",
    trySub: "Copy and paste: no authentication, no special headers.",
    verifyTitle: "🔍 How to check the numbers are real",
    verifyBody: (sha: string | null) => (
      <>
        Every response carries <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">dataset_generated_at</code> (when the snapshot
        was recomputed, not the time of your request) and <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">dataset_sha256</code>,
        the fingerprint of the per-city aggregates. Re-run{" "}
        <a className="text-secondary font-semibold hover:underline" href="https://github.com/TheWhiteRabbitM/italiarovente.app/blob/main/scripts/fetch-history.mjs">
          <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">aggregate()</code>
        </a>{" "}
        on the same raw Open-Meteo data and you must get exactly these numbers and this fingerprint.
        If they disagree, one of us is wrong — and we want to know.
        {sha ? (
          <>
            {" "}Current fingerprint: <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded break-all">{sha}</code>.
          </>
        ) : null}
      </>
    ),
    methodTitle: "🧪 Method, stated inside every response",
    methodItems: [
      <>
        <strong>Warming</strong> = the 1991–2020 normal minus the 1961–1990 normal (two WMO
        thirty-year periods). Never a recent year against the past.
      </>,
      <>
        <strong>Trend</strong> = ordinary least squares on the annual means of complete years only,
        with a 95% confidence interval on the slope.
      </>,
      <>
        <strong>Monthly anomaly</strong> = deviation from the 1961–1990 normal <em>of that same
        calendar month</em>, not from the whole-series average.
      </>,
      <>
        <strong>The seas have no trend.</strong> The series begins in November 2022: three years
        measure interannual noise, not climate. We publish no slope, and neither should you.
      </>,
    ],
    limitsTitle: "⚠️ Stated limits",
    limits: [
      "Days missing upstream are not interpolated: the sea archive genuinely lacks 29 January – 11 February 2025, and keeps lacking it.",
      "Absolute daily records ignore the last 120 days: recent ERA5 (ERA5T) is preliminary and may be revised.",
      "Snapshot coverage grows build after build (Open-Meteo rate limits): the national monthly figure always states how many cities back it.",
      "This is not an official weather service. Informational use, not for critical decisions.",
    ],
    licenseTitle: "📄 License and attribution",
    licenseBody: (
      <>
        Free to use, commercially too, with attribution to{" "}
        <strong>Italia Rovente (italiarovente.app)</strong> and the original source (ERA5 —
        ECMWF/Copernicus C3S, via Open-Meteo). No rate limit beyond ordinary CDN fair use. If you
        build something with this data, we&apos;d love to hear about it.
      </>
    ),
    aiTitle: "🤖 For AI assistants",
    aiBody: (
      <>
        Endpoints under <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">/api/export/</code> are explicitly allowed in{" "}
        <Link className="text-secondary font-semibold hover:underline" href="/robots.txt">robots.txt</Link>. The model-facing index is{" "}
        <Link className="text-secondary font-semibold hover:underline" href="/llms.txt">llms.txt</Link>, the machine-readable spec is{" "}
        <Link className="text-secondary font-semibold hover:underline" href="/api/openapi.json">openapi.json</Link>. Everything else under{" "}
        <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">/api/</code> is disallowed for crawlers: it writes, it costs money, or
        it is the internal cron.
      </>
    ),
    coverage: (cities: number, seaStart: string | null, gen: string | null) =>
      [
        `${cities} cities`,
        seaStart ? `seas since ${seaStart}` : null,
        gen ? `snapshot of ${gen}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
} as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="m3-card rise p-6 sm:p-7">
      <h2 className="text-xl font-extrabold tracking-tight mb-3">{title}</h2>
      <div className="text-sm text-on-surface-variant leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function ApiPageContent({ lang = "it" as Lang }: { lang?: Lang }) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  const pageUrl = `${SITE_URL}${base}/dati/api`;
  const meta = getHistoryMeta();
  const seaMeta = getSeaHistoryMeta();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebAPI",
        name: "Italia Rovente — Open Climate API",
        description:
          "Read-only, unauthenticated API with historical temperature aggregates for Italian cities (ERA5 since 1940) and a daily sea surface temperature archive.",
        url: pageUrl,
        documentation: pageUrl,
        termsOfService: `${SITE_URL}${base}/disclaimer`,
        provider: { "@type": "Organization", name: "Italia Rovente", url: SITE_URL },
        potentialAction: {
          "@type": "ConsumeAction",
          target: `${SITE_URL}/api/export/citta.json`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base ? `${SITE_URL}${base}` : SITE_URL },
          { "@type": "ListItem", position: 2, name: lang === "en" ? "Open data" : "Dati aperti", item: `${SITE_URL}${base}/dati` },
          { "@type": "ListItem", position: 3, name: lang === "en" ? "Public API" : "API pubblica", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href={t.backHref}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.backLink}
      </Link>
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-on-surface-variant mt-2 leading-relaxed">{t.subtitle}</p>
        <p className="text-xs text-on-surface-variant mt-2 tabular-nums">
          {t.coverage(CITIES.length, seaMeta?.seriesStart ?? null, meta?.generatedAt ?? null)}
        </p>
      </header>

      <div className="space-y-5">
        <Card title={t.endpointsTitle}>
          <ul className="space-y-3 list-none pl-0">
            {ENDPOINTS.map((e) => (
              <li key={e.path}>
                <a
                  href={e.path}
                  className="font-mono text-xs sm:text-sm font-bold text-secondary hover:underline break-all"
                >
                  <span className="text-on-surface-variant mr-2">{e.method}</span>
                  {e.path}
                </a>
                <div className="mt-1">{lang === "en" ? e.en : e.it}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t.tryTitle}>
          <p>{t.trySub}</p>
          <pre className="text-xs bg-surface-container-high rounded-xl p-3 overflow-x-auto">
            <code>{`curl ${SITE_URL}/api/export/citta.json
curl ${SITE_URL}/api/export/citta/roma
curl ${SITE_URL}/api/export/mese.json
curl ${SITE_URL}/api/export/mari.csv -o mari.csv`}</code>
          </pre>
        </Card>

        <Card title={t.verifyTitle}>
          <p>{t.verifyBody(meta?.sha256 ?? null)}</p>
        </Card>

        <Card title={t.methodTitle}>
          <ul className="list-disc pl-5 space-y-2">
            {t.methodItems.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Card>

        <Card title={t.limitsTitle}>
          <ul className="list-disc pl-5 space-y-1">
            {t.limits.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Card>

        <Card title={t.aiTitle}>
          <p>{t.aiBody}</p>
        </Card>

        <Card title={t.licenseTitle}>
          <p>{t.licenseBody}</p>
        </Card>
      </div>
    </div>
  );
}

export default function ApiPage() {
  return <ApiPageContent lang="it" />;
}
