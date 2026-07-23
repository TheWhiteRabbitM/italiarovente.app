<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Italia Rovente — istruzioni di progetto

Leggi questo file prima di toccare il codice. Contiene ciò che NON si deduce
leggendo i sorgenti: la regola editoriale, le convenzioni, il flusso di
pubblicazione e le trappole già pagate.

## Cos'è

**italiarovente.app** — sito che mostra come sono cambiate le temperature di
**107 città italiane dal 1940**, su dati della rianalisi **ERA5 (ECMWF /
Copernicus)** via Open-Meteo. Bilingue IT/EN. PWA installabile, con un'app
Android (TWA) che carica il sito live.

Il claim del sito è **«i dati, non le opinioni»**: non è uno slogan, è il
vincolo di progetto più importante. Vedi "La regola d'oro".

## ⚠️ La regola d'oro: mai un numero inventato

Ogni cifra pubblicata deve venire da un dato misurato o da un calcolo
dichiarato. In caso di dubbio si **omette**, non si stima.

Conseguenze pratiche, tutte già applicate e da mantenere:

- **Metodo «a due trentenni»**: il riscaldamento è sempre `normale 1991-2020
  meno normale 1961-1990`. Mai «un anno caldo recente contro il passato», che
  sarebbe più rumoroso e meno onesto. Vale ovunque: verdetto, classifiche,
  poster, push, API.
- **Niente changepoint inventati**: la linea del tempo (`ClimateTimeline`)
  mostra solo eventi reali e datati. Un «cambio di trend» richiederebbe
  un'analisi dedicata: senza quella, sarebbe un dato fabbricato.
