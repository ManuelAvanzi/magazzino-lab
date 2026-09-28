# Magazzino Lab

Configuratore didattico 3D locale per discutere layout, logistica e interferenze di un magazzino. Ispirato al flusso dell'editor del configuratore mostre, con progetto e dati indipendenti.

## Studio 02 — Nuova scena industriale

- Capannone con pannelli di facciata, pilastri, finestre alte, tre portoni sezionali, protezioni, travature, corpi illuminanti e impianti rappresentati.
- Scaffalature con controventi, montanti forati, protezioni alla base, travi e cartelli di ubicazione.
- Pallet a doghe, colli con etichette e reggette, casse riutilizzabili e fusti; carrello elevatore con cabina, sedile, volante, ruote, montante e forche.
- Materiali PBR locali ambientCG per cemento e legno, illuminazione ambientale, ombre, occlusione ambientale e antialiasing finale.
- Panoramica in sezione, vista interna orbitale e vista dall'alto. La copertura e le pareti anteriori sono visibili nella vista interna.
- Interfaccia scura, anteprime del catalogo renderizzate dagli stessi modelli, pannelli richiudibili, area 3D espandibile e catalogo accessibile da pulsante su mobile.
- Esempio completo da 36 × 32 metri, con 30 scaffalature, 180 posti pallet teorici e nessuna interferenza rilevata dal modello.

Il pulsante **Carica magazzino completo** sostituisce la scena in modo annullabile. I vecchi progetti rimangono compatibili e vengono riaperti normalmente. Le proprietà degli elementi si confermano con **Applica proprietà**.

Il renderer raggruppa le geometrie per materiale. Quando l'animazione è in pausa aggiorna l'immagine solo quando cambiano camera, scena o texture. Durante l'orbita continua a renderizzare per mantenere lo smorzamento dei movimenti.

## Movimento e illuminazione

- **Pausa / Avvia** controlla un'animazione dimostrativa dei carrelli compatibili con le corsie. Partono dalla posizione di progetto e percorrono avanti/indietro un tratto rettilineo, rallentando alle estremità. Ruote, lampeggiante e faro seguono il mezzo.
- I percorsi sono ricavati dalle zone `Corsia mezzi`: rispettano l'ingombro del carrello, il perimetro e gli ostacoli statici, compresi percorsi pedonali e zone uscita. I percorsi animati che si sovrapporrebbero sono esclusi; al massimo quattro mezzi vengono animati. Carrelli fuori corsia o privi di spazio restano fermi.
- La pausa conserva la posizione visiva corrente; la selezione, la modifica, l'analisi e la pianta arrestano l'animazione e ripristinano le posizioni salvate. Il movimento non modifica JSON, salvataggi o indicatori geometrici del layout.
- L'animazione è sospesa quando la pagina non è visibile. Con la preferenza di sistema `prefers-reduced-motion` parte in pausa.
- Il selettore **Illuminazione** offre luce diurna, tardo pomeriggio e turno serale: luce direzionale, proiezioni dalle finestre, sorgenti a soffitto, emissione delle plafoniere e alone luminoso moderato. Sono effetti visivi, non un calcolo illuminotecnico né misure in lux.

## Avvio

Con Node.js installato, eseguire `npm run dev` e aprire http://localhost:5184. Non richiede installazione di dipendenze o Internet: Three.js 0.180.0 e OrbitControls sono inclusi in vendor con licenza MIT.

## Funzioni

- Ambiente dimensionabile da 16 a 60 metri per lato, vista 3D orbitale e vista dall'alto.
- Catalogo di scaffali, pallet, carrello, banco e zone funzionali.
- Selezione nella scena, posizione numerica, dimensioni orizzontali, rotazione a 90°, duplicazione, rimozione e annullamento (40 operazioni).
- Salvataggio sul dispositivo e importazione/esportazione JSON con validazione.
- Verifica degli ingombri fuori perimetro, sovrapposizioni, ostacoli su zone di transito/uscita, intersezioni pedoni-mezzi.
- Esercizio con tre criticità e spiegazioni didattiche. Il caricamento dello scenario è annullabile.

## Limiti del prototipo

Controlli geometrici semplificati, non normativi. Non vengono valutati portate, dimensionamento delle corsie per uno specifico mezzo, antincendio o continuità dei percorsi di esodo. La struttura del capannone e le attrezzature fisse di facciata sono scenografia e non rientrano nel catalogo selezionabile o nell'analisi degli ingombri. L'area uscita è una zona didattica e non è collegata automaticamente alla porta di facciata. L'animazione dei carrelli non simula produttività, dinamica di guida, missioni di picking o precedenze. La vista interna è orbitale: non sono presenti camminata con collisioni o valutazione automatica degli apprendimenti.

I posti pallet sono teorici: 6 per scaffale (2 per livello, 3 livelli), indipendenti dalle dimensioni modificate. L'impronta stoccaggio è la somma delle superfici nominali degli scaffali; eventuali sovrapposizioni vengono sommate. Le altezze sono fisse per tipologia; la pianta è una vista prospettica dall'alto. Le modifiche si fanno tramite coordinate, senza trascinamento degli oggetti.

`npm test` esegue nove controlli del modello, inclusi percorsi animati, ostacoli e separazione fra carrelli. Materiali e licenze sono documentati in `assets/CREDITS.md`; Three.js e i suoi addon sono distribuiti con licenza MIT in `vendor/THREE-LICENSE.txt`.
