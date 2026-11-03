# Fractal Art Explorer v4.6.9 — Mappa stabile + preview ad alta definizione

Basata sulla versione **4.6.8**; non contiene modifiche della v4.7.

## Correzioni

- Fullscreen ↔ normale: un solo sistema di coordinate lega la scala alle dimensioni effettive dell’area, inclusi i passaggi intermedi della WebView Telegram. Centro e rotazione rimangono invariati.
- Il vecchio canvas non viene più stirato mentre si passa da un rapporto larghezza/altezza all’altro. La vecchia immagine rimane visibile attraverso una riproiezione uniforme finché il nuovo render non è pronto.
- Anteprima offscreen più dettagliata: da circa 205 pixel sul lato maggiore a 390–540 (230–315 nel deep zoom) secondo la memoria/CPU disponibili. Copertura fino a 2,55 volte l’area di riferimento, mantenendo la navigazione responsiva grazie a un worker secondario.
- Sfumatura di riserva senza deformazione: usa scala uniforme e ritaglio centrale, mai stretching non proporzionale.
- La GPU 3D adegua il rapporto del shader all’altezza effettiva del canvas per preservare la scala durante i ridimensionamenti.
- Cache aggiornata alla v4.6.9.

## Restano invariati
123 opere, 32 palette, 71 formule, splash animato 5 s, interfaccia, pinch, rotazione con due dita, deep zoom. Nessun download o screenshot.

## Installazione
Estrarre l’archivio nella radice del repository GitHub Pages, mantenendo `js/` e `assets/`. Sostituire tutti i file. Chiudere completamente e riaprire la Mini App Telegram, affinché la nuova versione della cache venga caricata.

## Limiti
La vera qualità del rendering dipende dal telefono e dalla GPU/WebView. L’anteprima offscreen è intenzionalmente più piccola del render definitivo per non bloccare la navigazione. Le correzioni sono verificabili in un browser di prova, ma un collaudo finale dentro Telegram Android rimane necessario.
