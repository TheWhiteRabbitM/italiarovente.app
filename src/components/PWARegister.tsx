"use client";

import { useEffect } from "react";

// Registra il service worker (installabilità PWA + offline).
//
// L'URL porta l'id della build: cambiando a ogni deploy, il browser considera
// lo script "nuovo", lo installa e il vecchio SW viene sostituito — è il
// meccanismo che permette a sw.js di versionare la sua cache e purgare quelle
// precedenti in `activate`.
//
// In sviluppo il SW NON viene registrato, e anzi si disinstalla se presente:
// i chunk di `next dev` non hanno hash nel nome, quindi la strategia
// cache-first del SW serve la versione vecchia di un componente anche dopo
// averlo modificato — un DOM che contraddice l'HTML servito, difficilissimo
// da diagnosticare.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister();
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          for (const k of keys) if (k.startsWith("ir-")) caches.delete(k);
        });
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register(`/sw.js?v=${BUILD_ID}`).catch(() => {
        /* ignora */
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}
