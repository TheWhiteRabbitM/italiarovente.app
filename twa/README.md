# Pubblicare Italia Rovente su Google Play (TWA)

Una **TWA** (Trusted Web Activity) impacchetta la PWA esistente in un vero pacchetto
Android (`.aab`) da caricare sul Play Store. L'app **carica il sito live**: non è una
copia, quindi ogni aggiornamento di contenuto è immediato senza pubblicare una nuova
versione dell'app.

## Cosa è già pronto (lato sito) — nulla da fare

- Web manifest completo: `id`, `scope`, `display: standalone`, icona **maskable**,
  categorie, 4 shortcuts → `src/app/manifest.ts`
- Endpoint Digital Asset Links che si popola da una variabile d'ambiente:
  `src/app/.well-known/assetlinks.json/route.ts`
- Service worker **versionato per build** → gli utenti dell'app non restano mai su
  contenuto in cache vecchio dopo un deploy.

## Prerequisiti (compiti TUOI — non automatizzabili)

1. **Account Google Play Developer** — 25 $ una tantum: https://play.google.com/console
2. Nessun Mac necessario. Serve solo Node (per Bubblewrap) **oppure** un browser (PWABuilder).

---

## Strada A — PWABuilder (la più veloce, zero tool locali)

1. Vai su **https://www.pwabuilder.com** e inserisci `https://italiarovente.app`
2. **Package For Stores → Android → Google Play**
3. Imposta **Package ID = `app.italiarovente.twa`** (DEVE combaciare con
   `ANDROID_APP_PACKAGE`, che di default è già questo valore)
4. Scarica lo zip: contiene
   - `*.aab` → il pacchetto da caricare su Play
   - `signing.keystore` + `signing-key-info.txt` → **conservali al sicuro**, servono per
     ogni futuro aggiornamento del guscio
   - il **SHA-256 fingerprint** (in `assetlinks.json` incluso nello zip)
5. Vai al passo **"Collegare il fingerprint"** qui sotto.

## Strada B — Bubblewrap (CLI, riproducibile da questa cartella)

Prerequisiti: Node 18+, JDK 17. Bubblewrap può scaricare l'Android SDK da solo.

```bash
npm i -g @bubblewrap/cli
cd twa
# La config è già in twa-manifest.json; init la legge e genera il progetto Android:
bubblewrap init --manifest https://italiarovente.app/manifest.webmanifest
bubblewrap build
```

Output: `app-release-signed.aab` (da caricare) e `android.keystore` (da conservare).
Estrai il fingerprint del tuo keystore di upload:

```bash
bubblewrap fingerprint
# in alternativa:
keytool -list -v -keystore android.keystore -alias italiarovente
```

---

## Collegare il fingerprint (IL passaggio che fa sbagliare tutti)

Senza questo, l'app si apre con la **barra dell'indirizzo di Chrome** visibile invece che
a schermo intero.

⚠️ Se usi **Play App Signing** (consigliato e ormai predefinito), Google **rifirma** l'app
con una **sua** chiave. Il fingerprint che conta per `assetlinks.json` è quello che trovi in:

> **Play Console → (la tua app) → Test and release → Setup → App integrity →
> App signing key certificate → SHA-256 certificate fingerprint**

Metti in `assetlinks.json` **sia** il fingerprint di *upload* (dal tuo keystore) **sia**
quello di *app signing* (da Play), così funziona sempre.

Su Vercel (Project → Settings → Environment Variables), imposta:

```
ANDROID_CERT_FINGERPRINT = AA:BB:..:FF, 11:22:..:99
#                          ^ app signing (Play)   ^ upload (keystore)
ANDROID_APP_PACKAGE       = app.italiarovente.twa   (già il default, opzionale)
```

Poi **redeploy** e verifica:

```bash
curl -s https://italiarovente.app/.well-known/assetlinks.json
# deve mostrare i fingerprint, non []
```

---

## Caricare su Play

1. Play Console → **Crea app** (italiano, gratuita)
2. **Test interno** → carica l'`.aab` → aggiungi il tuo indirizzo come tester
3. Installa dal link di test sul telefono → **l'app deve aprirsi SENZA barra URL** =
   TWA verificata ✔
4. Compila scheda Store (descrizione, screenshot, privacy policy → punta a `/disclaimer`),
   poi promuovi da test a **Produzione** e invia in revisione.

## Aggiornamenti — cosa richiede una nuova versione dell'app e cosa no

| Cambi | Nuova build `.aab`? |
|---|---|
| Dati, contenuti, nuove pagine, grafici | ❌ No — l'app carica il sito live |
| Nome app, icona, colori del guscio, permessi | ✅ Sì (incrementa `appVersionCode`) |

Il service worker è già versionato per build: dopo ogni deploy del sito, gli utenti
dell'app ricevono i contenuti freschi senza cache vecchia. Verifica dopo ogni deploy
importante con `curl -s https://italiarovente.app/ | grep -o 'sw.js?v=[^"]*'`.
