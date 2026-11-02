# Servizio download nativo Telegram — facoltativo, ma necessario per i PNG affidabili

Una pagina statica di GitHub Pages **non può** creare un URL HTTPS persistente per un Blob PNG generato dal browser. `Telegram.WebApp.downloadFile()` richiede tale URL (non accetta URL `blob:`). Questo Worker carica temporaneamente il PNG in Cloudflare R2 e fornisce il link HTTPS con `Content-Disposition: attachment`. Per inviare PNG a questo backend, la Mini App deve essere aperta dal **bot Telegram**: viene verificata la firma `initData` del bot.

## Setup una sola volta

1. Apri un account Cloudflare con R2 abilitato; installa Node.js sul PC.
2. Da questa cartella esegui `npx wrangler login`.
3. Crea il bucket: `npx wrangler r2 bucket create fractal-art-exports`.
4. In `wrangler.toml` sostituisci `YOUR_USERNAME` con il nome utente GitHub Pages (o imposta l'origine effettiva, per esempio `https://fractal.example.com`). **Non usare `*`.**
5. Imposta il token come **secret**, mai nel repository: `npx wrangler secret put TELEGRAM_BOT_TOKEN`. Inserisci il token del bot nella richiesta di Wrangler. Non condividerlo e non copiarlo in JS del sito.
6. Pubblica: `npx wrangler deploy`.
7. Prendi l'URL HTTPS restituito, ad esempio `https://fractal-art-download.account.workers.dev`, e scrivilo nel file **`js/download-config.js`** della Mini App come `window.FAE_DOWNLOAD_SERVICE = 'https://...workers.dev';`.
8. Carica i file della Mini App su GitHub Pages. Apri la Mini App **tramite il bot**, scegli PNG → qualità → Salva con Telegram → conferma il download nel popup.
9. In Cloudflare R2 configura una regola *Object Lifecycle* per cancellare gli oggetti nel prefisso `exports/` dopo 1 giorno. Anche prima della cancellazione fisica, il Worker rifiuta link più vecchi di 24 ore.

## Sicurezza e limiti

- Il token del bot si usa **soltanto** come secret del Worker. Il frontend invia `Telegram.WebApp.initData`, che viene verificato lato server con HMAC SHA-256 e scadenza 24h.
- La richiesta di caricamento è ammessa solo dall'origine GitHub indicata. Ciascun PNG ha un nome UUID difficilmente indovinabile. Il link di download è comunque **pubblico per 24 ore** a chi lo conosce; non usare per immagini riservate.
- Massimo 14 MB di PNG. Le risorse Cloudflare (R2 e Worker) possono comportare costi in base al piano e all'uso. Imposta i limiti di spesa desiderati.
- Telegram chiede sempre la conferma dell'utente. L'accettazione **non garantisce** il nome esatto della cartella Android, che è gestita da Telegram.
- Se non imposti il Worker, la Mini App continua a funzionare e prova la condivisione Android o il download del browser. Questi fallback non sono affidabili in tutte le WebView.

## Verifica

Il GET `/health` restituisce `{"ok":true}`. Dal browser in una Mini App aperta dal bot, la chiamata POST `/api/images` deve rispondere `201` con un `url` HTTPS. Quel link deve restituire il PNG con `Content-Disposition: attachment; filename="...png"`.

Fonti: https://core.telegram.org/bots/webapps , https://developers.cloudflare.com/r2/api/workers/workers-api-usage/ .
