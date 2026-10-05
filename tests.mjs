import test from 'node:test';import assert from 'node:assert/strict';import {demo,warehouseDemo,item,analyze,validate,overlap,isLegacyDemo,legacyWarehouseDemo} from './model.js';
import {vehicleRoute,workerRoute,routePosition} from './motion.js';
import {placeInWarehouse,makeRow,findFreePlacement} from './editor-model.js';
import {makeFlowLesson,flowGrid,alongFlow} from './flow-model.js';
import {warehouseTemplates,distributionWarehouse,truckCycle} from './templates.js';

test('Template: copie indipendenti, layout base conservato e distribuzione con quattro merci',()=>{
 const base=warehouseTemplates[0].create();assert.equal(base.objects.filter(o=>o.type==='rack').length,48);
 const advanced=distributionWarehouse();assert.equal(advanced.objects.filter(o=>o.type==='rack').length,80);
 assert.equal(new Set(advanced.objects.filter(o=>o.cargoType).map(o=>o.cargoType)).size,4);
 assert.deepEqual(analyze(advanced),[]);assert.equal(makeFlowLesson(advanced).error,undefined);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(advanced))),advanced);
 const second=distributionWarehouse();advanced.objects[0].x=20;assert.notEqual(second.objects[0].x,20);assert.notEqual(second.objects[0].id,advanced.objects[0].id);
 const bad=distributionWarehouse();bad.objects[0].cargoType='invalid';assert.throws(()=>validate(bad));
});
test('Camion: arrivo, sosta, partenza e attesa sempre fuori dal magazzino',()=>{
 const d=48;assert.equal(truckCycle(0,d).phase,'Arrivo e accosto');assert.equal(truckCycle(12,d).z,30);assert.equal(truckCycle(20,d).moving,false);assert.equal(truckCycle(30,d).phase,'Partenza');assert.equal(truckCycle(40,d).visible,false);
 for(let t=0;t<88;t+=.1){const state=truckCycle(t,d);assert.ok(state.z-4.55>d/2);assert.ok(Math.abs(truckCycle(t+.01,d).z-state.z)<.05);}
 assert.equal(truckCycle(44,d).z,truckCycle(0,d).z);
});

test('Flussi merci: sette fasi continue negli spazi liberi senza cambiare il progetto',()=>{
 const p=warehouseDemo(),before=JSON.stringify(p),lesson=makeFlowLesson(p),grid=flowGrid(p);
 assert.equal(lesson.error,undefined);assert.equal(lesson.stages.length,7);
 for(let i=0;i<lesson.stages.length;i++){
  const s=lesson.stages[i];assert.deepEqual(s.path.at(-1),s.point);
  if(i)assert.deepEqual(s.path[0],lesson.stages[i-1].point);
  for(const point of s.path){const n=grid.nearest(point,.1);assert.ok(n>=0);assert.equal(grid.free[n],true);}
  for(let n=1;n<s.path.length;n++)assert.equal(Math.abs(s.path[n].x-s.path[n-1].x)+Math.abs(s.path[n].z-s.path[n-1].z),1);
 }
 assert.equal(JSON.stringify(p),before);
});
test('Flussi merci: attrezzature mancanti e passaggi bloccati danno un messaggio utile',()=>{
 const p=warehouseDemo();p.objects=p.objects.filter(o=>o.type!=='bench');assert.match(makeFlowLesson(p).error,/banco/);
 const blocked=warehouseDemo();blocked.objects.push({...item('rack',0,0),w:48,d:40});assert.ok(makeFlowLesson(blocked).error);
 const g=flowGrid({width:16,depth:16,objects:[{...item('rack',0,0),w:1,d:16}]});assert.equal(g.path(g.nearest({x:-5,z:0}),g.nearest({x:5,z:0})),null);
});
test('Flussi merci: interpolazione limitata al percorso e sosta stazionaria',()=>{
 const path=[{x:0,z:0},{x:1,z:0},{x:1,z:1}];assert.deepEqual(alongFlow(path,.75),{x:1,z:.5});assert.deepEqual(alongFlow(path,-2),path[0]);assert.deepEqual(alongFlow(path,2),path.at(-1));assert.deepEqual(alongFlow([path[0]],.5),path[0]);
});

