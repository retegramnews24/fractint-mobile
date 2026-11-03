# Fractal Art Explorer 4.7 — Stable Edition

Release di consolidamento basata sulla versione **4.6.14**, non sulla vecchia e scartata 4.7. Interfaccia, menu laterale, galleria, colore ciclico, splash, fullscreen e mappa offscreen restano invariati.

## Ottimizzazioni e stabilità

- Il worker invia gruppi di righe completi, riducendo il numero di messaggi alla WebView Android senza sacrificare il feedback visivo.
- La correzione cromatica si applica **una sola volta** sul buffer progressivo, con i medesimi pixel del risultato finale.
- La famiglia Sierpiński partecipa ora al disegno a strati anziché mostrare tutto alla fine.
- Il canvas della rifinitura morbida viene riutilizzato per consolidare il frame, evitando una seconda grande allocazione ImageData.
- I frame già completi non vengono ricaricati interamente nel canvas della dissolvenza.
- Riutilizzo controllato della memoria del precedente fotogramma quando le dimensioni sono invariate.
- Miglior recupero da errore del worker, ripristino del contesto WebGL2 quando il dispositivo lo supporta.
- Quando la Mini App passa in background, viene sospesa la rifinitura automatica non ancora iniziata.
- Cache e riferimenti URL aggiornati per una distribuzione pulita su GitHub Pages / Telegram.

## Invariati

- 123 opere artistiche, 32 palette, 71 formule
- Zoom gestuale, precisione multipla Mandelbrot e Julia fino a 1024 bit
- Mappa offscreen durante zoom e spostamento, passaggi fullscreen stabili
- Modalità tutto schermo, ciclo colori con velocità, splash animato
- Nessuna funzione di screenshot, salvataggio o download di immagini

## Installazione

Caricare **tutti i file**, con le stesse cartelle (`js/`, `assets/`), nella root del repository GitHub Pages. Puntare Telegram all'`index.html` distribuito, poi chiudere completamente la Mini App e riaprirla dopo l'aggiornamento.

## Limiti delle verifiche

Test automatici di struttura, interfaccia con worker simulato e rendering CPU; la WebView Telegram Android/WebGL2 va verificata sul dispositivo reale.
