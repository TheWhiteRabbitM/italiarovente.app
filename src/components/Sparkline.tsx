import { tempColor } from "@/lib/format";

// Sparkline SVG pura (renderizzabile lato server) per le card città.
export function Sparkline({
  values,
  width = 120,
  height = 36,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
}) {
  const pts = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (pts.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1);

  const coords = pts.map((v, i) => {
    const x = i * stepX;
    const y = height - 3 - ((v - min) / range) * (height - 6);
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const id = `sg-${Math.round(min)}-${Math.round(max)}-${pts.length}`;
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tempColor(max)} stopOpacity="0.35" />
          <stop offset="100%" stopColor={tempColor(min)} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={tempColor(pts[pts.length - 1])}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tempColor(pts[pts.length - 1])} />
    </svg>
  );
}
