import Link from "next/link";
import { cityName, type City } from "@/lib/cities";
import type { CityForecast } from "@/lib/weather";
import { Sparkline } from "./Sparkline";
import { tempColor, weatherDesc, weatherDescEn } from "@/lib/format";
import { Temp } from "./Temp";

export function CityCard({
  city,
  forecast,
  index = 0,
  lang = "it",
}: {
  city: City;
  forecast: CityForecast;
  index?: number;
  lang?: "it" | "en";
}) {
  const today = forecast.days.find(
    (d) => d.date === new Date().toISOString().slice(0, 10),
  );
  const temp = forecast.current.temp;
  const w = lang === "en" ? weatherDescEn(forecast.current.code) : weatherDesc(forecast.current.code);
  const color = tempColor(temp);
  const href = `${lang === "en" ? "/en" : ""}/citta/${city.slug}`;

  return (
    <Link
      href={href}
      className="m3-card m3-card-interactive rise p-4 flex flex-col gap-2.5 group relative overflow-hidden"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-40"
        style={{ background: color }}
        aria-hidden
      />
      <div className="flex items-start justify-between relative">
        <div>
          <h3 className="text-lg font-extrabold leading-tight">{cityName(city, lang)}</h3>
          <p className="text-xs text-on-surface-variant font-medium">
            {city.region}
          </p>
        </div>
        <span className="text-2xl" title={w.label}>
          {w.icon}
        </span>
      </div>

      <div className="flex items-end justify-between relative">
        <div
          className="text-4xl font-extrabold tracking-tight"
          style={{ color }}
        >
          <Temp value={temp} digits={0} />
        </div>
        <Sparkline values={forecast.spark.map((s) => s.mean)} />
      </div>

      <div className="flex items-center gap-3 text-sm relative">
        <span className="m3-chip bg-primary-container text-on-primary-container">
          ↑ <Temp value={today?.max} digits={0} />
        </span>
        <span className="m3-chip bg-secondary-container text-on-secondary-container">
          ↓ <Temp value={today?.min} digits={0} />
        </span>
        <span className="ml-auto text-xs text-on-surface-variant font-medium">
          {w.label}
        </span>
      </div>
    </Link>
  );
}
