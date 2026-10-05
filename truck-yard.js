import * as T from 'three';
import {truckCycle} from './templates.js';

export function createTruckYard(project){
 const root=new T.Group(),truck=new T.Group(),wheels=[],depth=project.depth,edge=depth/2,x=Math.min(16,project.width/2-4);
 const mats=new Map();
 const material=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.72}));return mats.get(color);};
 function mesh(parent,geometry,color,px,py,pz){const m=new T.Mesh(geometry,material(color));m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;m.userData.owned=true;m.userData.uniqueMaterial=true;parent.add(m);return m;}
 const box=(g,w,h,d,x,y,z,c)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 function label(g,text,w,h,px,py,pz,ground=false){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#e9eee7';ctx.fillRect(0,0,512,128);ctx.fillStyle='#214e42';ctx.font='600 45px Arial';ctx.textAlign='center';ctx.fillText(text,256,80,490);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map:tex,side:T.DoubleSide});const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(px,py,pz);if(ground)m.rotation.x=-Math.PI/2;m.userData.owned=true;m.userData.uniqueMaterial=true;root.userData.maps.push(tex);g.add(m);return m;}
 root.userData.maps=[];
 box(root,project.width,.18,34,0,-.12,edge+17,'#626e73');box(root,6,.18,12,x,-.12,edge+40,'#626e73');
 for(const xx of [x-2.4,x+2.4])box(root,.1,.012,31,xx,.005,edge+16,'#e7cf82');
 for(let z=edge+6;z<edge+32;z+=4)box(root,.12,.014,1.6,x,.008,z,'#dde4df');
 box(root,5,.012,.15,x,.01,edge+1,'#e7cf82');label(root,'BAIA SPEDIZIONI',7,1.4,x,.035,edge+1,true);
 label(root,'PIAZZALE · ACCESSO MEZZI',11,1.5,-10,.035,edge+27,true);
 for(const xx of [x-2.7,x+2.7]){box(root,.28,1.1,.28,xx,.55,edge+.5,'#e8bd4f');box(root,.3,.16,.3,xx,.7,edge+.5,'#26343a');}
 for(const xx of [-project.width/2,project.width/2])box(root,.3,.3,33,xx,.1,edge+17,'#b7beb7');
 // 10 m rigid box truck, rear at -Z and cab at +Z.
 box(truck,2.4,.24,9.5,0,.72,0,'#29353e');box(truck,2.5,2.8,6.7,0,2.3,-1.1,'#e0e6df');
 for(const xx of [-1.26,1.26]){box(truck,.04,.17,6.6,xx,1.1,-1.1,'#47786b');for(let z=-4.2;z<2;z+=.5)box(truck,.018,2.55,.025,xx,2.3,z,'#bbc7c0');}
 box(truck,2.48,2.4,2.35,0,1.9,3.55,'#245f56');box(truck,2.15,.8,.025,0,2.55,4.74,'#83a9b5');
 box(truck,2.45,.33,.25,0,.91,4.84,'#c5d1ce');box(truck,1.18,.34,.025,0,1.25,4.86,'#263740');
 for(const xx of [-.9,.9]){box(truck,.4,.18,.05,xx,1.12,4.88,'#fff5c6');box(truck,.15,.14,.06,xx,1.4,4.85,'#ecaa43');}
 for(const xx of [-1.26,1.26]){box(truck,.025,.75,1.4,xx,2.55,3.6,'#83a9b5');box(truck,.2,.15,.7,xx,.65,3.5,'#bbc7c0');box(truck,.35,.07,.08,xx*1.1,2.1,4.25,'#273941');box(truck,.12,.4,.25,xx*1.22,2.3,4.25,'#263740');}
 for(const z of [-3,-1.7,3.55])for(const xx of [-1.16,1.16]){const wheel=mesh(truck,new T.CylinderGeometry(.48,.48,.26,20),'#20272b',xx,.49,z);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=mesh(truck,new T.CylinderGeometry(.24,.24,.28,16),'#9aa8aa',xx,.49,z);hub.rotation.z=Math.PI/2;}
 for(const xx of [-.63,.63]){box(truck,1.21,2.55,.045,xx,2.27,-4.48,'#ced8d2');box(truck,.035,2.15,.06,xx,2.3,-4.53,'#677d7b');box(truck,.38,.14,.04,xx,.9,-4.53,'#c94b3d');}
 label(truck,'WAREHOUSE LAB',2,.5,0,3.1,4.76);
 const side=label(truck,'WAREHOUSE LAB',4,.8,-1.285,2.5,-1.1);side.rotation.y=-Math.PI/2;
 truck.position.x=x;root.add(truck);
 return {root,truck,update(time){const state=truckCycle(time,depth);truck.position.z=state.z;truck.visible=state.visible;for(const wheel of wheels)wheel.rotation.x=(state.z-edge)/.48;return state;}};
}