- **Copertura dichiarata**: se una statistica poggia su 6 città su 12 (es.
  l'afa estiva), la pagina lo dice. Mai far sembrare completo ciò che non lo è.
- **Incertezza mostrata**: la tendenza per decennio esce con l'intervallo di
  confidenza al 95% e l'R². Un R² basso non si nasconde, si spiega.
- **Record solo su dati consolidati**: ERA5 arriva con ~5 giorni di ritardo e i
  valori recenti sono preliminari. C'è un `recordCutoff`: nessun record
  dichiarato su dati provvisori.
- **Anni parziali esclusi**: gli aggregati annui usano solo anni con
  `count >= 360` giorni. L'anno in corso non entra in stripes, classifiche,
  anni estremi.
- **Il chatbot non inventa**: `/api/ask` ha un «contratto di verità» nel system
  prompt (ogni numero deve venire da un tool) e un elenco esplicito di dati che
  NON esistono (previsioni, umidità, stazioni meteo…). Non allentarlo.

Quando l'utente propone una feature che richiederebbe di stimare o abbellire un
dato: dillo chiaro e proponi l'alternativa onesta.

## Architettura

- **Next.js 16 App Router**, React 19, TypeScript, **Tailwind v4**, Recharts.
- **Rendering**: Server Components di default. I client component sono pochi e
  mirati (toggle, widget interattivi, download). I dati storici sono
  **precalcolati al build**, non fetchati a runtime.
- **Dato di record**: `src/data/history.json` — snapshot generato da
  `scripts/fetch-history.mjs`, con `_meta` (fonte, data, commit, SHA-256).
  Le pagine leggono quello via `src/lib/weather.ts`.
- **Design**: Material 3 Expressive, tema in `globals.css`, dark mode, palette
  termica. Classi ricorrenti: `m3-card`, `m3-chip`, `rise`.

### i18n — la convenzione da rispettare

- **L'italiano è canonico e senza prefisso** (`/citta/roma`), l'inglese vive
  sotto `/en/...` come **wrapper sottile**.
- Il contenuto sta in una funzione condivisa `XxxPageContent({ lang })`; la
  rotta `/en/xxx/page.tsx` la importa e passa `lang="en"`, aggiungendo solo i
  propri `metadata`.
- Le stringhe stanno in un oggetto locale `const STR = { it: {...}, en: {...} }`
  e si accede con `const t = STR[lang]`. **Non introdurre librerie i18n.**
- Ogni pagina dichiara `alternates: { canonical, languages }`. Vedi la trappola
  del canonical più sotto.

### Temperature e unità

Usa il componente `<Temp value digits delta locale showUnit />`, mai
`toFixed()` a mano. Il flag **`delta`** è cruciale:

- valore assoluto → `°F = °C × 9/5 + 32`
- **differenza/anomalia/tendenza** → `Δ°F = Δ°C × 9/5`, **senza** offset

Sbagliare `delta` produce numeri assurdi (+1,5°C che diventa +34,7°F).

## Flusso di lavoro

### Verifica prima di dichiarare fatto

- `npx tsc --noEmit` e `npx eslint <file toccati>` sempre.
- `npm test` (test Node runner su aggregazione e mari).
- Se il cambiamento si vede nel browser, **guardalo davvero** (preview_start →
  naviga → leggi il DOM/screenshot). Non fidarti del "dovrebbe funzionare".

### Pubblicazione (attenzione: due passi distinti)

1. **GitHub** — la cartella locale **NON è un repo git**. Il remoto è
   `github.com/TheWhiteRabbitM/italiarovente.app`. Per pubblicare si usa un
   clone separato: `git fetch && reset --hard origin/main`, si svuota il clone
   (tranne `.git`), si copia il progetto con `tar` **escludendo**
   `node_modules .next .vercel .claude .env.local .env tsconfig.tsbuildinfo next-env.d.ts`,
   poi `add -A`, commit, push.
2. **Vercel** — `vercel --prod --yes` dalla cartella locale (carica i file
   locali, non parte da GitHub). Sono due azioni separate: **pushare non
   deploya**.

**Chiedi sempre conferma all'utente prima di un deploy in produzione.**

### ⚠️ Verifica il deploy dal contenuto live, non dalle notifiche

Le notifiche di fine task **mentono**: è capitato più volte che un deploy
segnato «failed exit code 4» fosse in realtà riuscito (log troncato al
teardown). Dopo ogni deploy: `curl` sull'URL e cerca la stringa nuova.
Controlla `Age:` e `X-Vercel-Cache`: un `Age` alto significa che stai leggendo
la **cache CDN della versione precedente**, non il deploy nuovo.

## Trappole già pagate (non ripeterle)

- **Build command su Vercel**: è fissato **dal pannello Vercel**, non letto da
  `package.json`. Tutto ciò che deve girare al build va agganciato dentro
  `scripts/fetch-history.mjs`, che sappiamo essere sempre eseguito.
- **Canonical ereditato**: i metadata dei segmenti si fondono in modo
  **shallow**. Un `alternates` nel layout veniva ereditato da ogni pagina priva
  del proprio, facendole dichiarare duplicati della home (segnalato da Search
  Console). Il layout **non deve** dichiarare `alternates`; ogni pagina dichiara
  il suo, **anche nei rami di fallback** di `generateMetadata`.
- **Service worker e cache**: `public/sw.js` versiona la cache per build
  (`?v=<build>`). Se il DOM contraddice l'HTML servito, sospetta il service
  worker prima del codice.
- **Rate limit Open-Meteo Archive**: la richiesta 1940→oggi pesa molto. In
  locale l'IP è spesso già esaurito (429): lo snapshot si completa sui build
  Vercel, in modo incrementale (`FETCH_BUDGET_MS`, flag `needs*`).
- **Regola eslint `set-state-in-effect`**: ci sono errori **preesistenti**
  tollerati dal build. Non aggiungerne di nuovi (usa init lazy di `useState`),
  ma non è obbligatorio rifattorizzare i vecchi.
- **Embed ad altezza fissa**: gli host incorporano `/embed/[slug]` in un iframe
  con altezza fissa. Qualsiasi modifica lì deve mantenere **una sola riga** di
  footer a ogni larghezza, o il contenuto viene tagliato.

## Env vars (Vercel)

| Variabile | A cosa serve |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` (o `KV_REST_API_*`) | Redis: voti, visite, iscrizioni push, registro eventi |
| `BLOB_READ_WRITE_TOKEN` | Fallback storage se Redis assente |
| `MISTRAL_API_KEY` | Chatbot «Chiedi al clima» (API Mistral diretta, non gateway) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Notifiche push |
| `CRON_SECRET` | Protegge `/api/refresh` |
| `ANDROID_CERT_FINGERPRINT` / `ANDROID_APP_PACKAGE` | Digital Asset Links per la TWA |
| `FETCH_BUDGET_MS` | Budget del fetch storico al build |

## Cron

Uno solo: `vercel.json` → `/api/refresh` alle **05:30 UTC**. Fa tutto: record
battuti (caldo e freddo), ondate di calore in arrivo, recap mensile il giorno 1,
snapshot statistiche. Le notifiche sono **per città** per chi segue una città
(vedi `notifyGrouped` in `src/lib/push.ts`), nazionali per gli altri.

## Debiti noti (aperti)

- **Virgole decimali**: `fmtTemp` è locale-aware ma quasi tutte le pagine IT
  passano ancora il default e mostrano il punto (`14.2°`) invece della virgola.
  Sistemato solo su `/mese`. Serve uno sweep.
- **Afa estiva**: `summerApparent` esiste solo per le città `main` e al momento
  ne copre una parte; cresce a ogni build. Le pagine dichiarano la copertura.
- **OpenTimestamps**: le prove nascono *pending*; vanno completate con
  `node scripts/timestamp.mjs --upgrade` qualche ora dopo, poi committate.

## Come lavorare bene con questo utente

- Parla **italiano**.
- **Onestà prima di tutto**: se una richiesta si basa su una premessa sbagliata
  (dati errati, feature già esistente, strategia obsoleta), dillo con garbo e
  spiega perché — è esattamente ciò che si aspetta. Ha apprezzato ripetutamente
  il distinguere «già fatto» / «valido» / «sbagliato».
- **Verifica e mostra le prove**: numeri, output di curl, screenshot. Niente
  «fatto» senza riscontro.
- **Mai deployare in produzione senza conferma esplicita.**
- Quando incolla strategie o prompt generati da altre AI, **valutali
  criticamente**: spesso contengono cose già implementate o tecniche superate.
