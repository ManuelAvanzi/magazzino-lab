export const stages=[
 {phase:'Merce in entrata',title:'Ricevimento',action:'Scarica il lotto nella zona ricevimento',why:'Il camion consegna 4 unità: 3 cartoni e 1 cassetta. La merce ricevuta resta separata dalle scorte disponibili.',check:'Confronta la consegna con il documento di trasporto: articolo e quantità devono corrispondere.',effect:'4 unità nella zona ricevimento, ancora da controllare.'},
 {phase:'Merce in entrata',title:'Controllo della consegna',action:'Conferma quantità e integrità',why:'Prima di accettare il lotto, verifica quantità, identificazione e integrità degli imballi.',check:'In questo esempio il lotto è conforme. In caso di danni o differenze, la merce andrebbe separata e segnalata prima dello stoccaggio.',effect:'Lotto verificato: la merce può essere collocata a scaffale.'},
 {phase:'Merce in entrata',title:'Stoccaggio',action:'Colloca la merce negli scaffali',why:'Assegna una posizione al lotto e registra le quantità. Solo ora le 4 unità diventano disponibili per il prelievo.',check:'Mantieni libere le corsie e scegli una posizione adatta alla tipologia di merce.',effect:'Ricevimento libero. Le scorte disponibili passano da 6 a 10 unità.'},
 {phase:'Merce in uscita',title:'Prelievo dell’ordine',action:'Preleva 2 cartoni e 1 cassetta',why:'Un ordine richiede 3 unità. Preleva gli articoli indicati e portali al banco di preparazione.',check:'Confronta codice, posizione e quantità con la lista di prelievo. La merce prelevata non è ancora spedita.',effect:'7 unità disponibili sugli scaffali e 3 al banco di preparazione.'},
 {phase:'Merce in uscita',title:'Imballaggio e identificazione',action:'Prepara e identifica i colli',why:'Proteggi i prodotti, verifica il contenuto e associa ai colli le informazioni dell’ordine e del destinatario.',check:'Controlla che imballo, etichetta e contenuto siano coerenti prima di trasferire i colli alla spedizione.',effect:'3 unità preparate e identificate, pronte per il consolidamento.'},
 {phase:'Merce in uscita',title:'Consolidamento',action:'Trasferisci i colli nell’area spedizioni',why:'Riunisci i colli dello stesso ordine nella zona di uscita. L’attesa del carico occupa ancora spazio in magazzino.',check:'Verifica che tutti i colli siano presenti e assegnati alla partenza corretta.',effect:'3 unità nell’area spedizioni. Il banco torna libero.'},
 {phase:'Merce in uscita',title:'Carico e conferma di uscita',action:'Carica e registra la spedizione',why:'Consegna i colli al vettore e conferma la partenza. Solo a questo punto la merce esce dal magazzino.',check:'Confronta i colli caricati con il documento di spedizione e registra l’uscita.',effect:'3 unità spedite; restano 7 unità disponibili in magazzino.'}
];
export function newSimulation(){return {step:0,mode:'intro',stock:{cartons:3,totes:2,drums:1},capacity:12,fastPacking:false,orders:[],receiving:[],preparing:[],shipped:0,checked:false,packed:false,log:[],message:'Segui il lotto dal ricevimento alla spedizione.'};}
export function advance(s){if(s.mode!=='playing'||s.step>=stages.length)return false;const i=s.step;
 if(i===0)s.receiving=['cartons','cartons','cartons','totes'];
 if(i===1)s.checked=true;
 if(i===2){s.stock.cartons+=3;s.stock.totes+=1;s.receiving=[];}
 if(i===3){s.stock.cartons-=2;s.stock.totes-=1;s.preparing=['cartons','cartons','totes'];}
 if(i===4)s.packed=true;
 if(i===5){s.preparing=[];s.orders=[{id:1,type:'cartons',qty:2,status:'ready'},{id:2,type:'totes',qty:1,status:'ready'}];}
 if(i===6){s.orders=[];s.shipped=3;}
 s.message=stages[i].effect;s.log.push(stages[i].title+' — '+s.message);s.step++;if(s.step===stages.length)s.mode='complete';return true;}
export function quantities(s){const stock=Object.values(s.stock).reduce((a,b)=>a+b,0),outgoing=s.orders.reduce((a,o)=>a+o.qty,0);return {stock,receiving:s.receiving.length,preparing:s.preparing.length,outgoing,total:stock+s.receiving.length+s.preparing.length+outgoing};}
