import {bounds,isZone} from './model.js';

// One metre teaching grid: routes for symbolic goods, not vehicle turning envelopes.
export function flowGrid(project){
 const cols=Math.floor(project.width)-1,rows=Math.floor(project.depth)-1;
 const obstacles=project.objects.filter(o=>!isZone(o)&&!['worker','forklift'].includes(o.type)||['pedestrian','exit'].includes(o.type)).map(bounds);
 const nodes=Array.from({length:cols*rows},(_,i)=>({x:-project.width/2+1+i%cols,z:-project.depth/2+1+Math.floor(i/cols)}));
 const free=nodes.map(p=>!obstacles.some(b=>Math.abs(p.x-b.x)<b.w/2+.4&&Math.abs(p.z-b.z)<b.d/2+.4));
 const nearest=(point,max=3)=>{let best=-1,d=max*max;nodes.forEach((p,i)=>{const n=(p.x-point.x)**2+(p.z-point.z)**2;if(free[i]&&n<d){best=i;d=n;}});return best;};
 function path(a,b){
  if(a<0||b<0)return null;const queue=[a],prev=new Map([[a,-1]]);
  for(let k=0;k<queue.length;k++){const i=queue[k];if(i===b)break;
   for(const next of [i%cols?i-1:-1,i%cols<cols-1?i+1:-1,i-cols,i+cols]){
    if(next<0||next>=nodes.length||!free[next]||prev.has(next))continue;
    const a=nodes[i],b=nodes[next];if(obstacles.some(o=>Math.max(a.x,b.x)>o.x-o.w/2-.4&&Math.min(a.x,b.x)<o.x+o.w/2+.4&&Math.max(a.z,b.z)>o.z-o.d/2-.4&&Math.min(a.z,b.z)<o.z+o.d/2+.4))continue;
    prev.set(next,i);queue.push(next);
   }
  }
  if(!prev.has(b))return null;const result=[];for(let i=b;i!==-1;i=prev.get(i))result.push(nodes[i]);return result.reverse();
 }
 return {nodes,free,nearest,path};
}

export function makeFlowLesson(project,flowId){
 if(project.flows?.length)return makeAuthoredFlow(project,project.flows.some(f=>f.id===flowId)?flowId:project.flows[0].id);
 const grid=flowGrid(project),rack=project.objects.filter(o=>o.type==='rack').sort((a,b)=>b.x-a.x||a.z-b.z)[0],bench=project.objects.find(o=>o.type==='bench'),shipping=project.objects.find(o=>o.type==='shipping');
 if(!rack||!bench||!shipping)return {error:'Per osservare il ciclo completo aggiungi almeno una scaffalatura, un banco imballaggio e un’area spedizioni.'};
 const rb=bounds(rack),bb=bounds(bench),sb=bounds(shipping),receiving=project.objects.find(o=>o.type==='receiving');
 const entry=receiving?{x:receiving.x,z:receiving.z+receiving.d/2-1}:{x:0,z:-project.depth/2+2};
 const targets=[entry,receiving?entry:{x:project.width*.27,z:-project.depth/2+5},{x:rb.x+rb.w/2+1,z:rb.z},{x:bb.x,z:bb.z+bb.d/2+1},{x:sb.x,z:sb.z-sb.d/2-1},project.logisticsYard?{x:Math.min(16,project.width/2-4),z:project.depth/2-1}:{x:Math.min(7,project.width/4),z:-project.depth/2+2}];
 const ids=targets.map(p=>grid.nearest(p));
 if(ids.some(i=>i<0))return {error:'Una delle tappe non ha spazio libero vicino. Libera ricevimento, accesso allo scaffale, banco e spedizioni.'};
 const points=ids.map(i=>grid.nodes[i]);
 const links=[[0,1],[1,2],[2,3],[3,4],[4,5]].map(([a,b])=>grid.path(ids[a],ids[b]));
 if(links.some(p=>!p))return {error:'Il percorso delle merci è interrotto. Collega le tappe con passaggi liberi: i flussi non attraversano scaffali o percorsi pedonali.'};
 const stage=(name,text,question,point,path,kind)=>({name,text,question,point,path,kind});
 const stages=[
  stage('Ricevimento','Un lotto arriva alla baia 02. Si confrontano consegna, documento e quantità attesa.','La consegna corrisponde a quanto ordinato?',points[0],[points[0]],'in'),
  stage('Controllo','Il lotto viene portato nell’area di controllo illustrativa. Si verificano quantità, integrità e identificazione.','Se il collo è danneggiato, fermalo in attesa di verifica.',points[1],links[0],'in'),
  stage('Stoccaggio','Dopo l’accettazione, il lotto raggiunge l’accesso a una scaffalatura. L’ubicazione viene registrata.','Perché registrare dove viene messa la merce?',points[2],links[1],'in'),
  stage('Prelievo','Un ordine cliente richiede merce a stock. L’operatore verifica articolo e quantità prima del prelievo.','Stesso articolo e stessa quantità dell’ordine?',points[2],[points[2]],'out'),
  stage('Imballaggio','La merce prelevata raggiunge il banco: verifica dell’ordine, protezione del contenuto ed etichetta.','L’etichetta identifica il destinatario corretto?',points[3],links[2],'out'),
  stage('Consolidamento','I colli pronti attendono nell’area spedizioni, raggruppati per ordine o partenza.','Quali colli devono partire insieme?',points[4],links[3],'out'),
  stage('Carico e uscita',project.logisticsYard?'Il lotto raggiunge la baia verso il piazzale esterno. Un ultimo riscontro precede il carico sul camion e la conferma della spedizione.':'Il lotto raggiunge la baia 03. Un ultimo riscontro precede il carico e la conferma della spedizione.','Tutti i colli previsti sono stati caricati?',points[5],links[4],'out')
 ];
 return {stages,points,links};
}

