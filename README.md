# Fractal Art Explorer v4.6.13 — Base progressiva sempre visibile

Questa build corregge il comportamento del rendering finale.

## Correzione principale

Durante un nuovo render, l'immagine precedente **non sparisce più**:

- la vista precedente viene usata come **base visibile**;
- il nuovo render la **sostituisce progressivamente**, a strati, dall'alto verso il basso;
- la qualità quindi **migliora man mano**, invece di lasciare vuoti o far scomparire tutto sotto.

## In pratica

Quando cambi opera, palette, dettaglio o fai un render finale / HD:
- vedi subito la vecchia immagine ricampionata come base;
- il nuovo risultato si deposita sopra a chunk progressivi;
- a fine render, la nuova immagine completa diventa la nuova base.

## Aggiornamento

Sostituisci tutti i file sul repository GitHub Pages mantenendo la stessa struttura. Poi chiudi completamente Telegram e riapri la Mini App.
