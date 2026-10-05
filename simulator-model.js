export const goods=[{id:'cartons',name:'Cartoni',color:'#c6955b',cost:5},{id:'totes',name:'Cassette',color:'#568e9b',cost:7},{id:'drums',name:'Fusti',color:'#859667',cost:9}];
const requests=[['cartons',2],['totes',2],['drums',1],['cartons',3],['totes',2],['drums',2],['cartons',2],['totes',3]];
export function newGame(){return {mode:'intro',time:0,limit:24,budget:120,capacity:12,fastPacking:false,stock:{cartons:3,totes:2,drums:1},orders:[],deliveries:[],shipped:0,missed:0,nextOrder:0,log:[],message:'Prepara il tuo turno.',lastAction:'start'};}
export const occupied=s=>Object.values(s.stock).reduce((a,b)=>a+b,0)+s.orders.filter(o=>o.status==='ready').reduce((a,o)=>a+o.qty,0);
export const reserved=s=>occupied(s)+s.deliveries.reduce((a,d)=>a+d.qty,0);
function note(s,text){s.message=text;s.log.unshift(text);s.log=s.log.slice(0,5);}
function addOrder(s){if(s.nextOrder>=requests.length)return;const n=s.nextOrder++,[type,qty]=requests[n];s.orders.push({id:n+1,type,qty,status:'waiting',due:s.time+8,value:30+qty*goods.find(g=>g.id===type).cost});}
function finish(s){if(s.shipped>=5){s.mode='won';note(s,'Obiettivo raggiunto: cinque ordini spediti!');}else if(s.budget<0||s.missed>=4||s.time>=s.limit){s.mode='lost';note(s,s.budget<0?'Budget esaurito.':s.missed>=4?'Quattro ordini scaduti: il servizio si è fermato.':'Turno terminato prima della quinta spedizione.');}}
function tick(s,count){for(let i=0;i<count&&s.mode==='playing';i++){s.time++;const arrivals=s.deliveries.filter(d=>d.at<=s.time);for(const d of arrivals)s.stock[d.type]+=d.qty;s.deliveries=s.deliveries.filter(d=>d.at>s.time);if(arrivals.length)note(s,'Rifornimento arrivato: merce disponibile sugli scaffali.');for(const o of s.orders){if(['waiting','ready'].includes(o.status)&&s.time>o.due){if(o.status==='ready')s.stock[o.type]+=o.qty;o.status='expired';s.missed++;s.budget-=15;note(s,`Ordine #${o.id} scaduto: −15 €. La merce prenotata torna disponibile.`);}}if(s.time%3===0)addOrder(s);finish(s);}}
export function act(s,action,payload){
 if(action==='start'&&s.mode==='intro'){s.mode='playing';addOrder(s);addOrder(s);note(s,'Turno iniziato. Prepara i primi ordini con la merce disponibile.');return true;}
 if(s.mode!=='playing')return false;
 const reject=text=>{s.message=text;return false;};
 if(action==='buy'){
  const g=goods.find(g=>g.id===payload);if(!g)return reject('Merce non valida.');
  if(reserved(s)+3>s.capacity)return reject('Spazio insufficiente: considera anche i colli pronti e i rifornimenti in arrivo.');
  if(s.budget<g.cost*3)return reject('Budget insufficiente per questo rifornimento.');
  s.budget-=g.cost*3;s.deliveries.push({type:g.id,qty:3,at:s.time+2});note(s,`Ordinati 3 ${g.name.toLowerCase()}: arrivo fra 2 unità di tempo.`);
 }else if(action==='pack'||action==='ship'){
  const o=s.orders.find(o=>o.id===payload);if(!o)return reject('Ordine non disponibile.');
  if(action==='pack'){if(o.status!=='waiting')return reject('Ordine già preparato o chiuso.');if(s.stock[o.type]<o.qty)return reject('Scorte insufficienti: ordina un rifornimento.');s.stock[o.type]-=o.qty;o.status='ready';note(s,`Ordine #${o.id} preparato. Ora spediscilo.`);}
  else{if(o.status!=='ready')return reject('Prepara prima questo ordine.');o.status='shipped';s.budget+=o.value;s.shipped++;note(s,`Ordine #${o.id} spedito: +${o.value} €.`);}
 }else if(action==='expand'){
  if(s.capacity>=18)return reject('Hai già aggiunto lo scaffale.');if(s.budget<40)return reject('Servono 40 € per lo scaffale.');s.budget-=40;s.capacity+=6;note(s,'Nuovo scaffale: sei posti aggiuntivi.');
 }else if(action==='hire'){
  if(s.fastPacking)return reject('Il secondo operatore è già attivo.');if(s.budget<55)return reject('Servono 55 € per il secondo operatore.');s.budget-=55;s.fastPacking=true;note(s,'Secondo operatore attivo: la preparazione richiede una sola unità di tempo.');
 }else if(action==='wait')note(s,'Attendi l’arrivo di merci e nuovi ordini.');
 else return reject('Azione non disponibile.');
 s.lastAction=action;tick(s,action==='pack'&&!s.fastPacking?2:1);return true;
}
