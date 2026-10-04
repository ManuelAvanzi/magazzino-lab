import {bounds,isZone} from './model.js';

// Animation routes are temporary: never write simulated positions into the project.
export function vehicleRoute(project,vehicle){
 const b=bounds(vehicle),axis=vehicle.rotation%180===0?'z':'x',cross=axis==='z'?'x':'z';
 const length=axis==='z'?b.d:b.w,width=axis==='z'?b.w:b.d,margin=.25;
 for(const lane of project.objects.filter(o=>o.type==='vehicle')){
  const a=bounds(lane),laneLength=axis==='z'?a.d:a.w,laneWidth=axis==='z'?a.w:a.d;
  if(Math.abs(b[cross]-a[cross])+width/2+margin>laneWidth/2)continue;
  let low=Math.max(a[axis]-laneLength/2+length/2+margin,-project[axis==='z'?'depth':'width']/2+length/2+margin);
  let high=Math.min(a[axis]+laneLength/2-length/2-margin,project[axis==='z'?'depth':'width']/2-length/2-margin);
  if(Math.abs(b[cross])+width/2+margin>project[cross==='z'?'depth':'width']/2)continue;
  if(b[axis]<low||b[axis]>high)continue;
  let blocked=false;
  for(const other of project.objects){
   if(other.id===vehicle.id||other.id===lane.id||(isZone(other)&&!['pedestrian','exit'].includes(other.type)))continue;
   const ob=bounds(other),ow=axis==='z'?ob.w:ob.d,ol=axis==='z'?ob.d:ob.w;
   if(Math.abs(ob[cross]-b[cross])>=(width+ow)/2+margin)continue;
   if(other.type==='forklift'){
    const middle=(b[axis]+ob[axis])/2;
    if(ob[axis]>b[axis])high=Math.min(high,middle-length/2-margin);
    else low=Math.max(low,middle+length/2+margin);
   }
   const start=ob[axis]-(ol+length)/2-margin,end=ob[axis]+(ol+length)/2+margin;
   if(b[axis]>start&&b[axis]<end){blocked=true;break;}
   if(end<=b[axis])low=Math.max(low,end);else if(start>=b[axis])high=Math.min(high,start);
  }
  if(blocked||high-low<2)continue;
  const mid=(low+high)/2,half=(high-low)/2;
  return {axis,cross,low,high,mid,half,phase:Math.acos(Math.max(-1,Math.min(1,(b[axis]-mid)/half))),direction:[0,270].includes(vehicle.rotation)?1:-1,origin:{x:vehicle.x,z:vehicle.z},speed:1.15};
 }
 return null;
}
export function routePosition(route,time){return {...route.origin,[route.axis]:route.mid+route.half*Math.cos(route.phase+route.direction*time*route.speed/route.half)};}
// Pedestrians use the same bounded corridor calculation, with separate walking
// segments for each person. Vehicle lanes and exits remain forbidden obstacles.
export function workerRoute(project,person){
 const proxy={...project,objects:project.objects.map(o=>({...o,type:o.type==='pedestrian'?'vehicle':o.type==='vehicle'?'pedestrian':o.type==='worker'?'forklift':o.type}))};
 const actor=proxy.objects.find(o=>o.id===person.id);
 const route=vehicleRoute(proxy,actor);
 return route?{...route,speed:.65}:null;
}
export function routeEnvelope(route,vehicle){const b=bounds(vehicle);return {x:route.axis==='x'?route.mid:vehicle.x,z:route.axis==='z'?route.mid:vehicle.z,w:b.w+(route.axis==='x'?route.high-route.low:0)+.5,d:b.d+(route.axis==='z'?route.high-route.low:0)+.5};}
export function routesIntersect(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;}
