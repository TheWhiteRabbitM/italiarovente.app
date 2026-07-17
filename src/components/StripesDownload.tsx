"use client";

import { useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/track";

// Avvolge le WarmingStripes (SVG puro) e offre il download in SVG e PNG.
// Serializza l'SVG già renderizzato nel DOM: nessuna libreria, nessun fetch.
// Le strisce usano colori concreti (anomalyColor → hex), quindi il PNG è
// fedele; il canvas resta "pulito" perché l'SVG è inline e same-origin.
const STR = {
  it: { label: "Scarica l'immagine", svg: "SVG", png: "PNG" },
  en: { label: "Download the image", svg: "SVG", png: "PNG" },
} as const;

const EXPORT_W = 1600;
const EXPORT_H = 400;

export function StripesDownload({
  filename,
  lang = "it",
  children,
}: {
  filename: string;
  lang?: "it" | "en";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = STR[lang];

  function buildSvg(): string | null {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // Dimensioni concrete per l'export (a schermo l'SVG è fluido con
    // preserveAspectRatio="none": le strisce si stirano per riempire).
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    clone.setAttribute("width", String(EXPORT_W));
    clone.setAttribute("height", String(EXPORT_H));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  }

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadSvg() {
    const svg = buildSvg();
    if (!svg) return;
    download(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);
    trackEvent("share", { where: "stripes-svg" });
  }

  function downloadPng() {
    const svg = buildSvg();
    if (!svg) return;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_W;
      canvas.height = EXPORT_H;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H);
        canvas.toBlob((blob) => {
          if (blob) download(blob, `${filename}.png`);
        }, "image/png");
      }
      URL.revokeObjectURL(svgUrl);
      trackEvent("share", { where: "stripes-png" });
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  }

  return (
    <div>
      <div ref={ref}>{children}</div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-on-surface-variant">{t.label}:</span>
        <button
          type="button"
          onClick={downloadSvg}
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs"
        >
          ⬇️ {t.svg}
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="m3-chip bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs"
        >
          ⬇️ {t.png}
        </button>
      </div>
    </div>
  );
}
