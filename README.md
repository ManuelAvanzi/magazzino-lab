# Warehouse Lab

## Versione attuale — 0.2

Homepage con rendering del laboratorio, editor 3D e pianta modificabile, magazzino da 48 × 40 m, operatori animati e percorso didattico delle merci in sette fasi.

Repository: https://github.com/ManuelAvanzi/magazzino-lab

### Pubblicazione

Sito: https://magazzino-lab.vercel.app — editor: https://magazzino-lab.vercel.app/studio.html?session=demo

Il progetto Vercel `magazzino-lab` è collegato alla repository GitHub. Gli aggiornamenti su `main` attivano la pubblicazione; i deploy di prova successivi possono essere creati con `npx vercel deploy`. Il primo deploy è stato completato il 5 ottobre 2026.

`npm test` verifica il modello; `npm run build` prepara il sito statico in `dist/`, escludendo test, screenshot e appunti. `vercel.json` configura la pubblicazione con test obbligatori prima della build. Il progetto non richiede un server applicativo in produzione. I salvataggi rimangono nel browser: per trasferirli da localhost alla versione online usare Esporta progetto e Apri.

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

I posti pallet sono teorici: 6 per scaffale (2 per livello, 3 livelli), indipendenti dalle dimensioni modificate. L'impronta stoccaggio è la somma delle superfici nominali degli scaffali; eventuali sovrapposizioni vengono sommate. Le altezze sono fisse per tipologia; la pianta è ortogonale e consente il trascinamento degli oggetti. Posizione e dimensioni restano modificabili anche tramite coordinate numeriche.

`npm test` esegue tredici controlli del modello, inclusi percorsi animati, ostacoli e separazione fra carrelli. Materiali e licenze sono documentati in `assets/CREDITS.md`; Three.js e i suoi addon sono distribuiti con licenza MIT in `vendor/THREE-LICENSE.txt`.

## Homepage e accesso al laboratorio

La homepage su / presenta il laboratorio e le funzioni disponibili senza caricare il motore 3D. L'editor si apre su /studio.html; il logo riporta alla homepage. Il progetto personale mantiene il salvataggio esistente. I collegamenti all'esempio e all'esercitazione usano salvataggi locali separati, riprendibili tornando allo stesso collegamento. Il pulsante Riprendi compare se esiste un progetto personale. L'esercitazione apre direttamente l'analisi delle tre interferenze. Le altre attività logistiche non vengono presentate come simulazioni già implementate.


La homepage riprende composizione e tipografia di Spazio: apertura fotografica a tutta larghezza, sezioni avorio e verde, immagini di stoccaggio, ricevimento e imballaggio. Il selettore alterna tre rendering reali e brevi filmati della scena, con dissolvenza, pausa e riduzione del movimento; il menu mobile e le FAQ sono accessibili. I rendering e i video utilizzati sono documentati in assets/homepage/RENDERING.md; le vecchie immagini AI sono conservate ma non usate. I font locali hanno licenze nella cartella fonts. Verificata a 1440 e 390 pixel: immagini caricate, nessun overflow orizzontale, selettore, menu e ingresso/ritorno all'editor funzionanti.

## Editor Studio 03

- Interfaccia avorio e verde, font locali condivisi con la homepage, proprietà più leggibili.
- Catalogo ricercabile e filtrabile per attrezzature/aree; elenco selezionabile degli elementi del progetto.
- Pianta SVG ortogonale con griglia a 1 metro, quote del perimetro, ingombri ruotati, selezione ed evidenziazione delle interferenze.
- Trascina gli oggetti in pianta. Aggancio libero, 10 cm, 50 cm o 1 m; il trascinamento contiene l’ingombro nel perimetro. Le sovrapposizioni rimangono possibili e vengono segnalate nell’analisi per consentire esercitazioni e correzioni.
- Trascina lo sfondo per spostare la vista (Alt + trascina anche sopra un elemento); rotella per zoom, Centra per tornare alla vista completa. Esc o annullamento del puntatore ripristinano lo stato prima del trascinamento.
- Un trascinamento completo equivale a una sola modifica annullabile. Annulla/ripristina disponibili anche con Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl/Cmd+Y. Una nuova modifica elimina la cronologia di ripristino.
- Crea serie di 1–20 copie, con distanza netta e direzione X/Z positiva o negativa. La serie è rifiutata integralmente se supera il perimetro o sovrappone attrezzature. Le interferenze con le aree funzionali vengono evidenziate dall’analisi dopo la creazione. Massimo 300 elementi complessivi.
- La vista 3D mantiene orbita e selezione; Sposta in pianta apre lo strumento di disposizione. Nessun trascinamento diretto o manipolatore degli assi nella vista 3D.

