Original prompt: crea una sezione simulatore , in cui c'è un gioco gestionale semplice e interattivo con un magazzino da gestire

Implementazione: gestionale a turni separato dall'editor, con inventario, ordini, rifornimenti, capacità, budget e obiettivo di cinque spedizioni in 24 unità di tempo. La scena usa un canvas isometrico leggero; controlli accessibili in HTML. Verifica del motore con node:test e del browser attraverso il browser controllato disponibile nella sessione.

Verifica completata: 31 test superati e build riuscita. Browser locale: avvio, preparazione, spedizione con incasso, pausa/ripresa, conferma nuova partita, reset e istruzioni verificati; nessun errore console. Screenshot qa-simulator.png. Verifica UI tramite CUA, in conformità alle istruzioni del browser; client Playwright esterno non eseguito. Partita in memoria, visuale isometrica 2D separata dal configuratore 3D.

Aggiornamento grafico: sostituito canvas isometrico con WarehouseScene condivisa, scorte e pallet preparati collegati alla partita, scaffale e operatore aggiunti dopo investimento. Loader illustrato in editor e simulatore. Guida contestuale Prossima mossa. Verificati nel browser caricamento, preparazione e spedizione (1/5, 160 €, 4/12 posti), nessun errore console. 31 test superati e build riuscita.

Simulatore centrato sulle merci: rimossi denaro e incassi dal motore e dalla UI; conteggio unità consegnate, risorse attivabili con tempo. Guida azionabile con motivo e durata, pulsanti numerati e conseguenze per ogni ordine. 32 test superati; browser verificato fino a 1 spedizione/2 unità/4 posti occupati, nessun errore console.

Vista HUD: scena estesa a tutta finestra, camera ravvicinata, indicatori e comandi sovrapposti, pannelli con scroll interno e comando Nascondi/Mostra. Verificati preparazione ordine, toggle pannelli, screenshot e console priva di errori. Build superata.

Creazione da zero: ingresso home, modulo pianta rettangolare, nome progetto, bozza separata e ripresa dalla home, salvataggio esplicito ed export nominato. 33 test e build superati. Browser: creata pianta 30x24, aggiunta scaffalatura, JSON scaricato e letto, reload conserva 1 oggetto in Pianta 2D; nessun errore console.


## 2026-10-08 — Homepage didattica
- Struttura breve coerente con Exhibition Lab: hero, spiegazione didattica, tre attività e footer.
- Nuova immagine illustrativa in aula generata con image_gen, compressa WebP; due viste animate reali del laboratorio conservate.
- Collegamenti a pianta vuota, scelta template e simulatore; accesso template apre il dialogo dopo il caricamento senza sostituire il progetto.
- Build e 33 test passati; controllo browser desktop/mobile, immagini e menu.
