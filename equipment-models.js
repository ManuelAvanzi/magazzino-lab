import * as T from 'three';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from './vendor/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {equipmentCatalog} from './equipment-catalog.js';

// Downloaded glTF geometry and 2K PBR maps, shared between all instances.
// See assets/equipment/CREDITS.md. No network dependency at runtime.
const imported = Object.fromEntries(await Promise.all([
 ['handTruck','hand_truck'],['industrialBin','industrial_pastic_container'],['crateStack','plastic_crate_02']
].map(async([type,id])=>{
 const {scene}=await new GLTFLoader().loadAsync(`./assets/equipment/${id}/model.gltf`);
 scene.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(m.material[key])m.material[key].anisotropy=8;}});
 return [type,scene];
})));
const prototypes=new Map(),mats=new Map();
function material(color,metal=.65,rough=.34){const key=[color,metal,rough].join();if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return mats.get(key);}
const zinc=material('#a5b2ba',.85,.3),steel=material('#334b5b',.7,.36),rubber=material('#242a2f',0,.82),blue=material('#267580',.42,.35),orange=material('#d19a32',.35,.38),white=material('#e2e8e1',.1,.55);
function mesh(g,geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function block(g,w,h,d,x,y,z,mat,r=.012){return mesh(g,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),mat,x,y,z);}
function tube(g,a,b,r,mat){const v=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(v);const m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),24),mat,...v.add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
function label(g,text,w,h,x,y,z,bg='#183543',fg='#e8f1ec'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.font='600 48px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,480);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map:t,roughness:.5});mesh(g,new T.PlaneGeometry(w,h),mat,x,y,z);
}
function bolt(g,x,y,z){const b=mesh(g,new T.CylinderGeometry(.012,.012,.009,6),zinc,x,y,z);b.rotation.x=Math.PI/2;}
function wheel(g,x,z){tube(g,[x-.035,.11,z],[x+.035,.11,z],.085,rubber);tube(g,[x-.038,.11,z],[x+.038,.11,z],.036,zinc);block(g,.045,.13,.13,x,.19,z,zinc);block(g,.13,.016,.13,x,.26,z,zinc);}
function conveyor(){const g=new T.Group();
 for(const x of [-.49,.49]){block(g,.075,.15,4.1,x,.78,0,steel);for(const z of [-1.6,0,1.6]){block(g,.06,.67,.065,x,.37,z,zinc);block(g,.19,.025,.16,x,.027,z,rubber);bolt(g,x,.8,z);}tube(g,[x,.95,-2],[x,.95,2],.018,zinc);}
 for(let z=-1.96;z<=1.97;z+=.14){tube(g,[-.44,.8,z],[.44,.8,z],.053,zinc);tube(g,[-.49,.8,z],[.49,.8,z],.012,steel);}
 for(const z of [-1.6,1.6]){tube(g,[-.48,.28,z],[.48,.65,z],.014,zinc);block(g,1.05,.045,.06,0,.27,z,steel);}
 block(g,.15,.22,.25,.5,.61,-1.3,blue);label(g,'RULLIERA / 01',.75,.07,0,.69,2.058);return g;}
function cage(){const g=new T.Group();for(const x of [-.31,.31])for(const z of [-.43,.43])wheel(g,x,z);block(g,.8,.065,1.04,0,.3,0,blue);for(const x of [-.38,.38]){for(const z of [-.5,.5])tube(g,[x,.32,z],[x,1.82,z],.02,zinc);for(const y of [.38,.8,1.25,1.8])tube(g,[x,y,-.5],[x,y,.5],.011,zinc);for(let z=-.4;z<.5;z+=.1)tube(g,[x,.35,z],[x,1.8,z],.006,zinc);}
 for(const y of [.38,.8,1.25,1.8])tube(g,[-.38,y,-.5],[.38,y,-.5],.011,zinc);for(let x=-.3;x<.38;x+=.1)tube(g,[x,.35,-.5],[x,1.8,-.5],.006,zinc);
 block(g,.72,.035,.93,0,1.04,0,zinc);label(g,'SPEDIZIONI',.43,.13,0,1.52,.51);
 for(const y of [.51,1.23])for(const x of [-.19,.19]){block(g,.33,.35,.6,x,y,0,white);block(g,.033,.353,.605,x,y,0,blue);label(g,'COLLO',.16,.07,x,y,.303);}
 return g;}
function scale(){const g=new T.Group();block(g,1.1,.09,1.05,0,.095,.07,steel);block(g,1.08,.035,1.03,0,.156,.07,zinc);for(const x of [-.45,.45])for(const z of [-.34,.48])block(g,.11,.05,.11,x,.025,z,rubber);tube(g,[0,.12,-.55],[0,1.35,-.55],.032,zinc);block(g,.49,.26,.10,0,1.38,-.53,steel);label(g,'24.80 kg',.4,.14,0,1.39,-.474,'#11282c','#8bddc4');for(const x of [-.14,0,.14])block(g,.07,.025,.008,x,1.29,-.475,x===.14?orange:white);label(g,'CONTROLLO / 02',.6,.06,0,.09,.602);return g;}
// Batch each authored model once, then share its geometry on rebuilds.
function consolidate(g){g.updateMatrixWorld(true);const buckets=new Map();g.traverse(m=>{if(m.isMesh){const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrixWorld);if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(geo);m.geometry.dispose();}});const out=new T.Group();for(const [mat,list]of buckets){const geometry=mergeGeometries(list);list.forEach(g=>g.dispose());mesh(out,geometry,mat,0,0,0);}return out;}
function fit(source,w,h,d){const g=new T.Group(),clone=source.clone(true);const box=new T.Box3().setFromObject(clone),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());const scale=Math.min(w/size.x,h/size.y,d/size.z);clone.scale.multiplyScalar(scale);clone.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);g.add(clone);return g;}
export function isEquipment(type){return equipmentCatalog.some(c=>c.type===type);}
export function createEquipment(o){const spec=equipmentCatalog.find(c=>c.type===o.type);if(!spec)throw Error('Unknown equipment');if(!prototypes.has(o.type)){
 let g;if(o.type==='crateStack'){g=new T.Group();for(let i=0;i<3;i++){const crate=fit(imported.crateStack,spec.w,.29,spec.d);crate.position.y=i*.295;g.add(crate);}}
 else if(imported[o.type])g=fit(imported[o.type],spec.w,spec.h,spec.d);
 else g=consolidate({rollerConveyor:conveyor,rollCage:cage,parcelScale:scale}[o.type]());
 prototypes.set(o.type,g);
 }const instance=prototypes.get(o.type).clone(true);instance.scale.set(o.w/spec.w,o.h/spec.h,o.d/spec.d);return instance;}