## Revisione editor — 29 settembre 2026
- Inserimento e duplicazione cercano un ingombro libero nel perimetro, evitando attrezzature e percorsi (i carrelli possono occupare corsie mezzi). Una ricerca senza risultati non modifica il progetto. Le aree funzionali restano sovrapponibili.
- Catalogo con dimensioni e quantità presenti, comandi rapidi sulla selezione, proprietà con stato delle interferenze e copie in serie richiudibili.
- Analisi: il comando Correggi in pianta inquadra il problema. Entrambi gli elementi coinvolti ricevono l’avviso.
- Navigazione +/−/Adatta e camera che conserva l’orientamento quando cambia lo spazio disponibile. Libreria a scomparsa sotto i 900 px.
- Tastiera: 1/2/3 viste, F inquadra, R ruota, frecce in pianta secondo aggancio (Maiusc = 1 m), Ctrl/Cmd+D duplica, Canc elimina. Guida con il pulsante ?; scorciatoie disabilitate nei campi e nelle finestre di dialogo.
- Salva vista apre una cattura PNG della vista 3D con anteprima e collegamento Scarica PNG. La risoluzione è quella del canvas corrente; non esporta la pianta SVG.

## Magazzino ampliato e nuovi elementi — 29 settembre 2026
Il nuovo esempio misura 48×40 m (1.920 m²): 48 moduli portapallet, 288 posti teorici, 5 operatori statici in scala con gilet e casco, cartelli mobili per transito carrelli/uscita/limite dimostrativo di 5 km/h e 4 barriere pedonali. Catalogo a 13 elementi, con filtri Persone e Sicurezza. Tutti i nuovi oggetti sono selezionabili, spostabili in pianta, ruotabili, duplicabili ed esportabili nel progetto JSON.
L’esempio 36×32 viene aggiornato automaticamente solo nella sessione demo se coincide con il modello precedente invariato. I progetti personalizzati e l’esercitazione vengono mantenuti; il pulsante Carica magazzino 48×40 m permette di aprire il nuovo esempio con annullamento disponibile.
Gli operatori sul percorso pedonale non sono ostacoli per quel percorso; la presenza nella corsia dei mezzi viene segnalata. Cartelli e barriere hanno ingombri fisici. La segnaletica è illustrativa didattica, senza verifica normativa automatica.

## Operatori animati — 5 ottobre 2026
Modelli articolati con casco, occhiali, guanti e abiti da lavoro. Due operatori del demo camminano su tratti separati del percorso pedonale; quelli vicini ai banchi compiono piccoli gesti, gli altri muovono leggermente la testa. Avvia/Pausa controlla persone e carrelli. La selezione arresta e ripristina le posizioni per la modifica; le animazioni non alterano il progetto salvato. Percorsi vincolati agli ostacoli statici, senza simulazione completa di traffico o operazioni di picking. 21 test del modello superati, inclusi ostacoli e separazione dei pedoni.

## Personaggi umani — revisione 5 ottobre 2026
Sostituiti integralmente i corpi costruiti con primitive con una base umana MakeHuman/MPFB CC0: pelle, mani e vestiti con geometria continua e rig condiviso. Materiali da lavoro con fasce riflettenti, casco e occhiali solidali al cranio; animazioni walk/idle con postura delle braccia adattata. Ogni operatore possiede uno scheletro indipendente; geometrie e texture sono condivise. Il file locale GLB pesa circa 6,7 MB. Provenienza e licenza in assets/people/CREDITS.md. Verificati nel browser il modello ravvicinato, la camminata, selezione e pausa; 21 test del modello superati.

Correzione animazioni: campionamento esplicito della posa a ogni frame per evitare rotazioni additive cumulative; braccia calcolate nello spazio locale del personaggio, gesti contenuti davanti al banco. Passo guidato dalla distanza percorsa, gambe sul piano sagittale e appoggio al suolo. Casco e occhiali collegati tramite matrice di bind della testa. Regressione browser: 600 ripetizioni della medesima posa, deriva delle articolazioni pari a zero.


### Flussi merci didattici
La scheda **04 Flussi merci** mostra un lotto simbolico in sette fasi: ricevimento, controllo, stoccaggio, prelievo, imballaggio, consolidamento e carico. Filtri entrata/uscita, pausa, velocità e selezione delle tappe consentono una spiegazione guidata; al controllo è possibile fermare il lotto per una verifica. A fine uscita la spedizione viene indicata come conclusa.

I collegamenti sono calcolati su una griglia da un metro negli spazi liberi del progetto, evitando attrezzature fisse, percorsi pedonali e uscite. Non sono una simulazione delle manovre dei mezzi. Baie e controllo sono tappe illustrative; se manca una postazione o il percorso è interrotto compare un messaggio. La lezione non modifica inventario, oggetti o file esportato. La vista 2D torna alla progettazione.


### Identità e avvio della scena
Il prodotto si chiama Warehouse Lab, con crediti CarraroLAB in homepage, editor e schermata iniziale. La navigazione propone Didattica. Il loader appare prima dei moduli 3D e resta visibile durante il download delle risorse e la preparazione della prima vista; in caso di errore permette di riprovare. Le anteprime del catalogo vengono generate progressivamente dopo l’apertura della scena. Il nome della repository e l’URL esistente restano compatibili.


