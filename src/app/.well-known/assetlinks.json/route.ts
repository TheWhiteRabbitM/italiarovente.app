// Digital Asset Links: prova che l'app Android (una TWA, Trusted Web Activity)
// e questo dominio appartengono allo stesso proprietario. Senza questo file
// verificato, la TWA aprirebbe il sito con la barra dell'indirizzo di Chrome
// visibile, invece che a schermo intero come un'app.
//
// L'impronta SHA-256 arriva dal keystore con cui FIRMI l'APK (quello che genera
// Bubblewrap, oppure la chiave di firma gestita dal Play Store): non esiste
// finché non crei l'app. Perciò qui è letta da una variabile d'ambiente e non
// hardcodata — quando avrai l'impronta, la imposti su Vercel e questo endpoint
// si popola da solo, senza toccare il codice:
//
//   ANDROID_CERT_FINGERPRINT="AA:BB:CC:..:FF"   (una o più, separate da virgola)
//
// Finché la variabile è assente, l'endpoint restituisce [] — JSON valido che
// significa "nessuna app Android ancora associata", non un errore.
//
// Il package name atteso è app.italiarovente.twa (usalo in Bubblewrap); se ne
// scegli un altro, aggiorna ANDROID_APP_PACKAGE.

export const dynamic = "force-static";
export const revalidate = 3600;

const PACKAGE = process.env.ANDROID_APP_PACKAGE ?? "app.italiarovente.twa";

export function GET() {
  const raw = process.env.ANDROID_CERT_FINGERPRINT ?? "";
  const fingerprints = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const body =
    fingerprints.length > 0
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: PACKAGE,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [];

  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
