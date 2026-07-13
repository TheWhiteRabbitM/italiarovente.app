"use client";

import { Children, useState, type ReactNode } from "react";

// Mostra le prime `initial` righe di una classifica e nasconde il resto dietro
// un toggle "mostra tutte / riduci". Le righe sono renderizzate a monte (Server
// Component) e passate come children: qui gestiamo solo quante mostrarne, così
// il contenuto resta comunque nel DOM/HTML per l'indicizzazione — il pulsante
// non fa fetch, taglia solo la visualizzazione. Serve ad accorciare pagine con
// molte classifiche lunghe (src/app/classifiche/page.tsx).
// I label sono stringhe già pronte (non funzioni): le funzioni non si possono
// passare da un Server Component a un Client Component. Il chiamante calcola il
// testo "Mostra tutte le N" lato server, dove conosce già la lunghezza.
export function ExpandableList({
  children,
  initial = 5,
  moreLabel,
  lessLabel,
}: {
  children: ReactNode;
  initial?: number;
  moreLabel: string;
  lessLabel: string;
}) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);

  return (
    <>
      <div className="space-y-2.5">{shown}</div>
      {items.length > initial && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-sm font-semibold text-secondary hover:underline"
          aria-expanded={open}
        >
          {open ? lessLabel : moreLabel}
        </button>
      )}
    </>
  );
}
