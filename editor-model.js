import {bounds, overlap, isZone} from './model.js';

// Find a nearby free footprint without occupying pedestrian routes or exits.
// Areas may cover equipment; the existing layout analysis remains authoritative.
export function findFreePlacement(project, object, origin = {x:0,z:0}) {
  const {w,d}=bounds(object);
  if(w>project.width||d>project.depth)throw Error('Elemento troppo grande per questo magazzino.');
  const blockers=project.objects.filter(o=>o.id!==object.id&&(!isZone(o)||(o.type==='exit'||(o.type==='pedestrian'&&object.type!=='worker'))||(o.type==='vehicle'&&object.type!=='forklift')));
  const candidates=[];
  for(let x=-project.width/2+w/2;x<=project.width/2-w/2+.001;x+=.5)
    for(let z=-project.depth/2+d/2;z<=project.depth/2-d/2+.001;z+=.5)
      candidates.push({x:Math.round(x*100)/100,z:Math.round(z*100)/100});
  candidates.unshift(placeInWarehouse(project,object,origin.x,origin.z));
  candidates.sort((a,b)=>(a.x-origin.x)**2+(a.z-origin.z)**2-((b.x-origin.x)**2+(b.z-origin.z)**2));
  const position=candidates.find(pos=>isZone(object)||!blockers.some(b=>overlap({...object,...pos},b)));
  if(!position)throw Error('Nessuno spazio libero disponibile. Libera un’area o aumenta il magazzino.');
  return position;
}

export function placeInWarehouse(project, object, x, z, step = .1) {
  const {w, d} = bounds(object);
  const snap = n => step > 0 ? Math.round(n / step) * step : n;
  const limit = (n, size, footprint) => Math.round(Math.max(-(size-footprint)/2, Math.min((size-footprint)/2, n))*1000)/1000;
  if(w>project.width || d>project.depth) throw Error('L’elemento è più grande del magazzino. Riduci le sue misure.');
  return {x:limit(snap(x),project.width,w), z:limit(snap(z),project.depth,d)};
}

// Copies are prepared without mutating the project, so a rejected row is atomic.
export function makeRow(project, source, count, gap, direction) {
  if(!Number.isInteger(count)||count<1||count>20||project.objects.length+count>300)throw Error('Da 1 a 20 copie, entro il limite di 300 elementi.');
  if(!Number.isFinite(gap)||gap<0||gap>20||!['x','z','-x','-z'].includes(direction))throw Error('Controlla direzione e distanza tra gli elementi.');
  const axis=direction.endsWith('x')?'x':'z',sign=direction.startsWith('-')?-1:1;
  const size=bounds(source)[axis==='x'?'w':'d'],copies=[];
  for(let i=1;i<=count;i++){
    const copy={...source,id:crypto.randomUUID(),[axis]:Math.round((source[axis]+sign*(size+gap)*i)*1000)/1000};
    const b=bounds(copy);
    if(Math.abs(b.x)+b.w/2>project.width/2+.001||Math.abs(b.z)+b.d/2>project.depth/2+.001)throw Error('La serie supera il perimetro. Riduci le copie o cambia direzione.');
    if(!isZone(copy)&&[...project.objects,...copies].some(o=>!isZone(o)&&overlap(copy,o)))throw Error('La serie incontra un’attrezzatura. Cambia distanza o direzione.');
    copies.push(copy);
  }
  return copies;
}
