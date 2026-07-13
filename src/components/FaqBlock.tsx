import type { Faq } from "@/lib/faq";

// Sezione "Domande e risposte" visibile e riutilizzabile: gli stessi testi del
// FAQPage JSON-LD, resi in <details> nativi (nessun JS, testo nel DOM anche
// collassato — leggibile da crawler e AI, ed eleggibile per i rich result).
export function FaqBlock({
  faq,
  title,
  eyebrow = "❓ Q&A",
}: {
  faq: Faq[];
  title: string;
  eyebrow?: string;
}) {
  if (!faq.length) return null;
  return (
    <section className="mt-12">
      <div className="mb-3">
        <span className="m3-chip bg-surface-container-high text-on-surface-variant text-xs font-bold">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight mt-2">{title}</h2>
      </div>
      <div className="space-y-3">
        {faq.map((f) => (
          <details key={f.q} className="m3-card rise p-4 sm:p-5 group">
            <summary className="font-bold cursor-pointer list-none flex items-center justify-between gap-3">
              <span>{f.q}</span>
              <span
                className="text-on-surface-variant transition-transform group-open:rotate-180"
                aria-hidden
              >
                ⌄
              </span>
            </summary>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
