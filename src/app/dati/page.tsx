import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { getHistoryMeta } from "@/lib/weather";
import { SITE_URL } from "@/lib/site";
import otsStamps from "@/data/ots-stamps.json";

export const metadata = {
  title: "Dati aperti",
  description:
    `Scarica gli aggregati storici (normali climatiche, riscaldamento, tendenza) delle ${CITIES.length} città italiane monitorate da Italia Rovente, in formato CSV. Dati ERA5/ECMWF, uso libero con attribuzione.`,
  alternates: {
    canonical: "/dati",
    languages: { en: "/en/dati" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/dati`,
    title: "Dati aperti · Italia Rovente",
    description: "Aggregati storici delle città italiane in CSV, uso libero con attribuzione.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

type Lang = "it" | "en";

const STR = {
  it: {
    backLink: "← Home",
    backHref: "/",
    title: "Dati aperti",
    subtitle:
      "Gli stessi aggregati mostrati sul sito, in un unico file scaricabile: nessuno scraping necessario.",
    downloadTitle: "📄 Città — aggregati storici (CSV)",
    downloadBody: (n: number) =>
      `Una riga per ciascuna delle ${n} città monitorate: normale climatica 1961–1990, normale 1991–2020, riscaldamento, tendenza per decennio (R²) e anno di inizio della serie.`,
    downloadCta: "⬇️ Scarica citta.csv",
    downloadJsonCta: "⬇️ Scarica citta.json",
    colsTitle: "Colonne",
    cols: [
      ["slug, citta, regione, lat, lon", "identificativi della città"],
      ["normale_1961_1990, normale_1991_2020", "medie climatiche trentennali, °C"],
      ["riscaldamento_c", "differenza tra le due normali, °C"],
      ["gradi_decennio", "pendenza della regressione lineare, °C/decennio"],
      ["gradi_decennio_ic95", "margine ± dell'intervallo di confidenza al 95% sulla pendenza"],
      ["r2", "bontà di adattamento della retta (0–1)"],
      ["anno_inizio_serie", "primo anno con dati completi"],
    ],
    licenseTitle: "📄 Licenza e attribuzione",
    licenseBody: (
      <>
        I dati sono derivati dal reanalysis <strong>ERA5 di ECMWF / Copernicus
        Climate Change Service</strong>, distribuito da Open-Meteo. Uso libero
        con attribuzione a <strong>Italia Rovente (italiarovente.app)</strong>{" "}
        e alla fonte originale. Dettagli completi nel{" "}
        <Link href="/disclaimer#licenza" className="text-secondary font-semibold hover:underline">
          disclaimer
        </Link>
        .
      </>
    ),
    methodTitle: "🧪 Metodo, in breve",
    methodBody:
      "Riscaldamento = normale 1991–2020 meno normale 1961–1990 (differenza tra due medie trentennali, non un anno recente contro il passato). Tendenza = regressione lineare (minimi quadrati) sulle medie annue dell'intera serie, con intervallo di confidenza al 95% sulla pendenza (errore standard × valore critico della t di Student).",
    provenanceTitle: "🔖 Provenienza di questo snapshot",
    provenanceBody: (
      generatedAt: string,
      source: string,
      build: string | null,
      sha256: string | null,
    ) => (
      <>
        Snapshot generato il <strong>{generatedAt}</strong>, fonte <strong>{source}</strong>
        {build ? (
          <>
            , build <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">{build}</code>
          </>
        ) : null}
        . Riprendendo lo stesso metodo su questo stesso snapshot (il file{" "}
        <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">history.json</code>{" "}
        nel repository) si ottengono esattamente gli stessi numeri.
        {sha256 ? (
          <>
            {" "}Fingerprint di integrità (SHA-256 degli aggregati per-città):{" "}
            <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded break-all">{sha256}</code>.
          </>
        ) : null}
      </>
    ),
    provenanceUnavailable:
      "Data di generazione non disponibile per questo ambiente (normale in sviluppo locale).",
    timestampTitle: "🔗 Marca temporale su Bitcoin (OpenTimestamps)",
    timestampBody: (
      <>
        Il fingerprint qui sopra è <strong>ancorato alla blockchain di Bitcoin</strong> tramite{" "}
        <a
          href="https://opentimestamps.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline"
        >
          OpenTimestamps
        </a>
        : una prova, verificabile da chiunque senza fidarsi di noi, che quell&apos;esatto dataset
        esisteva a una certa data e non è più stato cambiato. Non mettiamo i dati sulla blockchain,
        solo il loro hash. Gratis, senza monete.
      </>
    ),
    timestampLatest: "Ultima marca ancorata",
    timestampProofLabel: "prova .ots",
    timestampManifestLabel: "manifesto",
    timestampVerifyIntro: "Verificala da solo — scarica prova e manifesto, poi:",
    timestampNote: (
      <>
        Il manifesto contiene lo stesso SHA-256, quindi verificarlo prova che <em>tutti</em> i numeri
        esistevano già a quella data. La prova nasce attestata dai calendar server ed entra in un
        blocco Bitcoin entro qualche ora. Ancora lo <em>snapshot committato nel repository</em>
        {" "}(riproducibile da git a quel commit); i dati live si aggiornano di continuo, quindi il
        fingerprint corrente qui sopra può differire da uno già ancorato.
      </>
    ),
    otherTitle: "Altri modi di consultare i dati",
    otherLinks: [
      { href: "/dati/api", label: "API pubblica — endpoint JSON/CSV, senza chiave, con specifica OpenAPI" },
      { href: "/llms.txt", label: "llms.txt — indice per assistenti AI" },
      { href: "/feed.xml", label: "feed.xml — RSS di record, ondate di calore e recap mensile" },
      { href: "/citta", label: "Elenco città con pagina dedicata" },
      { href: "/classifiche", label: "Classifiche e graduatorie" },
      { href: "/mese", label: "Bollettino del mese appena concluso" },
    ],
  },
  en: {
    backLink: "← Home",
    backHref: "/en",
    title: "Open data",
    subtitle:
      "The same aggregates shown on the site, in a single downloadable file: no scraping needed.",
    downloadTitle: "📄 Cities — historical aggregates (CSV)",
    downloadBody: (n: number) =>
      `One row per each of the ${n} monitored cities: 1961–1990 climate normal, 1991–2020 normal, warming, per-decade trend (R²), and the series' start year.`,
    downloadCta: "⬇️ Download citta.csv",
    downloadJsonCta: "⬇️ Download citta.json",
    colsTitle: "Columns",
    cols: [
      ["slug, citta, regione, lat, lon", "city identifiers (Italian names)"],
      ["normale_1961_1990, normale_1991_2020", "30-year climate averages, °C"],
      ["riscaldamento_c", "difference between the two normals, °C"],
      ["gradi_decennio", "linear-regression slope, °C/decade"],
      ["gradi_decennio_ic95", "± margin of the 95% confidence interval on the slope"],
      ["r2", "goodness of fit of the line (0–1)"],
      ["anno_inizio_serie", "first year with complete data"],
    ],
    licenseTitle: "📄 License and attribution",
    licenseBody: (
      <>
        The data is derived from the <strong>ERA5 reanalysis by ECMWF /
        Copernicus Climate Change Service</strong>, distributed by Open-Meteo.
        Free to use with attribution to{" "}
        <strong>Italia Rovente (italiarovente.app)</strong> and the original
        source. Full details in the{" "}
        <Link href="/en/disclaimer#licenza" className="text-secondary font-semibold hover:underline">
          disclaimer
        </Link>
        .
      </>
    ),
    methodTitle: "🧪 Method, briefly",
    methodBody:
      "Warming = 1991–2020 normal minus 1961–1990 normal (the difference between two 30-year averages, not a recent year against the past). Trend = ordinary least squares regression on the annual means of the whole series, with a 95% confidence interval on the slope (standard error × Student's t critical value).",
    provenanceTitle: "🔖 Provenance of this snapshot",
    provenanceBody: (
      generatedAt: string,
      source: string,
      build: string | null,
      sha256: string | null,
    ) => (
      <>
        Snapshot generated on <strong>{generatedAt}</strong>, source <strong>{source}</strong>
        {build ? (
          <>
            , build <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">{build}</code>
          </>
        ) : null}
        . Re-running the same method on this exact snapshot (the{" "}
        <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">history.json</code>{" "}
        file in the repository) reproduces exactly the same numbers.
        {sha256 ? (
          <>
            {" "}Integrity fingerprint (SHA-256 of the per-city aggregates):{" "}
            <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded break-all">{sha256}</code>.
          </>
        ) : null}
      </>
    ),
    provenanceUnavailable: "Generation date not available in this environment (normal in local dev).",
    timestampTitle: "🔗 Timestamped on Bitcoin (OpenTimestamps)",
    timestampBody: (
      <>
        The fingerprint above is <strong>anchored to the Bitcoin blockchain</strong> via{" "}
        <a
          href="https://opentimestamps.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline"
        >
          OpenTimestamps
        </a>
        : a proof — verifiable by anyone, without trusting us — that this exact dataset existed at a
        given date and hasn&apos;t changed since. We don&apos;t put the data on-chain, only its hash.
        Free, no coins.
      </>
    ),
    timestampLatest: "Latest anchored stamp",
    timestampProofLabel: ".ots proof",
    timestampManifestLabel: "manifest",
    timestampVerifyIntro: "Verify it yourself — download the proof and manifest, then:",
    timestampNote: (
      <>
        The manifest contains the same SHA-256, so verifying it proves that <em>all</em> the numbers
        already existed at that date. The proof starts calendar-attested and enters a Bitcoin block
        within hours. It anchors the <em>snapshot committed to the repository</em> (reproducible from
        git at that commit); the live data refreshes continuously, so the current fingerprint above
        may differ from an already-anchored one.
      </>
    ),
    otherTitle: "Other ways to consult the data",
    otherLinks: [
      { href: "/en/dati/api", label: "Public API — JSON/CSV endpoints, no key, with an OpenAPI spec" },
      { href: "/llms.txt", label: "llms.txt — index for AI assistants" },
      { href: "/en/feed.xml", label: "feed.xml — RSS of records, heatwaves and the monthly recap" },
      { href: "/en/citta", label: "City list with dedicated pages" },
      { href: "/en/classifiche", label: "Rankings" },
    ],
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

export function DatiPageContent({ lang = "it" as Lang }: { lang?: Lang }) {
  const t = STR[lang];
  const base = lang === "en" ? "/en" : "";
  const pageUrl = `${SITE_URL}${base}/dati`;
  const meta = getHistoryMeta();

  // Dataset JSON-LD: descrive il CSV scaricabile in un formato che motori di
  // ricerca e assistenti AI sanno indicizzare come fonte dati primaria
  // (Google Dataset Search, citazioni dirette da parte di LLM).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        name: "Italia Rovente — aggregati storici delle città italiane",
        description:
          "Normali climatiche 1961-1990 e 1991-2020, riscaldamento e tendenza per decennio per le città italiane monitorate, derivati dal reanalysis ERA5 (ECMWF/Copernicus) via Open-Meteo.",
        url: pageUrl,
        license: "https://opensource.org/licenses/MIT",
        creator: { "@type": "Organization", name: "Italia Rovente", url: SITE_URL },
        temporalCoverage: "1940/..",
        spatialCoverage: { "@type": "Place", name: "Italia" },
        ...(meta?.generatedAt ? { dateModified: meta.generatedAt } : {}),
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: `${SITE_URL}/api/export/citta.csv`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: base ? `${SITE_URL}${base}` : SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: lang === "en" ? "Open data" : "Dati aperti",
            item: pageUrl,
          },
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
        <p className="text-on-surface-variant mt-2">{t.subtitle}</p>
      </header>

      <div className="space-y-5">
        <Card title={t.downloadTitle}>
          <p>{t.downloadBody(CITIES.length)}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/export/citta.csv"
              className="m3-chip bg-primary text-on-primary px-5 py-2.5 inline-flex hover:scale-105 transition-transform"
            >
              {t.downloadCta}
            </a>
            <a
              href="/api/export/citta.json"
              className="m3-chip bg-surface-container-high text-on-surface px-5 py-2.5 inline-flex hover:scale-105 transition-transform"
            >
              {t.downloadJsonCta}
            </a>
          </div>
          <div>
            <div className="font-bold text-on-surface mt-4 mb-2">{t.colsTitle}</div>
            <ul className="list-disc pl-5 space-y-1">
              {t.cols.map(([col, desc]) => (
                <li key={col}>
                  <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">{col}</code>{" "}
                  — {desc}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title={t.methodTitle}>
          <p>{t.methodBody}</p>
        </Card>

        <Card title={t.provenanceTitle}>
          <p>
            {meta?.generatedAt
              ? t.provenanceBody(meta.generatedAt, meta.source, meta.commit, meta.sha256 ?? null)
              : t.provenanceUnavailable}
          </p>
        </Card>

        {otsStamps.length > 0 && (
          <Card title={t.timestampTitle}>
            <p>{t.timestampBody}</p>
            <p className="mt-3">
              <strong>{t.timestampLatest}:</strong> {otsStamps[0].date} ·{" "}
              <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded break-all">
                {otsStamps[0].sha256.slice(0, 16)}…
              </code>{" "}
              <a href={otsStamps[0].ots} download className="text-secondary font-semibold hover:underline">
                {t.timestampProofLabel}
              </a>
              {" · "}
              <a href={otsStamps[0].manifest} download className="text-secondary font-semibold hover:underline">
                {t.timestampManifestLabel}
              </a>
            </p>
            <p className="mt-3">{t.timestampVerifyIntro}</p>
            <pre className="mt-1 text-xs bg-surface-container-high rounded-lg p-3 overflow-x-auto">
              <code>
                pip install opentimestamps-client{"\n"}
                ots verify -f {otsStamps[0].manifest.split("/").pop()} {otsStamps[0].ots.split("/").pop()}
              </code>
            </pre>
            <p className="mt-3 text-sm text-on-surface-variant">{t.timestampNote}</p>
          </Card>
        )}

        <Card title={t.licenseTitle}>
          <p>{t.licenseBody}</p>
        </Card>

        <Card title={t.otherTitle}>
          <ul className="list-disc pl-5 space-y-1">
            {t.otherLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-secondary font-semibold hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function DatiPage() {
  return <DatiPageContent lang="it" />;
}
