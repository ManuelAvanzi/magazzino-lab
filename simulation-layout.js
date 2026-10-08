import {analyze,bounds,validate,item} from './model.js';
import {flowGrid} from './flow-model.js';
export const requirements=[
 ['receiving','Ricevimento','Separa il lotto in arrivo dalle scorte disponibili.'],
 ['rack','Stoccaggio','Servono almeno due scaffalature: 12 posti per le 10 unità del percorso.'],
 ['bench','Preparazione','Un banco per verificare, imballare e identificare i colli.'],
 ['shipping','Spedizioni','Riunisci i colli pronti in una zona distinta dal ricevimento.'],
 ['pedestrian','Percorso pedonale','Definisci un percorso dedicato alle persone.'],
 ['exit','Uscita','Mantieni libera un’area di uscita.'],
 ['worker','Operatore','Prevedi un addetto alle operazioni del laboratorio.']
];
export function inspectSimulation(project){
 validate(project);const checks=requirements.map(([type,title,why])=>({type,title,why,ok:project.objects.filter(o=>o.type===type).length>=(type==='rack'?2:1)}));
 const problems=analyze(project).map(i=>i.text);
 if(checks.some(c=>!c.ok))return {ready:false,checks,problems};
 const grid=flowGrid(project),receiving=project.objects.find(o=>o.type==='receiving'),shipping=project.objects.find(o=>o.type==='shipping'),bench=project.objects.find(o=>o.type==='bench'),rack=project.objects.find(o=>o.type==='rack');
 const rb=bounds(receiving),sb=bounds(shipping),bb=bounds(bench),r=bounds(rack);
 if(Math.abs(rb.x-sb.x)<(rb.w+sb.w)/2&&Math.abs(rb.z-sb.z)<(rb.d+sb.d)/2)problems.push('Separa le aree di ricevimento e spedizione.');
 function slots(b,count,inside){const found=[];const people=project.objects.filter(o=>['worker','forklift'].includes(o.type)).map(bounds);for(const p of grid.nodes.filter((p,i)=>grid.free[i]&&!people.some(o=>Math.abs(p.x-o.x)<o.w/2+.4&&Math.abs(p.z-o.z)<o.d/2+.4)&&(inside?Math.abs(p.x-b.x)<=b.w/2-.5&&Math.abs(p.z-b.z)<=b.d/2-.5:Math.hypot(p.x-b.x,p.z-b.z)<=4)).sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z))){if(found.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>=1.5))found.push(p);if(found.length===count)break;}return found;}
 const incoming=slots(rb,4,true),outgoing=slots(sb,3,true),preparing=slots(bb,3,false);
 if(incoming.length<4)problems.push('Libera o amplia il ricevimento: occorrono quattro posizioni per il lotto.');
 if(outgoing.length<3)problems.push('Libera o amplia le spedizioni: occorrono tre posizioni per i colli.');
 if(preparing.length<3)problems.push('Libera spazio intorno al banco per tre colli.');
 const rackNode=grid.nearest({x:r.x,z:r.z+r.d/2+1});
 const points=[incoming[0],rackNode>=0?grid.nodes[rackNode]:null,preparing[0],outgoing[0]];
 if(points.some(p=>!p))problems.push('Una postazione non ha un accesso libero.');
 else{const ids=points.map(p=>grid.nearest(p));if(ids.slice(1).some((id,i)=>!grid.path(ids[i],id)))problems.push('Collega ricevimento, scaffale, banco e spedizioni con passaggi liberi, senza attraversare percorsi pedonali.');}
 if(incoming[0]){const start=grid.nearest(incoming[0]);const targets=[...incoming,...outgoing,...preparing,...project.objects.filter(o=>o.type==='rack').slice(0,2).map(o=>{const b=bounds(o);return {x:b.x,z:b.z+b.d/2+1};})];if(targets.some(p=>!grid.path(start,grid.nearest(p))))problems.push('Una posizione del lotto o uno scaffale dedicato non è raggiungibile dal ricevimento.');}
 return {ready:problems.length===0,checks,problems,slots:{incoming,outgoing,preparing},rackIds:project.objects.filter(o=>o.type==='rack').slice(0,2).map(o=>o.id)};
}

export function simulationSnapshot(source,state,inspection=inspectSimulation(source)){
 if(!inspection.ready)throw Error('Layout non adatto alla simulazione');
 const p=structuredClone(source),units=Object.entries(state.stock).flatMap(([type,n])=>Array(n).fill(type));
 inspection.rackIds.forEach((id,i)=>{p.objects.find(o=>o.id===id).cargoSlots=units.slice(i*6,i*6+6);});
 function place(types,slots,label){types.forEach((type,i)=>{const point=slots[i];p.objects.push({...item('pallet',point.x,point.z),id:'simulation-'+label+'-'+i,w:.6,d:.6,h:.6,cargoType:type,name:label+' · lotto didattico'});});}
 place(state.receiving,inspection.slots.incoming,'Ricevimento');place(state.preparing,inspection.slots.preparing,'Preparazione');place(state.orders.flatMap(o=>Array(o.qty).fill(o.type)),inspection.slots.outgoing,'Spedizioni');return p;
}
