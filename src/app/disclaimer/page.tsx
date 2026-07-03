import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { getLifetimeData } from "@/lib/lifetime";
import { getBotStats } from "@/lib/botstats";
import { getStatsHistory } from "@/lib/statshistory";
import { fmtAnomaly } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Disclaimer, metodo e licenza",
  description:
    "Avvertenze sull'uso dei dati di Italia Rovente, metodologia (ERA5/ECMWF, anomalie, normali climatiche) e licenza open source MIT.",
  alternates: {
    canonical: "/disclaimer",
    languages: { en: "/en/disclaimer" },
  },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/disclaimer`,
    title: "Disclaimer, metodo e licenza · Italia Rovente",
    description:
      "Avvertenze, metodologia e licenza open source MIT del progetto Italia Rovente.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

type Lang = "it" | "en";

const STR = {
  it: {
    home: "← Home",
    title: "Disclaimer, metodo e licenza",
    subtitle: "Trasparenza su cosa mostra Italia Rovente, come, e con quali limiti.",
    warningsTitle: "⚠️ Avvertenze sull'uso",
    warnings: [
      <>
        Italia Rovente ha scopo <strong>informativo e divulgativo</strong>.
        Non è un servizio meteorologico ufficiale e i dati{" "}
        <strong>non vanno usati per decisioni critiche</strong> (sicurezza,
        agricoltura, navigazione, emergenze, ecc.).
      </>,
      <>
        Le previsioni e i valori attuali sono stime di modelli meteorologici e
        possono differire dalle misurazioni reali.
      </>,
      <>
        Ogni città è rappresentata da un{" "}
        <strong>singolo punto della griglia</strong> del modello (circa
        25–31 km di lato): i valori sono indicativi dell'area, non di una
        stazione specifica. Le <strong>isole di calore urbane</strong> (una
        città può essere anche 2–5°C più calda della campagna circostante,
        soprattutto di notte) non sono catturate a questo livello di
        dettaglio: ERA5 smussa i microclimi di quartiere.
      </>,
      <>
        Il software è fornito «così com'è», senza alcuna garanzia (vedi
        licenza).
      </>,
    ],
    methodTitle: "🧪 Metodo",
    method: [
      <>
        <strong>Storico</strong>: reanalysis{" "}
        <strong>ERA5 di ECMWF / Copernicus (C3S)</strong>, temperatura
        dell'aria a 2 m dal 1940, via Open-Meteo.
      </>,
      <>
        <strong>Anomalie</strong> calcolate rispetto alla{" "}
        <strong>normale climatica 1961–1990</strong> (riferimento WMO); il
        confronto fra le due normali trentennali (1961–1990 vs 1991–2020) è
        la misura più robusta del riscaldamento, usata ovunque sul sito (mai
        una media degli ultimi anni, più rumorosa e meno confrontabile).
      </>,
      <>
        <strong>Tendenza</strong> stimata per regressione lineare sulle medie
        annue (R² indica quanto la retta spiega i dati).
      </>,
      <>
        <strong>Massime e minime</strong> sono trattate separatamente dalla
        media (stesso confronto a due trentenni): giorni e notti non si
        scaldano sempre allo stesso ritmo, e mostrarle insieme darebbe meno
        contesto.
      </>,
      <>
        <strong>Record giornalieri</strong> (🔥/❄️) escludono gli ultimi ~4
        mesi: ERA5 pubblica una versione preliminare dopo pochi giorni, ma
        quella definitiva ("ri-analizzata") arriva dopo diverso tempo e può
        differire leggermente. Un record assoluto non viene mai dichiarato su
        un dato ancora provvisorio.
      </>,
      <>
        <strong>Confronto climatico</strong> ("la temperatura di X oggi è
        quella che aveva Y negli anni Z"): confronta la{" "}
        <strong>temperatura media annua</strong> di una città con quella
        delle altre città monitorate nei decenni fino al 2000, e mostra solo
        la coppia più vicina (entro 0,3°C). Non è un confronto dell'intero
        profilo stagionale (mese per mese), che richiederebbe dati non
        ancora disponibili a questo livello di dettaglio.
      </>,
      <>
        <strong>Media nazionale ("Italia")</strong> e{" "}
        <strong>medie regionali</strong>: sono la media delle città monitorate
        da questo sito nella rispettiva area, non un indice ufficiale. Il
        rapporto ISPRA "Clima in Italia" usa una propria rete di stazioni con
        metodologia diversa: l'ordine di grandezza è coerente (entrambi
        indicano un riscaldamento di circa 1°C dalla normale 1961–1990), ma i
        valori esatti non coincidono.
      </>,
      <>
        <strong>«Chiedi al clima» (assistente AI)</strong> risponde solo con i
        numeri restituiti dai dati di questo sito, mai a memoria: se non ha
        il dato richiesto, lo dichiara invece di indovinare.
      </>,
      <>
        Questi dati riguardano <strong>queste città italiane</strong> (scala
        regionale): sono coerenti con il riscaldamento globale misurato da
        NASA, NOAA e Copernicus, ma non lo sostituiscono.
      </>,
      <>Viene mostrata sempre l'intera serie disponibile, senza cherry-picking.</>,
      <>
        <strong>Dati mancanti</strong>: i giorni senza un valore valido sono
        esclusi dalle medie (mai trattati come zero). Un anno entra nel
        calcolo di tendenza, decenni e record solo se ha almeno 360 giorni
        validi su circa 365; altrimenti resta visibile nei grafici ma escluso
        dalle statistiche aggregate.
      </>,
      <>
        <strong>Gradi giorno</strong>: è una <strong>stima</strong>, non il
        calcolo ufficiale del DPR 412/93 (che somma giorno per giorno gli
        scarti dai 20°C). Qui si usa la climatologia mensile già disponibile:
        giorni del mese × scarto dalla media mensile. Questo può{" "}
        <strong>sottostimare</strong> il valore reale nei mesi di transizione
        (marzo-aprile, ottobre-novembre), dove alcuni giorni superano i 20°C e
        altri no, mentre la media mensile li appiattisce. Il valore ufficiale
        di un comune (fisso, da tabella normativa) può quindi differire da
        quello mostrato qui.
      </>,
    ],
    licenseTitle: "📄 Licenza open source",
    licenseCode: (
      <>
        Il <strong>codice</strong> di Italia Rovente è{" "}
        <a
          href="https://github.com/TheWhiteRabbitM/italiarovente.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline"
        >
          pubblico su GitHub
        </a>{" "}
        con licenza <strong>MIT</strong>: puoi consultarlo, usarlo,
        modificarlo e ridistribuirlo liberamente, mantenendo l'avviso di
        copyright. Il software è fornito senza garanzie.
      </>
    ),
    licenseDataPrefix: (
      <>
        I <strong>dati meteo</strong> non sono coperti dalla licenza MIT:
        appartengono a{" "}
      </>
    ),
    licenseDataSuffix: (
      <>
        , basati sul reanalysis ERA5 di{" "}
        <strong>ECMWF / Copernicus Climate Change Service</strong>, e sono
        soggetti ai rispettivi termini di licenza e attribuzione.
      </>
    ),
    privacyTitle: "🔒 Privacy",
    privacy: (
      <>
        Il sito raccoglie solo conteggi anonimi e aggregati (visite e voti),
        senza dati personali, account o tracciamento pubblicitario.
      </>
    ),
    botTitle: "🤖 Anche i robot ci leggono",
    botIntro:
      "Oltre alle persone, il sito riceve richieste da crawler e assistenti AI (li abbiamo esplicitamente autorizzati, vedi /llms.txt). Anche questo è un conteggio anonimo per categoria — solo lo User-Agent della richiesta, nessun dato personale:",
    botLabels: {
      gptbot: "ChatGPT / GPTBot",
      claudebot: "Claude",
      perplexity: "Perplexity",
      googlebot: "Google",
      bingbot: "Bing / Copilot",
      meta: "Meta",
      other: "Altri crawler",
    },
    botRequests: (n: number) => `${n.toLocaleString("it-IT")} richieste`,
    botUnavailable: "Dato non ancora disponibile.",
    trendTitle: "Andamento",
    trendIntro: "Uno scatto al giorno: visite umane contro richieste bot totali.",
    trendUnavailable: "Ancora troppo poche rilevazioni per mostrare un andamento — torna tra qualche giorno.",
    trendDate: "Data",
    trendVisits: "Visite umane",
    trendBots: "Richieste bot",
    faqTitle: "❓ Domande frequenti",
    faq: (warming: string) => [
      {
        q: "Quanto si è scaldata l'Italia dal 1940 a oggi?",
        a: `Confrontando la normale climatica 1991–2020 con quella 1961–1990, le città monitorate da questo sito mostrano un riscaldamento medio di ${warming}. È lo stesso metodo — differenza tra due medie trentennali — usato in modo identico su ogni pagina del sito.`,
      },
      {
        q: "Che dati usa Italia Rovente?",
        a: "La rianalisi ERA5 di ECMWF/Copernicus (C3S), distribuita da Open-Meteo: temperatura dell'aria a 2 metri dal 1940 a oggi, aggiornata automaticamente ogni giorno.",
      },
      {
        q: "Quante città copre il sito?",
        a: `${CITIES.length} città italiane, dalle principali (con dati precisi su massime e minime) alle capitali di provincia. Elenco completo su italiarovente.app/citta.`,
      },
      {
        q: "Perché sulle 12 città principali ci sono due numeri di riscaldamento leggermente diversi?",
        a: "Sulle 12 città principali mostriamo un secondo confronto, calcolato con lo stesso metodo (normale 1991–2020 meno normale 1961–1990) ma su una fonte indipendente: E-OBS, costruito dal progetto ECA&D/Copernicus solo da osservazioni dirette di stazioni meteo europee, non da un modello come ERA5. Le due fonti usano metodi, risoluzioni e reti di stazioni diverse, quindi una differenza di qualche decimo di grado tra i due numeri è normale, non un errore — quello che conta è che nessuna delle due contraddice l'altra sulla direzione del riscaldamento. Dati E-OBS: progetto UERRA (EU-FP6) e Copernicus Climate Change Service, forniti dalla rete ECA&D (ecad.eu); fonte: Cornes et al. 2018, An Ensemble Version of the E-OBS Temperature and Precipitation Datasets. Uso non commerciale, come da licenza E-OBS.",
      },
      {
        q: "È un sito meteorologico ufficiale?",
        a: "No. Ha scopo informativo e divulgativo: non sostituisce i servizi meteo ufficiali né i dati ISPRA, e non va usato per decisioni critiche (sicurezza, agricoltura, navigazione).",
      },
      {
        q: "Come viene calcolato il riscaldamento di una città?",
        a: "Come differenza tra la normale climatica 1991–2020 e quella 1961–1990 (il periodo di riferimento WMO): il confronto tra due medie trentennali, non tra un anno recente e il passato, perché è la misura più robusta e meno rumorosa.",
      },
      {
        q: "Posso citare i dati di questo sito?",
        a: "Sì, con attribuzione a Italia Rovente e alla fonte dei dati (Open-Meteo / ERA5 / ECMWF-Copernicus). Il codice del sito è open source con licenza MIT.",
      },
      {
        q: "Perché non si parla di ere glaciali o clima molto più antico?",
        a: "Perché usiamo dati strumentali diretti (la rianalisi ERA5), affidabili solo dal 1940 in poi. Per periodi più antichi serve la paleoclimatologia, che ricostruisce il clima attraverso proxy indiretti — carote di ghiaccio, anelli degli alberi, sedimenti — con margini d'incertezza che crescono quanto più si va indietro nel tempo. Metodo diverso, stesso principio: la scienza si basa su fatti e dati verificabili. Il resto — allarmismo o minimizzazione — è narrativa, e qui non ne mostriamo.",
      },
      {
        q: "Quali città italiane hanno più giorni di caldo estivo estremo (\"caldo africano\")?",
        a: "La classifica aggiornata è su italiarovente.app/classifiche, sezione \"I giorni più roventi\": giorni con massima ≥30°, media degli ultimi 5 anni completi per ciascuna città monitorata, aggiornata automaticamente — qui non riportiamo un numero fisso perché cambierebbe e diventerebbe presto obsoleto.",
      },
    ],
    footer: "Dati © Open-Meteo · ERA5 © ECMWF / Copernicus · Codice © 2026 Italia Rovente (MIT)",
  },
  en: {
    home: "← Home",
    title: "Disclaimer, methodology and license",
    subtitle: "Transparency about what Italia Rovente shows, how, and with what limits.",
    warningsTitle: "⚠️ Usage warnings",
    warnings: [
      <>
        Italia Rovente is <strong>informational and educational</strong> in
        purpose. It is not an official weather service, and the data{" "}
        <strong>must not be used for critical decisions</strong> (safety,
        agriculture, navigation, emergencies, etc.).
      </>,
      <>
        Forecasts and current values are estimates from weather models and
        may differ from real-world measurements.
      </>,
      <>
        Each city is represented by a{" "}
        <strong>single grid point</strong> of the model (roughly 25–31 km
        across): values are indicative of the area, not of a specific
        station. <strong>Urban heat islands</strong> (a city can run 2–5°C
        warmer than the surrounding countryside, especially at night) are
        not captured at this level of detail: ERA5 smooths out
        neighborhood-scale microclimates.
      </>,
      <>
        The software is provided &laquo;as is&raquo;, without any warranty
        (see license).
      </>,
    ],
    methodTitle: "🧪 Methodology",
    method: [
      <>
        <strong>Historical data</strong>: <strong>ERA5 reanalysis by
        ECMWF / Copernicus (C3S)</strong>, air temperature at 2 m above
        ground since 1940, via Open-Meteo.
      </>,
      <>
        <strong>Anomalies</strong> are calculated against the{" "}
        <strong>1961–1990 climate normal</strong> (WMO reference period); the
        comparison between the two 30-year normals (1961–1990 vs
        1991–2020) is the most robust measure of warming, used throughout
        the site (never an average of the last few years, which is noisier
        and less comparable).
      </>,
      <>
        <strong>Trend</strong> estimated by linear regression on annual
        averages (R² indicates how well the line explains the data).
      </>,
      <>
        <strong>Maximums and minimums</strong> are treated separately from
        the mean (same two-normals comparison): days and nights don't
        always warm at the same rate, and showing them combined would give
        less context.
      </>,
      <>
        <strong>Daily records</strong> (🔥/❄️) exclude the last ~4 months:
        ERA5 publishes a preliminary version after a few days, but the
        definitive ("re-analyzed") version arrives after a longer time and
        may differ slightly. An absolute record is never declared on data
        that is still provisional.
      </>,
      <>
        <strong>Climate-analog comparison</strong> ("X's temperature today
        is what Y had in the Z years"): it compares a city's{" "}
        <strong>annual average temperature</strong> with that of the other
        monitored cities across the decades up to 2000, and shows only the
        closest match (within 0.3°C). It is not a comparison of the entire
        seasonal profile (month by month), which would require data not yet
        available at this level of detail.
      </>,
      <>
        <strong>National ("Italy") and regional averages</strong>: these are
        the average of the cities monitored by this site in the respective
        area, not an official index. The ISPRA "Clima in Italia" report uses
        its own station network with a different methodology: the order of
        magnitude is consistent (both indicate warming of about 1°C from the
        1961–1990 normal), but the exact values do not coincide.
      </>,
      <>
        <strong>"Ask the climate" (AI assistant)</strong> answers only with
        figures returned by this site's data, never from memory: if it
        doesn't have the requested data point, it says so instead of
        guessing.
      </>,
      <>
        This data covers <strong>these Italian cities</strong> (regional
        scale): it is consistent with the global warming measured by NASA,
        NOAA and Copernicus, but does not replace it.
      </>,
      <>The full available series is always shown, with no cherry-picking.</>,
      <>
        <strong>Missing data</strong>: days without a valid value are
        excluded from averages (never treated as zero). A year enters the
        trend, decade and record calculations only if it has at least 360
        valid days out of roughly 365; otherwise it still appears in the
        charts but is excluded from the aggregate statistics.
      </>,
      <>
        <strong>Heating degree days</strong>: this is an{" "}
        <strong>estimate</strong>, not the official DPR 412/93 calculation
        (which sums the daily gap from 20°C, day by day). We use the monthly
        climatology already available instead: days in the month × gap from
        the monthly mean. This can <strong>underestimate</strong> the real
        value in shoulder-season months (March-April, October-November),
        where some days exceed 20°C and others don't, while the monthly
        average flattens them out. A municipality's official value (fixed,
        from a regulatory table) can therefore differ from the one shown
        here.
      </>,
    ],
    licenseTitle: "📄 Open source license",
    licenseCode: (
      <>
        Italia Rovente's <strong>code</strong> is{" "}
        <a
          href="https://github.com/TheWhiteRabbitM/italiarovente.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline"
        >
          public on GitHub
        </a>{" "}
        under the <strong>MIT</strong> license: you may inspect, use, modify
        and redistribute it freely, provided the copyright notice is
        retained. The software is provided without warranties.
      </>
    ),
    licenseDataPrefix: (
      <>
        The <strong>weather data</strong> is not covered by the MIT license:
        it belongs to{" "}
      </>
    ),
    licenseDataSuffix: (
      <>
        , based on the ERA5 reanalysis by{" "}
        <strong>ECMWF / Copernicus Climate Change Service</strong>, and is
        subject to their respective license and attribution terms.
      </>
    ),
    privacyTitle: "🔒 Privacy",
    privacy: (
      <>
        The site only collects anonymous, aggregated counts (visits and
        votes), with no personal data, accounts or advertising tracking.
      </>
    ),
    botTitle: "🤖 Robots read this site too",
    botIntro:
      "Besides people, the site receives requests from crawlers and AI assistants (explicitly allowed, see /llms.txt). This is also an anonymous per-category count — only the request's User-Agent, no personal data:",
    botLabels: {
      gptbot: "ChatGPT / GPTBot",
      claudebot: "Claude",
      perplexity: "Perplexity",
      googlebot: "Google",
      bingbot: "Bing / Copilot",
      meta: "Meta",
      other: "Other crawlers",
    },
    botRequests: (n: number) => `${n.toLocaleString("en-US")} requests`,
    botUnavailable: "Data not available yet.",
    trendTitle: "Trend",
    trendIntro: "One snapshot a day: human visits vs. total bot requests.",
    trendUnavailable: "Not enough snapshots yet to show a trend — check back in a few days.",
    trendDate: "Date",
    trendVisits: "Human visits",
    trendBots: "Bot requests",
    faqTitle: "❓ Frequently asked questions",
    faq: (warming: string) => [
      {
        q: "How much has Italy warmed since 1940?",
        a: `Comparing the 1991–2020 climate normal with the 1961–1990 one, the cities monitored by this site show an average warming of ${warming}. That's the same method — the difference between two 30-year averages — used identically across every page of the site.`,
      },
      {
        q: "What data does Italia Rovente use?",
        a: "The ERA5 reanalysis by ECMWF/Copernicus (C3S), distributed by Open-Meteo: air temperature at 2 meters above ground since 1940, updated automatically every day.",
      },
      {
        q: "How many cities does the site cover?",
        a: `${CITIES.length} Italian cities, from the main ones (with precise max/min data) to provincial capitals. Full list at italiarovente.app/en/citta.`,
      },
      {
        q: "Why do the 12 main cities show two slightly different warming numbers?",
        a: "On the 12 main cities we show a second comparison, computed with the same method (1991–2020 normal minus 1961–1990 normal) but on an independent source: E-OBS, built by the ECA&D/Copernicus project solely from direct European weather-station observations, not from a model like ERA5. The two sources use different methods, resolutions, and station networks, so a difference of a few tenths of a degree between the two numbers is normal, not an error — what matters is that neither contradicts the other on the direction of warming. E-OBS data: EU-FP6 project UERRA and the Copernicus Climate Change Service, provided by the ECA&D network (ecad.eu); source: Cornes et al. 2018, An Ensemble Version of the E-OBS Temperature and Precipitation Datasets. Non-commercial use, per the E-OBS license.",
      },
      {
        q: "Is this an official weather service?",
        a: "No. It is informational and educational: it does not replace official weather services or ISPRA data, and should not be used for critical decisions (safety, agriculture, navigation).",
      },
      {
        q: "How is a city's warming calculated?",
        a: "As the difference between the 1991–2020 climate normal and the 1961–1990 one (the WMO reference period): a comparison between two 30-year averages, not between a recent year and the past, because it's the most robust and least noisy measure.",
      },
      {
        q: "Can I cite the data from this site?",
        a: "Yes, with attribution to Italia Rovente and the data source (Open-Meteo / ERA5 / ECMWF-Copernicus). The site's code is open source under the MIT license.",
      },
      {
        q: "Why doesn't the site cover ice ages or much older climate?",
        a: "Because we use direct instrumental data (the ERA5 reanalysis), reliable only from 1940 onward. Older periods require paleoclimatology, which reconstructs climate through indirect proxies — ice cores, tree rings, sediments — with uncertainty that grows the further back in time you go. A different method, same principle: science is built on verifiable facts and data. Everything else — alarmism or minimization — is narrative, and we don't show any of it here.",
      },
      {
        q: "Which Italian cities have the most extreme summer heat days (\"African heat\")?",
        a: "The up-to-date ranking is at italiarovente.app/en/classifiche, \"The most scorching days\" section: days with a high ≥30°, averaged over the last 5 full years for each monitored city, refreshed automatically — we don't quote a fixed number here because it would change and quickly go stale.",
      },
    ],
    footer: "Data © Open-Meteo · ERA5 © ECMWF / Copernicus · Code © 2026 Italia Rovente (MIT)",
  },
} as const;

