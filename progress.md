Original prompt: crea una sezione simulatore , in cui c'è un gioco gestionale semplice e interattivo con un magazzino da gestire

Implementazione: gestionale a turni separato dall'editor, con inventario, ordini, rifornimenti, capacità, budget e obiettivo di cinque spedizioni in 24 unità di tempo. La scena usa un canvas isometrico leggero; controlli accessibili in HTML. Verifica del motore con node:test e del browser attraverso il browser controllato disponibile nella sessione.

Verifica completata: 31 test superati e build riuscita. Browser locale: avvio, preparazione, spedizione con incasso, pausa/ripresa, conferma nuova partita, reset e istruzioni verificati; nessun errore console. Screenshot qa-simulator.png. Verifica UI tramite CUA, in conformità alle istruzioni del browser; client Playwright esterno non eseguito. Partita in memoria, visuale isometrica 2D separata dal configuratore 3D.
