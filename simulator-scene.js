import {WarehouseScene} from './warehouse-scene.js';
import {item} from './model.js';

// Game inventory is separate from the editor's saved layouts.
export function simulatorProject(state){
 const objects=[],units=Object.entries(state.stock).flatMap(([type,n])=>Array(n).fill(type));
 for(let i=0;i<state.capacity/6;i++)objects.push({...item('rack',-6+i*5,-2),id:`stock-${i}`,cargoSlots:units.slice(i*6,i*6+6)});
 objects.push({...item('vehicle',8,-1),d:19}, {...item('pedestrian',-11,0),d:22},item('forklift',8,4),item('bench',-5,8),item('worker',-5,9.2),item('shipping',3,9),item('exit',-11,11),item('warningSign',5,-9),item('speedSign',10,-9));
 if(state.fastPacking)objects.push(item('bench',-2,8),item('worker',-2,9.2));
 let i=0;for(const order of state.orders.filter(o=>o.status==='ready'))for(let n=0;n<order.qty;n++,i++)objects.push({...item('pallet',1+(i%4)*1.4,7.5+Math.floor(i/4)*1.1),cargoType:order.type});
 for(const z of [-7,0,7])objects.push({...item('barrier',-9.6,z),rotation:90});
 return {version:1,width:28,depth:26,objects};
}
export class SimulatorScene{
 constructor(container){this.scene=new WarehouseScene(container,()=>this.scene.setMotion(this.active));this.scene.setLighting('golden');}
 frame(){
  const s=this.scene;s.center();
  s.camera.position.sub(s.controls.target).multiplyScalar(.86).add(s.controls.target);
  s.controls.update();s.needsRender=true;
 }
 update(state){
  const key=JSON.stringify([state.stock,state.capacity,state.fastPacking,state.orders.filter(o=>o.status==='ready').map(o=>[o.id,o.type,o.qty])]);
  if(key!==this.key){this.scene.build(simulatorProject(state));this.key=key;}
  this.active=state.mode==='playing';this.scene.setMotion(this.active);
 }
}
