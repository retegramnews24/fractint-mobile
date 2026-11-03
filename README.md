# Fractal Art Explorer 4.6.5 — solo Telegram

Basato sulla versione 4.6.3 (e sulla famiglia 4.6), **non sulla 4.7 o sulla variante browser esterno**.
Mantiene splash, 71 forme, 67 composizioni e i controlli dei frattali.

## Immagine pulita senza uscire dalla Mini App

- Tocca **⇧ PNG** nella barra sotto l’immagine.
- Scegli Normale, HD o Ultra e tocca **Prepara immagine**.
- Se la WebView Android lo supporta, compare **Condividi / Salva su Android**. Il pulsante apre il pannello nativo Android con un `File` PNG preparato in memoria; scegli Telegram, Files o un’app che offra Salva.
- Se il pannello non è supportato, l’app mostra solo le opzioni realmente disponibili (Copia immagine se permessa, e anteprima). **Il salvataggio non è garantito** su tutte le versioni di Telegram Android.
- Nessun browser esterno, account Cloudflare, servizio privato, invio dati o token del bot.

## Screenshot Android

Il tasto **📷 FOTO** resta disponibile. Telegram può mantenere i pulsanti nativi `×`, `⋮` e la freccia sopra la Mini App anche in modalità fullscreen. **Non esiste un'API Telegram per nasconderli completamente**; lo screenshot di sistema li può includere. Per eliminarli dallo screenshot occorre ritagliare dalla Galleria, o usare il flusso PNG qui sopra se supportato.

## Installazione

Estrai lo ZIP e copia nella root di GitHub Pages tutti i file (inclusi JS e service worker). Riavvia la Mini App dopo il deployment. Il service worker ha nome cache nuovo.