test('Operatori: camminata separata e nessuna modifica al progetto',()=>{
 const p=warehouseDemo(),before=JSON.stringify(p),walkers=p.objects.filter(o=>o.type==='worker'),routes=walkers.map(o=>workerRoute(p,o));
 assert.equal(routes.filter(Boolean).length,2);
 for(let t=0;t<120;t+=.2){const positions=walkers.map((o,i)=>({...o,...(routes[i]?routePosition(routes[i],t):{})}));
  for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)assert.equal(overlap(positions[i],positions[j]),false);
  for(const o of positions)for(const other of p.objects.filter(o=>['rack','barrier','vehicle','exit'].includes(o.type)))assert.equal(overlap(o,other),false);
 }
 assert.equal(JSON.stringify(p),before);
});
test('Operatori: ostacolo interrompe il tragitto e assenza di percorso mantiene la posizione',()=>{
 const person=item('worker',0,0),lane=Object.assign(item('pedestrian',0,0),{d:20}),p={width:28,depth:26,objects:[person,lane,item('pallet',0,3)]};
 const route=workerRoute(p,person);assert.ok(route);assert.ok(route.high<3);
 person.x=6;assert.equal(workerRoute(p,person),null);
 person.x=0;person.rotation=90;lane.rotation=90;p.objects[2].x=3;p.objects[2].z=0;
 assert.equal(workerRoute(p,person).axis,'x');
});

test('Inserimento: evita attrezzature, passaggi pedonali e corsie senza mutare il progetto',()=>{
 const p=warehouseDemo(),before=JSON.stringify(p),o=item('rack');
 Object.assign(o,findFreePlacement(p,o));
 assert.equal(analyze({...p,objects:[...p.objects,o]}).length,0);
 assert.equal(JSON.stringify(p),before);
});
test('Duplicazione: trova spazio anche vicino al perimetro',()=>{
 const source=item('rack',16,14),p={version:1,width:36,depth:32,objects:[source]};
 const copy={...source,id:crypto.randomUUID()};Object.assign(copy,findFreePlacement(p,copy,{x:20,z:14}));
 assert.equal(analyze({...p,objects:[source,copy]}).length,0);
});
test('Inserimento: rifiuta un magazzino pieno e un elemento troppo grande',()=>{
 const p={width:16,depth:16,objects:[{...item('rack'),w:16,d:16}]};
 assert.throws(()=>findFreePlacement(p,item('pallet')),/spazio libero/);
 assert.throws(()=>findFreePlacement(p,{...item('rack'),w:20}),/troppo grande/);
});
test('Analisi: gli avvisi identificano entrambi gli elementi coinvolti',()=>{
 const a=item('rack'),b=item('pallet'),p={width:20,depth:20,objects:[a,b]};
 assert.deepEqual(analyze(p)[0].ids,[a.id,b.id]);
});

