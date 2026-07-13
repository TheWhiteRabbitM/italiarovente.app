import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Privacy policy",
  description:
    "Come Italia Rovente tratta i dati: nessun account, nessun dato personale venduto. Solo conteggi anonimi aggregati, analitiche senza cookie e notifiche push facoltative.",
  alternates: {
    canonical: "/privacy",
    languages: { en: "/en/privacy" },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/privacy`,
    title: "Privacy policy · Italia Rovente",
    description: "Nessun account, nessun dato personale venduto: solo conteggi anonimi aggregati.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

const CONTACT = "hello@italiarovente.app";
const UPDATED_IT = "Ultimo aggiornamento: 13 luglio 2026";
const UPDATED_EN = "Last updated: 13 July 2026";

type Lang = "it" | "en";

const STR = {
  it: {
    backLink: "← Home",
    backHref: "/",
    title: "Privacy policy",
    updated: UPDATED_IT,
    intro: (
      <>
        Italia Rovente (<Link href="/" className="text-secondary font-semibold hover:underline">italiarovente.app</Link>)
        mostra dati storici di temperatura delle città italiane. Il principio è semplice:{" "}
        <strong>non chiediamo, non serve e non vendiamo alcun dato personale.</strong> Non ci sono
        account, non serve registrarsi, e usiamo il sito e l&apos;app senza pubblicità e senza
        tracciatori commerciali. Questa pagina spiega, senza giri di parole, i pochi dati che il
        servizio tratta.
      </>
    ),
    sections: [
      {
        title: "Nessun account, nessun dato personale",
        body: (
          <>
            Per usare il sito o l&apos;app non devi creare un account né fornire nome, email o altri
            dati personali. Non raccogliamo profili, rubriche, posizione precisa o identità.
          </>
        ),
      },
      {
        title: "Conteggi anonimi e aggregati",
        body: (
          <>
            Contiamo visite e voti (i pulsanti &laquo;dì la tua&raquo;) solo in forma{" "}
            <strong>anonima e aggregata</strong>: numeri complessivi, non collegati a una persona.
            Non permettono di identificarti né di ricostruire cosa hai fatto.
          </>
        ),
      },
      {
        title: "Analitiche senza cookie",
        body: (
          <>
            Usiamo Vercel Web Analytics, un sistema di statistiche <strong>senza cookie</strong> e
            rispettoso della privacy: misura in forma aggregata pagine viste, provenienza e Paese,
            senza profilazione pubblicitaria e senza seguirti su altri siti.
          </>
        ),
      },
      {
        title: "Notifiche push (facoltative)",
        body: (
          <>
            Se — e solo se — attivi le notifiche sul clima, il tuo browser genera un
            &laquo;abbonamento push&raquo; anonimo (un indirizzo tecnico fornito dal browser).
            Lo conserviamo <strong>solo</strong> per inviarti quegli avvisi; non è collegato alla tua
            identità. Puoi disattivarle in qualsiasi momento dall&apos;app o dal browser: alla
            disiscrizione l&apos;abbonamento viene rimosso.
          </>
        ),
      },
      {
        title: "Preferenze salvate sul tuo dispositivo",
        body: (
          <>
            Tema chiaro/scuro, unità (°C/°F), la città che segui e un contrassegno per evitare il
            doppio voto sono salvati nella memoria locale del <strong>tuo</strong> browser
            (localStorage), sul tuo dispositivo. Restano lì: non ci vengono inviati (a parte il voto
            stesso, anonimo).
          </>
        ),
      },
      {
        title: "Fornitori tecnici",
        body: (
          <>
            Il sito è ospitato su Vercel, che per erogare le pagine e per sicurezza può trattare dati
            tecnici transitori (come l&apos;indirizzo IP della richiesta), secondo la propria
            informativa. Le notifiche push, se attive, viaggiano attraverso il servizio push del tuo
            browser (Google, Mozilla o Apple). Non condividiamo dati con inserzionisti né con
            data broker.
          </>
        ),
      },
      {
        title: "Dati mostrati",
        body: (
          <>
            Le temperature provengono dalla rianalisi ERA5 (ECMWF / Copernicus Climate Change
            Service): sono dati ambientali storici, non dati personali. Dettagli su fonte, metodo e
            licenza nella pagina{" "}
            <Link href="/dati" className="text-secondary font-semibold hover:underline">dati aperti</Link>
            {" "}e nel{" "}
            <Link href="/disclaimer" className="text-secondary font-semibold hover:underline">disclaimer</Link>.
          </>
        ),
      },
      {
        title: "Minori",
        body: (
          <>
            Il servizio non è rivolto ai bambini e non raccoglie consapevolmente dati di minori.
          </>
        ),
      },
      {
        title: "I tuoi diritti e i contatti",
        body: (
          <>
            Poiché non conserviamo dati personali collegati a te, non c&apos;è un profilo da
            consultare o cancellare; per le notifiche push basta disiscriversi per rimuovere il tuo
            abbonamento. Per qualsiasi domanda sulla privacy scrivi a{" "}
            <a href={`mailto:${CONTACT}`} className="text-secondary font-semibold hover:underline">{CONTACT}</a>.
          </>
        ),
      },
      {
        title: "Modifiche",
        body: (
          <>
            Se aggiorniamo questa informativa, cambieremo la data in cima. Le modifiche valgono dalla
            pubblicazione.
          </>
        ),
      },
    ],
  },
  en: {
    backLink: "← Home",
    backHref: "/en",
    title: "Privacy policy",
    updated: UPDATED_EN,
    intro: (
      <>
        Italia Rovente (<Link href="/en" className="text-secondary font-semibold hover:underline">italiarovente.app</Link>)
        shows historical temperature data for Italian cities. The principle is simple:{" "}
        <strong>we don&apos;t ask for, don&apos;t need and don&apos;t sell any personal data.</strong>{" "}
        There are no accounts, no sign-up, and we run the site and app with no ads and no commercial
        trackers. This page explains, plainly, the few pieces of data the service handles.
      </>
    ),
    sections: [
      {
        title: "No account, no personal data",
        body: (
          <>
            You don&apos;t need to create an account or provide a name, email or other personal data
            to use the site or the app. We don&apos;t collect profiles, contacts, precise location or
            identity.
          </>
        ),
      },
      {
        title: "Anonymous, aggregated counts",
        body: (
          <>
            We count visits and votes (the &laquo;have your say&raquo; buttons) only in{" "}
            <strong>anonymous, aggregated</strong> form: overall numbers, not tied to a person. They
            can&apos;t identify you or reconstruct what you did.
          </>
        ),
      },
      {
        title: "Cookieless analytics",
        body: (
          <>
            We use Vercel Web Analytics, a <strong>cookieless</strong>, privacy-friendly statistics
            system: it measures page views, referrers and country in aggregate, with no advertising
            profiling and without following you across other sites.
          </>
        ),
      },
      {
        title: "Push notifications (optional)",
        body: (
          <>
            If — and only if — you turn on climate notifications, your browser generates an anonymous
            &laquo;push subscription&raquo; (a technical address provided by the browser). We keep it{" "}
            <strong>only</strong> to send you those alerts; it isn&apos;t linked to your identity. You
            can turn them off at any time from the app or browser: unsubscribing removes the
            subscription.
          </>
        ),
      },
      {
        title: "Preferences stored on your device",
        body: (
          <>
            Light/dark theme, unit (°C/°F), the city you follow and a flag to prevent double-voting
            are stored in <strong>your</strong> browser&apos;s local storage, on your device. They
            stay there: they are not sent to us (apart from the anonymous vote itself).
          </>
        ),
      },
      {
        title: "Technical providers",
        body: (
          <>
            The site is hosted on Vercel, which — to serve pages and for security — may process
            transient technical data (such as the request&apos;s IP address) under its own policy.
            Push notifications, if enabled, travel through your browser&apos;s push service (Google,
            Mozilla or Apple). We don&apos;t share data with advertisers or data brokers.
          </>
        ),
      },
      {
        title: "Data shown",
        body: (
          <>
            Temperatures come from the ERA5 reanalysis (ECMWF / Copernicus Climate Change Service):
            they are historical environmental data, not personal data. Details on source, method and
            licence on the{" "}
            <Link href="/en/dati" className="text-secondary font-semibold hover:underline">open data</Link>
            {" "}page and in the{" "}
            <Link href="/en/disclaimer" className="text-secondary font-semibold hover:underline">disclaimer</Link>.
          </>
        ),
      },
      {
        title: "Children",
        body: <>The service is not directed at children and does not knowingly collect data from minors.</>,
      },
      {
        title: "Your rights and contact",
        body: (
          <>
            Since we hold no personal data linked to you, there&apos;s no profile to access or delete;
            for push notifications, simply unsubscribe to remove your subscription. For any privacy
            question, write to{" "}
            <a href={`mailto:${CONTACT}`} className="text-secondary font-semibold hover:underline">{CONTACT}</a>.
          </>
        ),
      },
      {
        title: "Changes",
        body: (
          <>
            If we update this policy, we&apos;ll change the date at the top. Changes take effect on
            publication.
          </>
        ),
      },
    ],
  },
} as const;

export function PrivacyPageContent({ lang = "it" as Lang }: { lang?: Lang }) {
  const t = STR[lang];
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <Link
        href={t.backHref}
        className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors mb-6"
      >
        {t.backLink}
      </Link>
      <header className="rise mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-sm text-on-surface-variant mt-2">{t.updated}</p>
        <p className="text-on-surface-variant mt-4 leading-relaxed">{t.intro}</p>
      </header>
      <div className="space-y-5">
        {t.sections.map((s, i) => (
          <section key={i} className="m3-card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight mb-2">{s.title}</h2>
            <p className="text-on-surface-variant leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return <PrivacyPageContent lang="it" />;
}