function Card({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="m3-card rise p-6 sm:p-7 scroll-mt-24">
      <h2 className="text-xl font-extrabold tracking-tight mb-3">{title}</h2>
      <div className="text-sm text-on-surface-variant leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

const BOT_CATEGORY_ORDER = [
  "gptbot",
  "claudebot",
  "perplexity",
  "googlebot",
  "bingbot",
  "meta",
  "other",
] as const;

export async function DisclaimerContent({ lang, homeHref }: { lang: Lang; homeHref: string }) {
  const t = STR[lang];

  // Stesso metodo "a due trentenni" usato ovunque sul sito (Verdetto,
  // confronto, poster, hero): calcolato qui una volta per rispondere alla
  // FAQ "quanto si è scaldata l'Italia" con un numero sempre allineato.
  const lifetimeData = getLifetimeData();
  const italia = lifetimeData.cities.find((c) => c.slug === "italia");
  const nationalWarming = italia ? italia.recentNormal - italia.baseline : null;
  const warmingStr =
    nationalWarming != null
      ? fmtAnomaly(nationalWarming, 1, "c", { locale: lang === "it" ? "it" : "en" })
      : (lang === "it" ? "dato in caricamento" : "data loading");
  const faqItems = t.faq(warmingStr);

  const botStats = await getBotStats();
  const botRows = botStats
    ? BOT_CATEGORY_ORDER.map((key) => ({ key, n: botStats[key] ?? 0 })).filter((r) => r.n > 0)
    : [];
  const statsHistory = await getStatsHistory();

  // FAQPage JSON-LD: le stesse domande/risposte mostrate in pagina, nel
  // formato che motori di ricerca e assistenti AI sanno estrarre e citare
  // direttamente (Google rich results, ChatGPT/Perplexity/Claude browsing).
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Link
        href={homeHref}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.home}
      </Link>
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-on-surface-variant mt-2">{t.subtitle}</p>
      </header>

      <div className="space-y-5">
        <Card title={t.warningsTitle}>
          <ul className="list-disc pl-5 space-y-2">
            {t.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>

        <Card title={t.methodTitle}>
          <ul className="list-disc pl-5 space-y-2">
            {t.method.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Card>

        <Card id="licenza" title={t.licenseTitle}>
          <p>{t.licenseCode}</p>
          <p>
            {t.licenseDataPrefix}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary font-semibold hover:underline"
            >
              Open-Meteo
            </a>
            {t.licenseDataSuffix}
          </p>
        </Card>

        <Card title={t.privacyTitle}>
          <p>{t.privacy}</p>
        </Card>

        <Card title={t.botTitle}>
          <p>{t.botIntro}</p>
          {botRows.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {botRows.map((r) => (
                <li key={r.key}>
                  <strong>{t.botLabels[r.key]}</strong>:{" "}
                  {t.botRequests(r.n)}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.botUnavailable}</p>
          )}

          <p className="font-bold text-on-surface mt-4">{t.trendTitle}</p>
          <p className="text-xs mb-2">{t.trendIntro}</p>
          {statsHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-on-surface-variant">
                    <th className="pr-3 py-1 font-semibold">{t.trendDate}</th>
                    <th className="pr-3 py-1 font-semibold">{t.trendVisits}</th>
                    <th className="py-1 font-semibold">{t.trendBots}</th>
                  </tr>
                </thead>
                <tbody>
                  {statsHistory.map((s) => (
                    <tr key={s.date} className="border-t border-[var(--outline-variant)]">
                      <td className="pr-3 py-1 tabular-nums">{s.date}</td>
                      <td className="pr-3 py-1 tabular-nums">{s.visits.toLocaleString(lang === "it" ? "it-IT" : "en-US")}</td>
                      <td className="py-1 tabular-nums">{s.botsTotal.toLocaleString(lang === "it" ? "it-IT" : "en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{t.trendUnavailable}</p>
          )}
        </Card>

        <Card title={t.faqTitle}>
          <dl className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={i}>
                <dt className="font-bold text-on-surface">{item.q}</dt>
                <dd className="mt-1">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <p className="text-xs text-on-surface-variant text-center mt-8">{t.footer}</p>
    </div>
  );
}

export default function DisclaimerPage() {
  return <DisclaimerContent lang="it" homeHref="/" />;
}
