# Fractal Art Explorer v4.6.11 — Dettaglio progressivo e GPU migliorata

Base: **v4.6.10 (stabile)**. Stessa interfaccia, 123 opere, 32 palette, 71 formule, ciclo cromatico, zoom/pan, rotazione e fullscreen. Nessun pulsante di screenshot o download.

## Motore a tre livelli

1. **Durante il gesto:** l'anteprima estesa offscreen riproietta l'immagine precedente e riempie i bordi, senza zone nere.
2. **Rendering normale:** il worker CPU (o WebGL2 nel 3D) calcola rapidamente l'inquadratura corrente. La tela precedente non viene cancellata in attesa del nuovo risultato.
3. **Rifinitura automatica:** dopo circa 0,72 secondi dal completamento del rendering normale, se la vista è rimasta ferma, parte un secondo render a densità di pixel maggiore, con iterazioni adattive allo zoom nei frattali di fuga. Durante questo passaggio la tela rimane navigabile; un nuovo gesto annulla l'elaborazione precedente.

**Supercampionamento:** i frattali 2D vengono calcolati su una bitmap con più pixel dello spazio CSS, poi ridotti dal compositore del browser, migliorando i bordi senza aggiungere una costosa media di campioni per pixel. Budget mobile adattivo di circa 4 MP per la rifinitura automatica e fino a circa 7,2 MP per il comando manuale, prima delle riduzioni per dispositivi meno potenti.

**Zoom profondo:** rimane il calcolo numerico `BigInt` con 128/256/512/1024 bit per Mandelbrot e Julia. Aumentati i limiti pratici del dettaglio post-movimento e resa adattiva delle iterazioni; il limite effettivo resta vincolato dalle risorse del telefono. Le altre famiglie non sono diventate arbitrariamente multiprecisione.

**3D:** secondo passaggio WebGL2 a densità adattiva, distanze/normal più precise e occlusione ambientale leggera sui dettagli fermi; passaggio rapido durante il movimento. Non viene forzato un render pesante mentre stai ruotando.

## Pubblicazione

Sostituire **tutti** i file del repository GitHub Pages, mantenendo la struttura (`index.html`, `js/`, `assets/`). La cache offline diventa `fae-v4-6-11-progressive-hd`; chiudere completamente e riaprire la Mini App Telegram dopo l'aggiornamento. Conservare il precedente ZIP v4.6.10 come backup.

## Limiti e test

In Android il renderer HQ può richiedere alcuni secondi, soprattutto con `BigInt` ad alte precisioni e su frattali particolarmente complessi. Per evitare rallentamenti il dettaglio aumenta solo a vista ferma ed è annullabile. Lo zoom delle geometrie e l'accuratezza 3D hanno limiti diversi dalla precisione multipla di Mandelbrot/Julia. Il fullscreen deve ancora essere confermato su un dispositivo Telegram Android reale.

---

# Fractal Art Explorer v4.6.10 — Ciclo cromatico

Questa release usa la **v4.6.9 stabile** come base, senza modificare i suoi algoritmi di zoom, trascinamento, proiezione fullscreen o anteprima offscreen.

### Nuovo comando

Nella barra delle palette trovi **↻ CICLA** e un selettore velocità. Premi ↻ per avviare il ciclo continuo e Ⅱ per metterlo in pausa; il colore resta fermo dove lo hai lasciato. Le velocità sono ½× (un giro in 72 secondi), 1× (36 s), 2× (18 s) e 4× (9 s). I colori cambiano in modo continuo tramite filtro di composizione GPU, non rilanciando i calcoli del frattale. Funziona anche con zoom, pan, anteprima offscreen, opere 2D e 3D e nella modalità tutto schermo.

### Installazione

Carica **tutti** i file nella root di GitHub Pages, sostituendo i precedenti. La service worker cache ora è `fae-v4-6-10-color-cycle` per evitare file mescolati tra versioni. Non servono bot token, server, o servizi esterni.

### Limiti

Il ciclo cromatico è una trasformazione cromatica fluida dell'immagine già calcolata, distinta dallo scorrimento attraverso le 32 palette; queste rimangono comunque selezionabili manualmente. La visualizzazione WebGL2 dipende dalla disponibilità della GPU Android.

---

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
