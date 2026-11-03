# Fractal Art Explorer v4.6.12 — Interfaccia artistica fluida

Questa versione parte dalla **4.6.11** e aggiunge rifiniture estetiche e di esperienza d’uso, senza toccare il catalogo o le funzioni principali.

## Novità

- **Interfaccia cromatica variabile** a ogni avvio, con accenti dinamici armonizzati con la palette scelta.
- **Barra di rendering in basso**, a tutta larghezza, anche in modalità immersiva / fullscreen.
- **Rendering progressivo visibile**: durante il render 2D e deep zoom l’immagine compare a strati/chunk invece di apparire tutta insieme.
- **Anteprima offscreen sfumata** durante la ricostruzione, così il passaggio tra vecchia e nuova immagine risulta più morbido.
- **Cache aggiornata** per forzare meglio il refresh su GitHub Pages e Telegram Mini App.

## Note

Il rendering progressivo a chunk è attivo sui render 2D principali e sul deep zoom CPU. Alcune famiglie molto leggere o speciali possono ancora completarsi quasi in un solo passaggio, perché il loro calcolo è già molto rapido.

## Aggiornamento

Sostituisci tutti i file del repository GitHub Pages mantenendo la struttura (`index.html`, `js/`, `assets/`). Poi chiudi completamente e riapri la Mini App Telegram.
