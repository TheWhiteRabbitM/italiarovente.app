const STR = {
  it: {
    title: "🧪 Metodo e trasparenza",
    items: [
      <>
        <strong>Fonte</strong>: reanalysis{" "}
        <strong>ERA5 di ECMWF / Copernicus</strong> via Open-Meteo — lo
        standard scientifico per ricostruire il clima passato (temperatura
        dell&apos;aria a 2 m, dal 1940).
      </>,
      <>
        <strong>Anomalie, non valori assoluti</strong>: ogni anno è
        confrontato con la <strong>normale climatica 1961–1990</strong>
        (riferimento WMO). Le anomalie eliminano il rumore stagionale e
        rendono visibile la tendenza di fondo.
      </>,
      <>
        <strong>Tendenza</strong>: calcolata per regressione lineare sulle
        medie annue; R² indica quanto la retta spiega i dati (0 = nessun
        trend, 1 = trend perfetto).
      </>,
      <>
        <strong>Limiti</strong>: ogni città è un singolo punto della griglia
        ERA5. Questi dati riguardano <strong>queste città italiane</strong>{" "}
        (scala regionale): sono coerenti con il riscaldamento globale misurato
        da NASA, NOAA e Copernicus, ma non lo sostituiscono.
      </>,
      <>
        <strong>Niente cherry-picking</strong>: viene sempre mostrata
        l&apos;intera serie disponibile, dal primo all&apos;ultimo anno.
      </>,
      <>
        <strong>Record giornalieri</strong>: escludono gli ultimi ~4 mesi.
        ERA5 pubblica una versione preliminare dopo pochi giorni, ma quella
        definitiva (&quot;ri-analizzata&quot;) arriva dopo diverso tempo e
        può differire leggermente: un record assoluto non viene mai
        dichiarato su un dato ancora provvisorio.
      </>,
      <>
        <strong>Massime e minime</strong>: mostrate separate dalla media
        (stesso confronto a due trentenni) perché giorni e notti non si
        scaldano sempre allo stesso ritmo.
      </>,
      <>
        <strong>Confronto climatico</strong>: confronta la temperatura media
        annua di questa città con quella delle altre città monitorate nei
        decenni passati — non l&apos;intero profilo stagionale, che
        richiederebbe dati non ancora disponibili a questo dettaglio.
      </>,
    ],
  },
  en: {
    title: "🧪 Method and transparency",
    items: [
      <>
        <strong>Source</strong>: <strong>ERA5 reanalysis from ECMWF /
        Copernicus</strong> via Open-Meteo — the scientific standard for
        reconstructing past climate (2 m air temperature, from 1940).
      </>,
      <>
        <strong>Anomalies, not absolute values</strong>: each year is
        compared against the <strong>1961–1990 climate normal</strong>
        (the WMO reference period). Anomalies remove seasonal noise and make
        the underlying trend visible.
      </>,
      <>
        <strong>Trend</strong>: computed by linear regression on annual
        means; R² indicates how much of the data the line explains (0 = no
        trend, 1 = perfect trend).
      </>,
      <>
        <strong>Limitations</strong>: each city is a single point on the ERA5
        grid. This data concerns <strong>these Italian cities</strong>{" "}
        (regional scale): it is consistent with the global warming measured
        by NASA, NOAA and Copernicus, but does not replace it.
      </>,
      <>
        <strong>No cherry-picking</strong>: the entire available series is
        always shown, from the first to the last year.
      </>,
      <>
        <strong>Daily records</strong>: exclude the last ~4 months. ERA5
        publishes a preliminary version after a few days, but the final
        (&quot;re-analyzed&quot;) version arrives later and can differ
        slightly: an absolute record is never declared on data that is still
        provisional.
      </>,
      <>
        <strong>Highs and lows</strong>: shown separately from the mean (same
        two-normal comparison) because days and nights don&apos;t always
        warm at the same rate.
      </>,
      <>
        <strong>Climate analog</strong>: compares this city&apos;s annual
        mean temperature with that of other monitored cities in past
        decades — not the full seasonal profile, which would require data
        not yet available at this level of detail.
      </>,
    ],
  },
} as const;

export function Methodology({ lang = "it" }: { lang?: "it" | "en" }) {
  const t = STR[lang];
  return (
    <section className="m3-card p-6">
      <h2 className="text-lg font-extrabold mb-3">{t.title}</h2>
      <ul className="text-sm text-on-surface-variant space-y-2 leading-relaxed list-disc pl-5">
        {t.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