test('Pianta: aggancio e vincolo al perimetro rispettano la rotazione',()=>{
  const p=demo(),o={...item('rack'),rotation:90};
  assert.deepEqual(placeInWarehouse(p,o,1.24,-2.27,.5),{x:1,z:-2.5});
  const pos=placeInWarehouse(p,o,99,-99,.1);
  assert.equal(pos.x,p.width/2-o.d/2);assert.equal(pos.z,-p.depth/2+o.w/2);
  assert.throws(()=>placeInWarehouse(p,{...o,w:80},0,0));
});
test('Serie: distanza netta, copie indipendenti e progetto invariato',()=>{
  const o=item('rack',-8,0),p={version:1,width:30,depth:20,objects:[o]},before=JSON.stringify(p);
  const copies=makeRow(p,o,3,.2,'x');
  assert.deepEqual(copies.map(c=>c.x),[-4.8,-1.6,1.6]);
  assert.equal(new Set([o.id,...copies.map(c=>c.id)]).size,4);
  assert.equal(JSON.stringify(p),before);validate({...p,objects:[o,...copies]});
});
test('Serie: rifiuta ostacoli e uscita dal perimetro senza modifiche parziali',()=>{
  const o=item('rack',0,0),p={version:1,width:20,depth:20,objects:[o,item('pallet',6.4,0)]},before=JSON.stringify(p);
  assert.throws(()=>makeRow(p,o,3,.2,'x'),/attrezzatura/);
  assert.throws(()=>makeRow(p,o,5,.2,'-x'),/perimetro/);
  assert.throws(()=>makeRow(p,o,0,.2,'z'));
  assert.equal(JSON.stringify(p),before);
});
test('Serie ruotata: usa l’ingombro lungo l’asse scelto',()=>{
  const o={...item('rack'),rotation:90},p={width:30,depth:30,objects:[o]};
  assert.equal(makeRow(p,o,1,.5,'-z')[0].z,-3.5);
  assert.equal(makeRow(p,o,1,.5,'x')[0].x,1.7);
});
test('Il magazzino iniziale non presenta interferenze',()=>assert.equal(analyze(validate(demo())).length,0));
test('Esercizio: tre ostacoli producono tre criticità',()=>{const p=demo();p.objects.push(item('pallet',-11,0),item('pallet',-11,11),item('pallet',-7,-6));assert.equal(analyze(p).length,3);});
test('La rotazione cambia gli ingombri',()=>{const a=item('rack'),b=item('pallet',1.9,0);assert.ok(overlap(a,b));a.rotation=90;assert.ok(!overlap(a,b));});
test('Importazione rifiuta dati invalidi e ID duplicati',()=>{const p=demo();p.objects.push({...p.objects[0]});assert.throws(()=>validate(p));p.objects.pop();p.objects[0].w=-1;assert.throws(()=>validate(p));});
test('Fuori perimetro e incrocio pedoni mezzi',()=>{const p={version:1,width:20,depth:20,objects:[item('pallet',12,0),item('pedestrian'),item('vehicle')]};assert.equal(analyze(p).length,2);});
test('Magazzino completo: quarantotto moduli e nessuna interferenza',()=>{const p=validate(warehouseDemo());assert.equal(p.objects.filter(o=>o.type==='rack').length,48);assert.equal(analyze(p).length,0);assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);});
test('Animazione: parte dalla posizione salvata e non modifica il progetto',()=>{const p=warehouseDemo(),before=JSON.stringify(p),v=p.objects.find(o=>o.type==='forklift'),r=vehicleRoute(p,v);assert.ok(r);assert.ok(Math.abs(routePosition(r,0).z-v.z)<1e-8);for(let t=0;t<150;t+=.25){const pos=routePosition(r,t);assert.ok(pos.z>=r.low&&pos.z<=r.high);const moved={...v,...pos};assert.ok(!p.objects.some(o=>o.id!==v.id&&!['vehicle','shipping'].includes(o.type)&&overlap(moved,o)));}assert.equal(JSON.stringify(p),before);});
test('Ostacolo nella corsia accorcia il percorso; carrello fuori corsia resta fermo',()=>{const p=warehouseDemo(),v=p.objects.find(o=>o.type==='forklift'),r=vehicleRoute(p,v);p.objects.push(item('pallet',v.x,-2));const shorter=vehicleRoute(p,v);assert.ok(shorter.low>r.low);assert.equal(vehicleRoute(p,p.objects.filter(o=>o.type==='forklift')[1]),null);p.objects.push(item('pallet',v.x,v.z));assert.equal(vehicleRoute(p,v),null);});
test('Corsia ruotata e doppio carrello: i percorsi restano separati',()=>{const lane=Object.assign(item('vehicle'),{rotation:90,d:20,w:4}),a=Object.assign(item('forklift',-4,0),{rotation:90}),b=Object.assign(item('forklift',4,0),{rotation:90}),p={width:28,depth:26,objects:[lane,a,b]},ra=vehicleRoute(p,a),rb=vehicleRoute(p,b);assert.ok(ra&&rb);assert.equal(ra.axis,'x');assert.ok(ra.high-rb.low<0);});

test('Persone: percorso pedonale consentito, corsia mezzi segnalata',()=>{const p={width:24,depth:24,objects:[item('pedestrian'),item('worker')]};assert.equal(analyze(p).length,0);p.objects[0]=item('vehicle');assert.equal(analyze(p).length,1);});
test('Demo precedente: riconosce solo un layout originale invariato',()=>{const p=legacyWarehouseDemo();assert.ok(isLegacyDemo(p));p.objects[0].x+=.1;assert.ok(!isLegacyDemo(p));assert.ok(!isLegacyDemo(warehouseDemo()));});

