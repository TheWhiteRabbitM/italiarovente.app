"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tempColor, fmtTemp } from "@/lib/format";
import { useUnit } from "./UnitProvider";

export type MapMarker = {
  slug: string;
  name: string;
  x: number;
  y: number;
  temp: number | null;
};

export type SeaMarker = {
  slug: string;
  name: string;
  x: number;
  y: number;
  temp: number | null;
};

const STR = {
  it: {
    mapLabel: "Mappa interattiva delle temperature in Italia",
    legendHint: "· tocca una città per lo storico ·",
    legendSea: "= temperatura del mare",
  },
  en: {
    mapLabel: "Interactive map of temperatures in Italy",
    legendHint: "· tap a city for its history ·",
    legendSea: "= sea temperature",
  },
} as const;

export function ItalyMap({
  width,
  height,
  outline,
  markers,
  seaMarkers = [],
  lang = "it",
}: {
  width: number;
  height: number;
  outline: string;
  markers: MapMarker[];
  seaMarkers?: SeaMarker[];
  lang?: "it" | "en";
}) {
  const t = STR[lang];
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const { unit } = useUnit();

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[78vh] mx-auto block overflow-visible"
        role="img"
        aria-label={t.mapLabel}
      >
        <defs>
          <linearGradient id="mapfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--surface-container-high)" />
            <stop offset="100%" stopColor="var(--surface-container)" />
          </linearGradient>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Contorno Italia */}
        <path
          d={outline}
          fill="url(#mapfill)"
          stroke="var(--outline)"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />

        {/* Mare: temperatura superficiale. Icona vettoriale (identica a
            quella nella legenda — non un'emoji, che non renderizza in modo
            affidabile dentro un <text> SVG su tutti i browser) con etichetta
            sempre sotto — le città la mettono di lato, così le due si
            separano invece di sovrapporsi. I punti sono scelti in mare
            aperto, lontano dalle città costiere (vedi lib/sea.ts). */}
        {seaMarkers.map((s) => {
          const c = tempColor(s.temp);
          return (
            <g key={s.slug} transform={`translate(${s.x}, ${s.y})`}>
              <WaveIcon size={20} color={c} />
              <text
                y={22}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill={c}
                style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5 }}
              >
                {fmtTemp(s.temp, 0, unit)}
              </text>
            </g>
          );
        })}

        {/* Città */}
        {markers.map((m) => {
          const c = tempColor(m.temp);
          const active = hover === m.slug;
          const labelLeft = m.x > width * 0.58;
          const r = active ? 12 : 8.5;
          return (
            <g
              key={m.slug}
              transform={`translate(${m.x}, ${m.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHover(m.slug)}
              onMouseLeave={() => setHover(null)}
              onClick={() => router.push(`${lang === "en" ? "/en" : ""}/citta/${m.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push(`${lang === "en" ? "/en" : ""}/citta/${m.slug}`)}
            >
              {/* alone */}
              <circle r={active ? 22 : 16} fill={c} opacity={active ? 0.35 : 0.18}>
                <animate
                  attributeName="opacity"
                  values={`${active ? 0.35 : 0.18};0.05;${active ? 0.35 : 0.18}`}
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* punto */}
              <circle
                r={r}
                fill={c}
                stroke="#fff"
                strokeWidth={active ? 2.5 : 1.8}
                filter={active ? "url(#glow)" : undefined}
                style={{ transition: "r .2s" }}
              />
              {/* etichetta */}
              <g
                transform={`translate(${labelLeft ? -r - 7 : r + 7}, 0)`}
                textAnchor={labelLeft ? "end" : "start"}
              >
                <text
                  y={-3}
                  fontSize={active ? 18 : 15.5}
                  fontWeight={800}
                  fill="var(--on-surface)"
                  style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5 }}
                >
                  {m.name}
                </text>
                <text
                  y={15}
                  fontSize={14.5}
                  fontWeight={700}
                  fill={c}
                  style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5 }}
                >
                  {fmtTemp(m.temp, 0, unit)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Legenda temperatura */}
      <div className="mt-2 flex items-center gap-3 justify-center text-xs text-on-surface-variant">
        <span>{fmtTemp(0, 0, unit)}</span>
        <div
          className="h-2.5 w-40 rounded-full"
          style={{
            background:
              "linear-gradient(90deg,#2563eb,#06b6d4,#22c55e,#eab308,#f97316,#ef4444)",
          }}
        />
        <span>{fmtTemp(40, 0, unit)}</span>
        <span className="ml-2 hidden sm:inline items-center gap-1 inline-flex">
          {t.legendHint}
          <WaveIcon size={14} color="currentColor" />
          {t.legendSea}
        </span>
      </div>
    </div>
  );
}

// Icona "onde" condivisa tra marcatore sulla mappa e legenda, così sono
// sempre identiche (a differenza di un'emoji, il cui rendering in <text>
// SVG non è affidabile su tutti i browser).
function WaveIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      viewBox="-10 -6 20 12"
      aria-hidden
    >
      <g stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round">
        <path d="M-9,-2 C-6,-5 -3,-5 0,-2 C3,1 6,1 9,-2" />
        <path d="M-9,3 C-6,0 -3,0 0,3 C3,6 6,6 9,3" />
      </g>
    </svg>
  );
}