export function alongFlow(path,progress){
 if(path.length===1)return {...path[0]};const d=Math.max(0,Math.min(1,progress))*(path.length-1),i=Math.min(path.length-2,Math.floor(d)),t=d-i;
 return {x:path[i].x+(path[i+1].x-path[i].x)*t,z:path[i].z+(path[i+1].z-path[i].z)*t};
}

export function makeAuthoredFlow(project,flowId){
 const flow=project.flows?.find(f=>f.id===flowId);
 if(!flow||flow.steps.length<2)return {error:'Aggiungi almeno due tappe e scegli le postazioni da collegare.'};
 const grid=flowGrid(project),stages=[];let previous=null;
 for(const [i,s] of flow.steps.entries()){
  if(!s.title.trim()||!s.why.trim()||!s.check.trim())return {error:`Tappa ${i+1}: completa titolo, operazione e verifica da effettuare.`};
  const object=project.objects.find(o=>o.id===s.objectId);
  if(!object)return {error:`Tappa ${i+1}: scegli una postazione presente nel magazzino.`};
  const b=bounds(object),candidates=isZone(object)?[{x:b.x,z:b.z}]:[{x:b.x-b.w/2-1,z:b.z},{x:b.x+b.w/2+1,z:b.z},{x:b.x,z:b.z-b.d/2-1},{x:b.x,z:b.z+b.d/2+1}];
  let chosen=null;
  for(const target of candidates){const id=grid.nearest(target,2);if(id<0)continue;const path=previous===null?[grid.nodes[id]]:grid.path(previous,id);if(path&&(!chosen||path.length<chosen.path.length))chosen={id,path};}
  if(!chosen)return {error:`Tappa ${i+1}: libera un accesso a ${object.name} e un collegamento con la tappa precedente.`};
  previous=chosen.id;stages.push({name:s.title,text:s.why,question:s.check,kind:s.kind,point:grid.nodes[chosen.id],path:chosen.path,image:s.image,objectId:s.objectId});
 }
 return {stages,authored:true,name:flow.name};
}
export function suggestedFlow(project){
 const find=type=>project.objects.find(o=>o.type===type)?.id||'';
 return {id:crypto.randomUUID(),name:'Dall’arrivo alla spedizione',steps:[
  ['Ricevimento','receiving','in','inbound','Separa la merce in arrivo dalle scorte disponibili.','Confronta quantità e documento di trasporto.'],
  ['Controllo della consegna','receiving','in','inbound','Verifica integrità e identificazione prima di accettare la merce.','In caso di danni, separa e segnala il collo.'],
  ['Stoccaggio','rack','in','inbound','Assegna e registra una posizione per ritrovare la merce.','La corsia e l’accesso allo scaffale sono liberi?'],
  ['Prelievo e imballaggio','bench','out','packing','Preleva gli articoli richiesti e proteggili per il trasporto.','Controlla articolo, quantità ed etichetta.'],
  ['Consolidamento e uscita','shipping','out','outbound','Riunisci i colli della stessa spedizione e registra la consegna al vettore.','Tutti i colli previsti sono presenti?']
 ].map(([title,type,kind,image,why,check])=>({id:crypto.randomUUID(),title,objectId:find(type),kind,image,why,check}))};
}