import {newGame,act,occupied,reserved,nextMove} from './simulator-model.js';
test('Simulatore: partita completa, cinque spedizioni entro il turno',()=>{
 const s=newGame();for(const [a,p] of [['start'],['hire'],['pack',1],['ship',1],['pack',2],['ship',2],['pack',3],['ship',3],['replenish','cartons'],['replenish','totes'],['pack',4],['ship',4],['pack',5],['ship',5]])assert.ok(act(s,a,p));
 assert.equal(s.mode,'won');assert.equal(s.shipped,5);assert.equal(s.time,13);assert.equal(s.missed,0);assert.equal(s.unitsShipped,10);
});
test('Simulatore: rifornimenti prenotano spazio e arrivano dopo due tempi',()=>{
 const s=newGame();act(s,'start');act(s,'replenish','cartons');assert.equal(s.stock.cartons,3);assert.equal(reserved(s),9);act(s,'replenish','totes');assert.equal(s.stock.cartons,6);assert.equal(reserved(s),12);const before=[s.time,s.unitsShipped];assert.equal(act(s,'replenish','drums'),false);assert.deepEqual([s.time,s.unitsShipped],before);act(s,'wait');assert.equal(s.stock.totes,5);
});
test('Simulatore: preparazione occupa spazio, spedizione libera spazio e consegna merce',()=>{
 const s=newGame();act(s,'start');act(s,'pack',1);assert.equal(occupied(s),6);assert.equal(s.stock.cartons,1);assert.equal(s.time,2);act(s,'ship',1);assert.equal(occupied(s),4);assert.equal(s.unitsShipped,2);assert.equal(act(s,'ship',1),false);
});
test('Simulatore: pausa, scadenze, sconfitta e riavvio',()=>{
 const s=newGame();act(s,'start');act(s,'pack',1);s.mode='paused';const before=JSON.stringify(s);assert.equal(act(s,'wait'),false);assert.equal(JSON.stringify(s),before);s.mode='playing';while(s.time<9)act(s,'wait');assert.equal(s.orders[0].status,'expired');assert.equal(s.stock.cartons,3);assert.equal(s.missed,2);assert.equal(s.unitsShipped,0);while(s.mode==='playing')act(s,'wait');assert.equal(s.mode,'lost');assert.equal(act(s,'replenish','cartons'),false);assert.equal(newGame().mode,'intro');
});
test('Simulatore: risorse aggiuntive uniche e azioni invalide senza avanzare il tempo',()=>{
 const s=newGame();act(s,'start');act(s,'expand');act(s,'hire');assert.equal(s.capacity,18);assert.equal(s.fastPacking,true);const before=[s.time,s.unitsShipped];for(const [a,p] of [['expand'],['hire'],['pack',999],['ship',1],['replenish','unknown']])assert.equal(act(s,a,p),false);assert.deepEqual([s.time,s.unitsShipped],before);
});

test('Guida merce: indica preparazione, spedizione, rifornimento e attesa con motivo',()=>{const s=newGame();act(s,'start');let n=nextMove(s);assert.equal(n.action,'pack');assert.ok(n.why.includes('scaffali'));act(s,n.action,n.payload);n=nextMove(s);assert.equal(n.action,'ship');assert.ok(n.why.includes('libera'));s.orders=s.orders.filter(o=>o.id===2);s.stock.totes=0;n=nextMove(s);assert.equal(n.action,'replenish');assert.equal(n.payload,'totes');act(s,n.action,n.payload);s.orders=s.orders.filter(o=>o.id===2);assert.equal(nextMove(s).action,'wait');assert.equal('budget' in s,false);});

import {blankWarehouse} from "./model.js";
test("Progetto da zero: pianta vuota indipendente e riapribile",()=>{const p=blankWarehouse("Deposito scuola",32,24);assert.equal(p.objects.length,0);assert.equal(p.width,32);assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);const q=blankWarehouse();p.objects.push(item("rack"));assert.equal(q.objects.length,0);assert.throws(()=>blankWarehouse("Prova",10,24));});
