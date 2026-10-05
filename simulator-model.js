export const goods=[{id:'cartons',name:'Cartoni',color:'#c6955b'},{id:'totes',name:'Cassette',color:'#568e9b'},{id:'drums',name:'Fusti',color:'#859667'}];
const requests=[['cartons',2],['totes',2],['drums',1],['cartons',3],['totes',2],['drums',2],['cartons',2],['totes',3]];
export function newGame(){return {mode:'intro',time:0,limit:24,unitsShipped:0,capacity:12,fastPacking:false,stock:{cartons:3,totes:2,drums:1},orders:[],deliveries:[],shipped:0,missed:0,nextOrder:0,log:[],message:'Prepara il tuo turno.',lastAction:'start'};}
export const occupied=s=>Object.values(s.stock).reduce((a,b)=>a+b,0)+s.orders.filter(o=>o.status==='ready').reduce((a,o)=>a+o.qty,0);
export const reserved=s=>occupied(s)+s.deliveries.reduce((a,d)=>a+d.qty,0);
function note(s,text){s.message=text;s.log.unshift(text);s.log=s.log.slice(0,5);}
function addOrder(s){if(s.nextOrder>=requests.length)return;const n=s.nextOrder++,[type,qty]=requests[n];s.orders.push({id:n+1,type,qty,status:'waiting',due:s.time+8});}
function finish(s){if(s.shipped>=5){s.mode='won';note(s,'Obiettivo raggiunto: cinque ordini spediti!');}else if(s.missed>=4||s.time>=s.limit){s.mode='lost';note(s,s.missed>=4?'Quattro ordini scaduti: il servizio si è fermato.':'Turno terminato prima della quinta spedizione.');}}
function tick(s,count){for(let i=0;i<count&&s.mode==='playing';i++){s.time++;const arrivals=s.deliveries.filter(d=>d.at<=s.time);for(const d of arrivals)s.stock[d.type]+=d.qty;s.deliveries=s.deliveries.filter(d=>d.at>s.time);if(arrivals.length)note(s,'Rifornimento arrivato: merce disponibile sugli scaffali.');for(const o of s.orders){if(['waiting','ready'].includes(o.status)&&s.time>o.due){if(o.status==='ready')s.stock[o.type]+=o.qty;o.status='expired';s.missed++;note(s,`Ordine #${o.id} non spedito in tempo. La merce preparata torna disponibile.`);}}if(s.time%3===0)addOrder(s);finish(s);}}
export function act(s,action,payload){
 if(action==='start'&&s.mode==='intro'){s.mode='playing';addOrder(s);addOrder(s);note(s,'Turno iniziato. Prepara i primi ordini con la merce disponibile.');return true;}
 if(s.mode!=='playing')return false;
 const reject=text=>{s.message=text;return false;};
 if(action==='replenish'){
  const g=goods.find(g=>g.id===payload);if(!g)return reject('Merce non valida.');
  if(reserved(s)+3>s.capacity)return reject('Spazio insufficiente: considera anche i colli pronti e i rifornimenti in arrivo.');
  s.deliveries.push({type:g.id,qty:3,at:s.time+2});note(s,`Richiesti 3 ${g.name.toLowerCase()}: arrivo fra 2 unità di tempo.`);
 }else if(action==='pack'||action==='ship'){
  const o=s.orders.find(o=>o.id===payload);if(!o)return reject('Ordine non disponibile.');
  if(action==='pack'){if(o.status!=='waiting')return reject('Ordine già preparato o chiuso.');if(s.stock[o.type]<o.qty)return reject('Scorte insufficienti: ordina un rifornimento.');s.stock[o.type]-=o.qty;o.status='ready';note(s,`Ordine #${o.id} preparato. Ora spediscilo.`);}
  else{if(o.status!=='ready')return reject('Prepara prima questo ordine.');o.status='shipped';s.unitsShipped+=o.qty;s.shipped++;note(s,`Ordine #${o.id} spedito: ${o.qty} unità consegnate e ${o.qty} posti liberati.`);}
 }else if(action==='expand'){
  if(s.capacity>=18)return reject('Hai già aggiunto lo scaffale.');s.capacity+=6;note(s,'Nuovo scaffale: sei posti aggiuntivi.');
 }else if(action==='hire'){
  if(s.fastPacking)return reject('Il secondo operatore è già attivo.');s.fastPacking=true;note(s,'Secondo operatore attivo: la preparazione richiede una sola unità di tempo.');
 }else if(action==='wait')note(s,'Attendi l’arrivo di merci e nuovi ordini.');
 else return reject('Azione non disponibile.');
 s.lastAction=action;tick(s,action==='pack'&&!s.fastPacking?2:1);return true;
}

export function nextMove(s){
 if(s.mode!=='playing')return null;
 const open=s.orders.filter(o=>['waiting','ready'].includes(o.status)).sort((a,b)=>a.due-b.due);
 const ready=open.find(o=>o.status==='ready');
 if(ready)return {action:'ship',payload:ready.id,label:`Spedisci ordine #${ready.id}`,why:`Le ${ready.qty} unità sono già preparate. Spedirle completa la richiesta e libera ${ready.qty} posti in magazzino.`,time:1};
 const available=open.find(o=>s.stock[o.type]>=o.qty);
 if(available)return {action:'pack',payload:available.id,label:`Prepara ordine #${available.id}`,why:`Hai le ${available.qty} unità richieste. Prelevale dagli scaffali e portale nell’area spedizioni: resteranno occupate finché non le spedisci.`,time:s.fastPacking?1:2};
 const missing=open[0];
 if(missing){
  const inbound=s.deliveries.filter(d=>d.type===missing.type).reduce((n,d)=>n+d.qty,0);
  if(s.stock[missing.type]+inbound>=missing.qty)return {action:'wait',label:'Attendi il rifornimento',why:'La merce necessaria è già in arrivo. Avanza di un tempo per far proseguire la consegna, senza richiederla due volte.',time:1};
  if(reserved(s)+3>s.capacity){if(s.capacity<18)return {action:'expand',label:'Attiva 6 posti aggiuntivi',why:'Scorte e merce in arrivo impegnano lo spazio disponibile. Attiva lo scaffale di riserva prima di richiedere un altro lotto.',time:1};return {action:'wait',label:'Avanza di un tempo',why:'Il magazzino è pieno. Attendi nuovi ordini per la merce disponibile; evita altri rifornimenti.',time:1};}
  const g=goods.find(g=>g.id===missing.type);return {action:'replenish',payload:g.id,label:`Richiedi 3 unità: ${g.name.toLowerCase()}`,why:`L’ordine #${missing.id} richiede ${missing.qty} unità e ne hai ${s.stock[g.id]}. Il rifornimento prenota 3 posti e arriva dopo 2 tempi, incluso questo.`,time:1};
 }
 return {action:'wait',label:'Attendi un nuovo ordine',why:'Non ci sono richieste aperte. Avanza di un tempo: un nuovo ordine arriva ogni 3 tempi.',time:1};
}
