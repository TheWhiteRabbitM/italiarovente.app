// Coordinamento popup lato client: l'install-prompt ha priorità; il popup
// "Di la tua" attende che l'install sia chiuso prima di mostrarsi.
let installOpen = false;
const closedListeners = new Set<() => void>();

export function setInstallOpen(v: boolean) {
  installOpen = v;
  if (!v) closedListeners.forEach((fn) => fn());
}

export function isInstallOpen() {
  return installOpen;
}

export function onInstallClosed(fn: () => void): () => void {
  closedListeners.add(fn);
  return () => closedListeners.delete(fn);
}
