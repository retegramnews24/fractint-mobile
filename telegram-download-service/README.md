# Attivazione invio PNG direttamente alla chat del bot

Questa versione non richiede R2, archivi né URL Blob. Quando premi **Salva PNG** l'app crea il file e lo invia automaticamente nella chat del bot. Se la consegna non riesce, appare il tasto per riprovare. Il server autentica l'utente tramite `Telegram.WebApp.initData` (HMAC SHA-256) e usa `sendDocument`: il PNG originale appare nella chat privata del bot, dove l'utente può scaricarlo sul telefono.

## Configurazione una sola volta

1. Accedi a Cloudflare e installa Node.js sul tuo PC. Apri il terminale nella cartella `telegram-download-service`.
2. Cambia `ALLOWED_ORIGIN` in `wrangler.toml` con il dominio ESATTO GitHub Pages: se il sito è `https://utente.github.io/repo/`, l'origine è `https://utente.github.io`. Se usi dominio personalizzato, inseriscilo qui.
3. Facoltativo: imposta `BOT_USERNAME` (senza @) per abilitare il tasto che apre la chat dopo l'invio.
4. Esegui `npx wrangler login`.
5. Esegui `npx wrangler secret put TELEGRAM_BOT_TOKEN` e inserisci il token **solo** nel terminale di Cloudflare, mai nella Mini App o in GitHub.
6. Esegui `npx wrangler deploy`. Copia il dominio HTTPS pubblicato, ad esempio `https://fractal-art-send.account.workers.dev`.
7. Modifica `js/download-config.js` dell'app: `window.FAE_DOWNLOAD_SERVICE = 'https://fractal-art-send.account.workers.dev';` (con l'URL vero). Carica la Mini App aggiornata su GitHub Pages.
8. In Telegram apri la chat del tuo bot e premi `/start`. Apri quindi la Mini App tramite il bot. Scegli un frattale, premi **Salva PNG** e attendi il rendering e l’invio. Il PNG originale arriverà automaticamente come *documento* nella chat del bot. Se compare un errore, usa il pulsante per riprovare.

## Cosa succede senza il servizio

La Mini App mostra chiaramente che il salvataggio via Telegram non è configurato. In un browser ordinario si può scaricare un PNG con link locale; alcune versioni di Telegram Android non consentono il download di `blob:` né `window.open(blob:)`. Non c'è una soluzione affidabile in GitHub Pages statico che possa aggirare questa limitazione. Usa lo screenshot Android finché il servizio non è attivo.

## Sicurezza

- Nessun token nel repository. Il server riceve il token come segreto Cloudflare.
- Il destinatario del file è esclusivamente l'ID utente contenuto in `initData` autenticato, non un ID passato dal browser.
- Firma verificata e scadenza `auth_date` 1 ora, CORS legato all'origine specifica, PNG verificato con magic bytes, file massimo 14 MB.
- Se la sessione è scaduta chiudi e riapri la Mini App.
- È necessario che l'utente abbia avviato la chat con `/start` per permettere al bot di inviare messaggi.
- Il file passa attraverso Cloudflare verso Telegram, senza archivio intermedio.
- Consigliato configurare Cloudflare Rate Limiting in produzione se l'app diventa pubblica.

## API del servizio

`GET /health` restituisce lo stato. `POST /api/send` richiede `Content-Type: image/png`, `X-Telegram-Init-Data` e `X-File-Name` ed invia il documento al bot chat dell'utente autenticato. Non accetta token inviati dal frontend.

Fonti: https://core.telegram.org/bots/webapps ; https://core.telegram.org/bots/api#senddocument
