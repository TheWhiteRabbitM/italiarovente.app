// Logo vettoriale di Italia Rovente: "gauge" del calore (indice che va dal
// grigio neutro al rosso, in stile lancetta) — disegnato da Claude Design,
// vedi il pacchetto in public/icon.svg (versione con sfondo, per app icon).
export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Italia Rovente"
    >
      <defs>
        <linearGradient id="logoHeat" x1="0" y1="1" x2="0.8" y2="0.1">
          <stop offset="0" stopColor="#f0b13e" />
          <stop offset="0.5" stopColor="#ef6a2a" />
          <stop offset="1" stopColor="#cf2f1e" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path
          d="M26.7 73.3 A33 33 0 1 1 73.3 73.3"
          stroke="#e5ddd2"
          strokeWidth="9"
        />
        <path
          d="M26.7 73.3 A33 33 0 1 1 80.5 37.4"
          stroke="url(#logoHeat)"
          strokeWidth="9"
        />
        <circle cx="80.5" cy="37.4" r="4.6" fill="#db3a1f" stroke="none" />
        <circle cx="50" cy="50" r="5.5" fill="#8f8578" stroke="none" />
      </g>
    </svg>
  );
}
