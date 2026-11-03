# Fractal Art Explorer v4.6.8 — anteprima continua e sfumature

Basata **esclusivamente sulla v4.6.7 stabile** (non sulla v4.7).

## Novità
- **Mappa estesa in bassa risoluzione**: un secondo worker calcola la stessa formula su un campo 2,8× più largo. Durante zoom, pan e rotazione la mappa estesa viene riproiettata sotto il dettaglio dell’ultimo frame, evitando i bordi neri.
- Quando la mappa estesa non è ancora pronta, si usa temporaneamente un fondale sfumato derivato dall’ultimo fotogramma, mantenendo il frame dettagliato nitido nella sua area.
- Il calcolo approfondito usa ancora il worker originale, non blocca il touch e alla fine sostituisce l’anteprima. La mappa di riserva usa un solo lavoro alla volta e non accumula richieste durante i gesti rapidi.
- Saturazione e mezzi toni rifiniti con micro-dithering deterministico per ridurre le bande di colore. Materiali 3D con illuminazione leggermente più coerente con la palette, senza aumentare il numero di passi del ray marching.
- Cache aggiornata, nessun servizio esterno aggiunto.

## Conservato
123 opere, 32 palette, 71 formule, splash animato 5 s, fullscreen, gesture a due dita, zoom estremo e galleria. **Nessuna funzione screenshot o download**.

## Installazione
Carica integralmente il contenuto dello ZIP nel repository GitHub Pages mantenendo la struttura delle cartelle. Dopo la pubblicazione chiudi e riapri la Mini App Telegram per aggiornare la cache.

## Limiti
La mappa di riserva viene creata progressivamente; subito dopo la prima apertura o durante movimenti molto estesi possono esserci alcuni istanti di sfumatura temporanea. Con zoom di precisione arbitraria il worker riduce risoluzione e iterazioni per non saturare il telefono. L’anteprima 3D usa il renderer WebGL2 corrente e non il worker 2D. Il collaudo reale su Telegram Android va effettuato sul dispositivo.
