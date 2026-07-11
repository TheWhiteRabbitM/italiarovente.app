import { Temp } from "./Temp";
import { TrendSparkline } from "./TrendSparkline";
import { tempColor } from "@/lib/format";
import type { SummerFeels as SummerFeelsData } from "@/lib/summerfeels";

const STR = {
  it: {
    title: "🥵 L'afa d'estate",
    intro: (scope: string) => (
      <>
        A <strong>{scope}</strong> l&apos;estate <em>percepita</em> (media giugno–agosto della
        temperatura che si sente davvero, con umidità e vento) è passata dal trentennio 1961–1990
        a quello 1991–2020 così:
      </>
    ),
    feelsLabel: "Percepita estiva",
    dryLabel: "Temperatura reale",
    baselineTag: "1961–1990",
    recentTag: "1991–2020",
    honest: (feelsDelta: React.ReactNode, dryDelta: React.ReactNode) => (
      <>
        La percepita è salita di {feelsDelta}, ma la <strong>gran parte è il caldo in sé</strong>: la
        temperatura reale è cresciuta di {dryDelta}. L&apos;umidità e la mancanza di vento ci
        aggiungono sopra solo un po&apos;, e in modo irregolare.
      </>
    ),
    gap: (recent: React.ReactNode, baseline: React.ReactNode) => (
      <>
        Oggi l&apos;afa aggiunge in media {recent} alla temperatura reale d&apos;estate; nel
        trentennio 1961–1990 erano {baseline}.
      </>
    ),
    sparkTitle: "Percepita estiva, anno per anno",
    disclaimer:
      "La temperatura percepita è una stima modellistica (umidità, vento, radiazione), meno solida della temperatura misurata. Qui serve a raccontare l'afa, non come record.",
  },
  en: {
    title: "🥵 Summer mugginess",
    intro: (scope: string) => (
      <>
        In <strong>{scope}</strong> the <em>felt</em> summer (June–August average of what the air
        actually feels like, with humidity and wind) shifted from the 1961–1990 period to
        1991–2020 like this:
      </>
    ),
    feelsLabel: "Felt summer",
    dryLabel: "Actual temperature",
    baselineTag: "1961–1990",
    recentTag: "1991–2020",
    honest: (feelsDelta: React.ReactNode, dryDelta: React.ReactNode) => (
      <>
        The felt temperature rose by {feelsDelta}, but <strong>most of it is the heat itself</strong>:
        the actual temperature went up by {dryDelta}. Humidity and lack of wind add only a little on
        top, and unevenly.
      </>
    ),
    gap: (recent: React.ReactNode, baseline: React.ReactNode) => (
      <>
        Today mugginess adds on average {recent} to the actual summer temperature; in the 1961–1990
        period it was {baseline}.
      </>
    ),
    sparkTitle: "Felt summer temperature, year by year",
    disclaimer:
      "Apparent temperature is a model estimate (humidity, wind, radiation), less solid than the measured temperature. Here it is used to describe mugginess, not as a record.",
  },
} as const;

function Box({
  label,
  tag,
  baseline,
  recent,
  delta,
  lang,
}: {
  label: string;
  tag: string;
  baseline: number;
  recent: number;
  delta: number;
  lang: "it" | "en";
}) {
  return (
    <div className="rounded-2xl bg-surface-container-high p-4">
      <div className="text-xs font-bold text-on-surface-variant">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-sm text-on-surface-variant tabular-nums">
          <Temp value={baseline} digits={1} locale={lang} />
        </span>
        <span className="text-on-surface-variant">→</span>
        <span className="text-2xl font-extrabold tabular-nums" style={{ color: tempColor(recent) }}>
          <Temp value={recent} digits={1} locale={lang} />
        </span>
      </div>
      <div className="text-xs font-bold mt-1 tabular-nums" style={{ color: tempColor(recent) }}>
        <Temp value={delta} digits={1} delta locale={lang} />
      </div>
    </div>
  );
}

export function SummerFeels({
  data,
  scope,
  lang = "it",
}: {
  data: SummerFeelsData;
  scope: string;
  lang?: "it" | "en";
}) {
  const t = STR[lang];

  return (
    <section className="m3-card rise p-5 sm:p-6 mb-8">
      <h2 className="text-xl font-extrabold tracking-tight mb-2">{t.title}</h2>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{t.intro(scope)}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Box
          label={t.feelsLabel}
          tag={t.recentTag}
          baseline={data.feelsBaseline}
          recent={data.feelsRecent}
          delta={data.feelsDelta}
          lang={lang}
        />
        <Box
          label={t.dryLabel}
          tag={t.recentTag}
          baseline={data.dryBaseline}
          recent={data.dryRecent}
          delta={data.dryDelta}
          lang={lang}
        />
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
        {t.honest(
          <strong className="tabular-nums">
            <Temp value={data.feelsDelta} digits={1} delta locale={lang} />
          </strong>,
          <strong className="tabular-nums">
            <Temp value={data.dryDelta} digits={1} delta locale={lang} />
          </strong>,
        )}
      </p>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        {t.gap(
          <span className="tabular-nums font-semibold">
            <Temp value={data.gapRecent} digits={1} delta locale={lang} />
          </span>,
          <span className="tabular-nums font-semibold">
            <Temp value={data.gapBaseline} digits={1} delta locale={lang} />
          </span>,
        )}
      </p>

      {data.years.length >= 2 ? (
        <div className="mb-3" title={t.sparkTitle}>
          <div className="text-xs font-bold text-on-surface-variant mb-1">{t.sparkTitle}</div>
          <TrendSparkline
            values={data.years.map((y) => y.feels)}
            color={tempColor(data.feelsRecent)}
            height={40}
          />
        </div>
      ) : null}

      <p className="text-xs text-on-surface-variant leading-relaxed">{t.disclaimer}</p>
    </section>
  );
}
