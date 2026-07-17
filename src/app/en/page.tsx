import Link from "next/link";
import { CITIES, MAIN_CITIES, cityDisplayName } from "@/lib/cities";
import { getForecast, getArchiveStats } from "@/lib/weather";
import { LiveBoard, type LiveItem } from "@/components/LiveBoard";
import { CityCard } from "@/components/CityCard";
import { ZoneStats } from "@/components/ZoneStats";
import { VisitCounter } from "@/components/VisitCounter";
import { NotifyButton } from "@/components/NotifyButton";
import { RotatingHero } from "@/components/RotatingHero";
import { MyCity } from "@/components/MyCity";
import { ItalyMap } from "@/components/ItalyMap";
import { getItalyMap } from "@/lib/italymap";
import { LifetimeWarming } from "@/components/LifetimeWarming";
import { YearExtremes } from "@/components/YearExtremes";
import { MonthlyHighlight } from "@/components/MonthlyHighlight";
import { nationalMonthlyHighlight } from "@/lib/monthlyCompare";
import { getLifetimeData } from "@/lib/lifetime";
import { buildHeroFacts } from "@/lib/herofacts";
import { SeaTemps } from "@/components/SeaTemps";
import { getSeaTemps, seaDisplayName } from "@/lib/sea";
import { AskClimate } from "@/components/AskClimate";
import { DroughtBoard, type DroughtItem } from "@/components/DroughtBoard";
import { Temp } from "@/components/Temp";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "How much has Italy warmed since 1940?",
  description:
    `Daily & historical temperatures of ${CITIES.length} Italian cities since 1940 (ERA5/ECMWF). See how your favorite Italian city's temperature has changed — interactive map, live data, warming stripes.`,
  alternates: { canonical: "/en", languages: { it: "/", "x-default": "/" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en`,
    title: "How much has Italy warmed since 1940?",
    description:
      `Daily & historical temperatures of ${CITIES.length} Italian cities since 1940 (ERA5/ECMWF).`,
    siteName: "Italia Rovente",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "How much has Italy warmed since 1940?",
    description: `${CITIES.length} Italian cities, temperatures since 1940. Real data, not opinions.`,
  },
};

export default async function EnglishHome() {
  const settled = await Promise.allSettled(MAIN_CITIES.map((c) => getForecast(c)));
  const paired = MAIN_CITIES.map((city, i) => ({
    city,
    forecast: settled[i].status === "fulfilled" ? settled[i].value : null,
  })).filter(
    (p): p is { city: (typeof MAIN_CITIES)[number]; forecast: NonNullable<typeof p.forecast> } =>
      p.forecast !== null,
  );

  if (paired.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-3xl font-extrabold mb-2">Data temporarily unavailable</h1>
        <p className="text-on-surface-variant">
          The weather source (Open-Meteo) is temporarily unreachable. Try
          again in a few minutes: data is restored automatically.
        </p>
      </div>
    );
  }

  const temps = paired
    .map((p) => p.forecast.current.temp)
    .filter((t): t is number => t !== null);
  const avg = temps.reduce((s, t) => s + t, 0) / (temps.length || 1);

  const hottest = paired.reduce((a, b) =>
    (b.forecast.current.temp ?? -99) > (a.forecast.current.temp ?? -99) ? b : a,
  );
  const coldest = paired.reduce((a, b) =>
    (b.forecast.current.temp ?? 99) < (a.forecast.current.temp ?? 99) ? b : a,
  );

  const now = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });

  const mapData = getItalyMap();
  const tempBySlug = Object.fromEntries(paired.map((p) => [p.city.slug, p.forecast.current.temp]));
  const markers = mapData.cities.map((c) => ({
    slug: c.slug,
    name: cityDisplayName(c.slug, c.name, "en"),
    x: c.x,
    y: c.y,
    temp: tempBySlug[c.slug] ?? null,
  }));

  const lifetimeData = getLifetimeData();
  const hero = buildHeroFacts(lifetimeData, "en");

  const todayStr = new Date().toISOString().slice(0, 10);
  const month = Number(todayStr.slice(5, 7));
  const liveItems: LiveItem[] = paired.map(({ city, forecast }) => {
    const stats = getArchiveStats(city);
    const monthMean = stats?.monthly.find((m) => m.month === month)?.mean ?? null;
    const today = forecast.days.find((d) => d.date === todayStr);
    const todayMean =
      today && today.max != null && today.min != null
        ? (today.max + today.min) / 2
        : null;
    return {
      slug: city.slug,
      name: cityDisplayName(city.slug, city.name, "en"),
      temp: forecast.current.temp,
      anomaly: todayMean != null && monthMean != null ? todayMean - monthMean : null,
    };
  });

  const seaReadings = await getSeaTemps();
  const seaTempBySlug = Object.fromEntries(seaReadings.map((r) => [r.slug, r.temp]));
  const seaMarkers = mapData.seaPoints.map((p) => ({
    slug: p.slug,
    name: seaDisplayName(p.slug, p.name, "en"),
    x: p.x,
    y: p.y,
    temp: seaTempBySlug[p.slug] ?? null,
  }));

  const droughtItems: DroughtItem[] = paired.map(({ city, forecast }) => ({
    slug: city.slug,
    name: cityDisplayName(city.slug, city.name, "en"),
    dryDays: forecast.drought.dryDays,
    rain30d: forecast.drought.rain30d,
    capped: forecast.drought.capped,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* HERO */}
      <section className="rise text-center mb-12">
        <div className="m3-chip bg-tertiary-container text-on-tertiary-container mx-auto mb-5">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          Live data · updated daily
        </div>
        <RotatingHero
          lang="en"
          defaultHeadline={hero?.primary.headline ?? "How has Italy's temperature changed?"}
          defaultBig={
            hero ? (
              hero.primary.deltaC != null ? (
                <Temp value={hero.primary.deltaC} digits={1} delta locale="en" />
              ) : (
                hero.primary.value
              )
            ) : (
              "–"
            )
          }
          defaultCaption={hero?.primary.caption ?? ""}
          defaultColor={hero?.primary.color ?? "var(--primary)"}
        />

        <p className="mt-5 text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Every summer it&apos;s the same debate: &quot;hottest ever&quot;, &quot;unbearable
          heat&quot;. So we checked with real data. Daily and historical
          temperatures of <strong>{CITIES.length} Italian cities since 1940</strong>, from
          the <strong>ERA5 (ECMWF/Copernicus)</strong> reanalysis. No
          opinions, just degrees.
        </p>
        <p className="mt-2 text-sm text-on-surface-variant capitalize">{now}</p>

        <div
          className="mx-auto mt-6 h-3 max-w-xl rounded-full"
          style={{
            background:
              "linear-gradient(90deg,#2166ac,#4393c3,#92c5de,#d1e5f0,#f7f7f7,#fddbc7,#f4a582,#d6604d,#b2182b,#67001f)",
          }}
          aria-hidden
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/en/clima"
            className="m3-chip bg-primary text-on-primary text-base px-6 py-3 hover:scale-105 transition-transform inline-flex"
          >
            🔎 See the full analysis →
          </Link>
          <VisitCounter lang="en" />
        </div>
      </section>

      <MyCity lang="en" />

      {/* NATIONAL SUMMARY */}
      <section className="grid gap-4 sm:grid-cols-3 mb-12">
        <StatCard
          label="National average now"
          value={<Temp value={avg} digits={1} />}
          color="currentColor"
          sub={`${temps.length} cities monitored`}
          emoji="🌡️"
          tint="tertiary"
        />
        <StatCard
          label="Hottest city"
          value={<Temp value={hottest.forecast.current.temp} digits={0} />}
          color="currentColor"
          sub={hottest.city.name}
          emoji="🔥"
          tint="primary"
        />
        <StatCard
          label="Coolest city"
          value={<Temp value={coldest.forecast.current.temp} digits={0} />}
          color="currentColor"
          sub={coldest.city.name}
          emoji="❄️"
          tint="secondary"
        />
      </section>

      {/* EXPLORE: the three interactive features, with room to explain themselves */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-center">
          Explore the data
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ExploreCard
            href="/en/classifiche"
            emoji="🏆"
            title="Rankings"
            desc="The fastest-warming cities, all-time records, tropical nights."
            tint="primary"
          />
          <ExploreCard
            href="/en/quiz"
            emoji="🎯"
            title="Climate quiz"
            desc="5 daily questions on real numbers from Italian cities. Same quiz for everyone."
            tint="secondary"
          />
          <ExploreCard
            href="/en/europa"
            emoji="🌍"
            title="Italy vs Europe"
            desc="Is Rome warming faster than Paris? Compare your city with European capitals."
            tint="tertiary"
          />
        </div>
        <div className="mt-4 flex justify-center">
          <NotifyButton lang="en" />
        </div>
      </section>

      {/* LIVE: today + ranking */}
      <div className="mb-12">
        <LiveBoard items={liveItems} month={month} lang="en" />
      </div>

      {/* SEA */}
      <div className="mb-12">
        <SeaTemps readings={seaReadings} lang="en" />
      </div>

      {/* DROUGHT */}
      <div className="mb-12">
        <DroughtBoard items={droughtItems} lang="en" />
      </div>

      {/* ASK THE CLIMATE */}
      <div className="mb-12"><AskClimate lang="en" /></div>

      {/* "SINCE YOU WERE BORN" WIDGET */}
      <section className="mb-12">
        <LifetimeWarming data={lifetimeData} lang="en" />
      </section>

      {/* THE MONTH COMPARED (national) */}
      <MonthlyHighlight highlight={nationalMonthlyHighlight()} lang="en" scope="in Italy" />

      {/* MOST EXTREME YEARS (hottest/coldest on record) */}
      <YearExtremes years={lifetimeData.cities[0].years} baseline={lifetimeData.cities[0].baseline} lang="en" />

      {/* MAP + MAIN CITIES */}
      <section className="mb-12 grid gap-6 lg:gap-8 lg:grid-cols-2 items-start">
        <div className="lg:sticky lg:top-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            The heat map 🔥
          </h2>
          <div className="relative">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none blur-3xl"
              style={{
                background: "radial-gradient(circle at 50% 38%, var(--primary-fixed), transparent 62%)",
              }}
              aria-hidden
            />
            <ItalyMap width={mapData.width} height={mapData.height} outline={mapData.outline} markers={markers} seaMarkers={seaMarkers} lang="en" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3 gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Main cities</h2>
            <Link
              href="/en/citta"
              className="text-sm font-bold text-primary hover:underline shrink-0"
            >
              All cities →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {paired.map(({ city, forecast }, i) => (
              <CityCard key={city.slug} city={city} forecast={forecast} index={i} lang="en" />
            ))}
          </div>
        </div>
      </section>

      {/* PUBLIC PARTICIPATION */}
      <section className="mt-12">
        <ZoneStats lang="en" />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  emoji,
  tint = "tertiary",
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  color: string;
  emoji?: string;
  tint?: "primary" | "secondary" | "tertiary";
}) {
  const tints = {
    primary: "bg-primary-container text-on-primary-container",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
  };
  return (
    <div
      className={`rise rounded-[28px] p-6 flex flex-col gap-1 border border-[var(--outline-variant)] ${tints[tint]} relative overflow-hidden transition-transform hover:-translate-y-1`}
      style={{ boxShadow: "var(--shadow-key)" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold opacity-80">{label}</div>
        {emoji && (
          <span className="text-xl w-9 h-9 rounded-full bg-[var(--surface)]/40 flex items-center justify-center">
            {emoji}
          </span>
        )}
      </div>
      <div className="text-6xl font-extrabold tracking-tighter mt-1" style={{ color }}>
        {value}
      </div>
      <div className="text-sm font-semibold opacity-80">{sub}</div>
    </div>
  );
}

function ExploreCard({
  href,
  emoji,
  title,
  desc,
  tint = "primary",
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  tint?: "primary" | "secondary" | "tertiary";
}) {
  const tints = {
    primary: "bg-primary-container text-on-primary-container",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
  };
  return (
    <Link
      href={href}
      className="m3-card m3-card-interactive p-5 flex items-start gap-3 group"
    >
      <span
        className={`text-2xl w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${tints[tint]}`}
      >
        {emoji}
      </span>
      <div className="min-w-0">
        <div className="font-bold group-hover:text-primary transition-colors">
          {title}
        </div>
        <div className="text-sm text-on-surface-variant leading-snug mt-0.5">
          {desc}
        </div>
      </div>
    </Link>
  );
}