### Template di magazzino
La voce **Template** offre il magazzino didattico originale (48 × 40 m, 48 moduli) e il **Centro di distribuzione** (60 × 48 m, 80 moduli, 118 elementi, 480 posti pallet teorici), con piazzale esterno. Ogni apertura crea una copia modificabile; Annulla ripristina il progetto precedente. Le proprietà di pallet e scaffalature consentono di scegliere cartoni, cassette riutilizzabili, fusti e casse in legno. Le tipologie sono conservate nei file JSON.

Il camion rigido si accosta in retromarcia alla baia esterna, sosta e riparte lungo l’accesso dedicato. Avvia/Pausa controlla anche questo ciclo; **Inquadra camion** avvicina la vista al piazzale. Si tratta di un ciclo dimostrativo: non simula trasferimenti fisici dal camion, inventario o manovre certificate. La baia di uscita dei flussi merci punta al piazzale nel template avanzato. Il piazzale non contribuisce alla superficie interna indicata e non è editabile nella pianta 2D.


### Simulazione guidata dei flussi merci
La pagina simulator.html è un percorso didattico in sette tappe: ricevimento, controllo, stoccaggio, prelievo, imballaggio, consolidamento e carico. Ogni tappa presenta l’operazione, cosa verificare, un’azione esplicita e la sua conseguenza. Non include punteggi, scadenze o condizioni di vittoria/sconfitta.

Le quantità aggiornano la scena a ogni conferma: 6 unità iniziali, 4 ricevute e 3 spedite, con 7 residue. I pallet rappresentano unità logistiche simboliche; i trasferimenti sono cambiamenti di stato, non animazioni fisiche continue. Si può mettere in pausa, ripassare le tappe svolte o ricominciare. Il percorso resta indipendente dai progetti dell’editor e si azzera ricaricando la pagina.

### Creazione da pianta
La home propone Crea da zero e Riprendi progetto. Il percorso `studio.html?session=plan&new=1` apre il modulo nome/dimensioni e crea una pianta rettangolare vuota da 16 a 60 metri per lato. La sessione plan salva una bozza separata da demo, esercizi e progetto personale. Nome e dimensioni restano modificabili; Nuovo crea una nuova pianta con avviso di sostituzione e possibilità di Annulla. Salva conferma il salvataggio sul dispositivo; Esporta progetto scarica il JSON denominato come il progetto, riapribile con Apri.


## Account e archivio online
La homepage apre `account.html` tramite Accedi (I miei progetti quando autenticati). L’editor offre Progetto → Salva online e Salva online come nuova copia. Il salvataggio locale automatico e l’esportazione JSON restano disponibili.

Il backend usa lo stesso servizio Supabase di Exhibition Lab, con tabella separata `warehouse_projects` e funzione `save_warehouse`. L’account redazione esistente è utilizzabile; nessuna password è inclusa nei file distribuiti. Le sessioni browser hanno chiave dedicata Warehouse Lab. `cloud-config.js` contiene solo URL e chiave pubblicabile; la sicurezza è applicata dal database. La migrazione già applicata è in `supabase/warehouse.sql`: non eseguirla di nuovo su questo database.

Le righe sono visibili solo al proprietario; le scritture passano dalla funzione con controllo atomico della revisione. Una scheda non aggiornata non sovrascrive il progetto: riaprire l’archivio o salvare una copia. Le bozze online sono separate per account e ID progetto; in caso di differenza si può recuperare la copia locale. Logout non cancella le bozze locali del dispositivo.

Questa versione include accesso agli account già attivi, archivio con ricerca e salvataggio/riapertura. Non include registrazione pubblica o recupero password dall’interfaccia. Le copertine dell’archivio sono immagini illustrative comuni del laboratorio.

Il bundle ufficiale Supabase è incluso in `vendor/supabase.js`; per aggiornarlo usare `npm run bundle:account`. I test del database sono eseguiti con PGlite e controllano accessi anonimi, separazione tra utenti, scritture dirette vietate e revisioni.


### Simulazione sul proprio magazzino
Nell’editor, Guida alla simulazione presenta sette requisiti e spiega cosa aggiungere e perché. Si apre anche dopo la creazione di una pianta nuova. Ogni requisito mancante offre un pulsante di inserimento; l’utente dispone gli elementi in pianta. Il comando Laboratorio → Simula il mio magazzino apre gli stessi controlli.

L’avvio richiede ricevimento, due scaffali, banco, spedizioni, percorso pedonale, uscita e operatore; controlla inoltre interferenze, separazione delle aree, posizioni libere e raggiungibilità del lotto su griglia. È una verifica didattica, non una certificazione normativa o delle manovre dei mezzi.

La simulazione riceve una copia dello stato corrente via sessionStorage, conserva geometria e attrezzature del progetto e rappresenta un lotto simbolico su due scaffali. Le scorte del resto dell’allestimento non sono contabilizzate. Il ritorno apre la sessione dell’editor originale; le operazioni non modificano il documento salvato. L’indirizzo temporaneo con layout funziona nella stessa scheda; il parametro project può aprire un progetto online per un utente autorizzato. Un layout mancante o non idoneo viene bloccato, senza sostituirlo con la demo.
