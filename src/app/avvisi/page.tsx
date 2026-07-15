import Link from "next/link";
import { getEvents, type SiteEvent } from "@/lib/eventlog";
import { NotifyButton } from "@/components/NotifyButton";
import { SITE_URL } from "@/lib/site";

// Legge il registro eventi da Redis a ogni richiesta: la pagina mostra
// esattamente ciò che il push ha inviato, senza cache che invecchia.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avvisi",
  description:
    "Gli avvisi inviati da Italia Rovente: record di caldo e di freddo battuti, ondate di calore in arrivo, il recap del mese. Solo eventi reali rilevati dai dati, mai marketing.",
  alternates: { canonical: "/avvisi", languages: { en: "/en/avvisi" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/avvisi`,
    title: "Avvisi · Italia Rovente",
    description: "Record, ondate di calore e recap mensile: solo eventi reali, dai dati.",
    siteName: "Italia Rovente",
    locale: "it_IT",
  },
};

type Lang = "it" | "en";

const STR = {
  it: {
    backLink: "← Home",
    backHref: "/",
    title: "Avvisi",
    subtitle:
      "Tutto ciò che le notifiche hanno segnalato, in ordine dal più recente: record assoluti battuti, ondate di calore in arrivo, il recap del mese appena concluso. Solo eventi reali rilevati dai dati — mai promozioni, mai marketing.",
    ctaTitle: "🔔 Ricevili sul telefono",
    ctaBody:
      "Attiva le notifiche per ricevere questi avvisi appena accadono. Se segui una città, ricevi anche gli avvisi mirati su di lei. Nessun account, disattivabile quando vuoi.",
    empty: "Ancora nessun evento registrato — il registro parte da ora. Torna dopo il prossimo record o la prossima ondata.",
    typeLabels: { record: "Record", heatwave: "Ondata di calore", monthly: "Recap mensile" } as Record<
      SiteEvent["type"],
      string
    >,
    more: "Vedi i dati →",
  },
  en: {
    backLink: "← Home",
    backHref: "/en",
    title: "Alerts",
    subtitle:
      "Everything the notifications have flagged, newest first: all-time records broken, incoming heatwaves, the recap of the month just ended. Only real events detected in the data — never promotions, never marketing.",
    ctaTitle: "🔔 Get them on your phone",
    ctaBody:
      "Turn on notifications to receive these alerts as they happen. If you follow a city, you also get alerts targeted to it. No account, switch off anytime.",
    empty: "No events recorded yet — the log starts now. Check back after the next record or heatwave.",
    typeLabels: { record: "Record", heatwave: "Heatwave", monthly: "Monthly recap" } as Record<
      SiteEvent["type"],
      string
    >,
    more: "See the data →",
  },
} as const;

function fmtDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export async function AvvisiPageContent({ lang = "it" as Lang }: { lang?: Lang }) {
  const t = STR[lang];
  const events = await getEvents(30);
  const base = lang === "en" ? "/en" : "";

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
        <p className="text-on-surface-variant mt-2 leading-relaxed">{t.subtitle}</p>
      </header>

      <section className="m3-card rise p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-extrabold tracking-tight mb-1">{t.ctaTitle}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{t.ctaBody}</p>
        <NotifyButton lang={lang} />
      </section>

      {events.length === 0 ? (
        <p className="text-on-surface-variant">{t.empty}</p>
      ) : (
        <ol className="space-y-3">
          {events.map((ev, i) => {
            const loc = ev[lang] ?? ev.it;
            // Le URL nel registro sono già localizzate per lingua dell'evento;
            // per sicurezza si riusa quella della lingua corrente se presente.
            const href = loc.url?.startsWith("/") ? loc.url : `${base}/`;
            return (
              <li key={`${ev.date}-${i}`} className="m3-card p-4">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
                  <span className="m3-chip bg-surface-container-high px-2 py-0.5">
                    {t.typeLabels[ev.type] ?? ev.type}
                  </span>
                  <time dateTime={ev.date}>{fmtDate(ev.date, lang)}</time>
                </div>
                <h3 className="font-extrabold tracking-tight">{loc.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">{loc.body}</p>
                <Link href={href} className="text-sm text-secondary font-semibold hover:underline mt-1 inline-block">
                  {t.more}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function AvvisiPage() {
  return <AvvisiPageContent lang="it" />;
}
