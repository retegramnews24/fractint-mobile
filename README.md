# Fractal Art Explorer — v4.6.6 Arte & Colori

Mini App Telegram statica, pronta per GitHub Pages. Basata sulla **v4.6.5** della famiglia v4.6, **non sulla v4.7**.

## Questa release
- **Rimossi definitivamente** pulsanti, pannelli, JavaScript e stili per PNG, download, condivisione, screenshot e servizi di trasferimento immagini.
- **32 palette** colori, con anteprime cromatiche visibili e pulsante **✦ COLORI** per cambiare atmosfera.
- **123 opere precaricate** (67 originali + 56 nuove composizioni). Ogni opera richiama una vera formula e salva inquadratura, palette e dettagli specifici.
- Mantenute le **71 formule** del catalogo, il motore CPU con worker, il WebGL2 3D, le gesture con due dita, il deep zoom, il fullscreen solo frattale e lo splash animato di cinque secondi.
- Le nuove palette funzionano sia nel renderer 2D sia nel renderer WebGL2 3D.

## Installazione
Estrai lo ZIP e carica **tutti** i file, incluso `js/palettes.js`, nella root del repository servito da GitHub Pages (`index.html` nella root). Il service worker usa una nuova chiave cache: ricarica o chiudi e riapri la Mini App dopo la pubblicazione.

## Funzioni principali
Scorri i colori sotto la tela; tocca un'opera dalla collezione. Trascina per spostare; usa due dita per zoom e rotazione, ⛶ per la vista immersiva, ↺ per ripristinare l'inquadratura, ✧ per un'opera casuale e ✦ COLORI per una nuova palette. Nessuna funzione di esportazione o cattura.

## Note tecniche
L'app resta **completamente nel browser interno Telegram**. Il fullscreen riguarda il contenuto HTML della Mini App; eventuali pulsanti nativi sovrapposti di Telegram non sono controllabili dal codice della pagina.

## v4.6.7 — correzione avvio Telegram
- Motor 3D inizializzato su richiesta, non allo splash.
- Anteprima leggera di recupero se il worker grafico fallisce.
- Splash originale mantenuto a cinque secondi con fallback CPU alleggerito.
- Script con versione e cache network-first: evita file mischiati di release diverse.
- Rimangono 71 formule, 123 opere e 32 palette; nessuna funzione di salvataggio o screenshot.
- Dopo la pubblicazione, chiudi e riapri la Mini App. Se Telegram mostra ancora file vecchi, svuota la sua cache delle pagine Web.
