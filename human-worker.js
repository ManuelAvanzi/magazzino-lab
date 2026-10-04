import * as T from 'three';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {clone} from './vendor/addons/utils/SkeletonUtils.js';

// CC0 MakeHuman anatomy, fitted clothing and a shared rig. See assets/people/CREDITS.md.
const source=await new GLTFLoader().loadAsync('./assets/people/operator.glb');
source.scene.updateMatrixWorld(true);
source.scene.traverse(mesh=>{
 if(!mesh.isMesh)return;
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 const original=mesh.material;
 mesh.material=new T.MeshStandardMaterial({map:original.map,roughness:.86,metalness:0,side:T.FrontSide});
 if(mesh.name.includes('casualsuit')){
  mesh.material.map=null;
  mesh.material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vWorkPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorkPosition=position;');
   shader.fragmentShader='varying vec3 vWorkPosition;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float y=vWorkPosition.y;float x=abs(vWorkPosition.x);
    float vest=smoothstep(1.04,1.055,y)*(1.-smoothstep(1.635,1.65,y))*(1.-smoothstep(.213,.222,x));
    float belt=(step(1.16,y)-step(1.20,y))+(step(1.27,y)-step(1.31,y));
    float shoulder=step(1.31,y)*(1.-step(.019,abs(x-.135)));
    vec3 fabric=mix(vec3(.029,.054,.075),vec3(.76,.39,.025),vest);
    fabric=mix(fabric,vec3(.58,.65,.63),vest*clamp(belt+shoulder,0.,1.));
    float weave=1.-.025*(.5+.5*sin(y*1800.)*sin(vWorkPosition.x*1800.));
    diffuseColor.rgb*=fabric*weave;`);
  };
  mesh.material.customProgramCacheKey=()=> 'warehouse-workwear-v1';
 }
 if(mesh.name.includes('shoes')){mesh.material.map=null;mesh.material.color.set('#393c3d');mesh.material.roughness=.72;}
});

// Fit the helmet in bind space, then attach it to the actual head bone.
const helmet=new T.Group(),helmetMat=new T.MeshStandardMaterial({color:'#e6b83b',roughness:.56});
const dome=new T.Mesh(new T.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),helmetMat);
dome.scale.set(.112,.095,.137);dome.position.set(0,1.88,.035);helmet.add(dome);
const brim=new T.Mesh(new T.CylinderGeometry(.125,.125,.014,32),helmetMat);
brim.scale.z=1.24;brim.position.set(0,1.88,.05);helmet.add(brim);
const glassesMat=new T.MeshStandardMaterial({color:'#586669',roughness:.3,metalness:.12});
for(const x of [-.034,.034]){
 const lens=new T.Mesh(new T.SphereGeometry(1,16,8),glassesMat);
 lens.scale.set(.029,.017,.008);lens.position.set(x,1.823,.152);helmet.add(lens);
 const temple=new T.Mesh(new T.BoxGeometry(.006,.005,.075),glassesMat);temple.position.set(x<0?-.065:.065,1.83,.115);helmet.add(temple);
}
const bridge=new T.Mesh(new T.BoxGeometry(.021,.005,.007),glassesMat);bridge.position.set(0,1.826,.155);helmet.add(bridge);
helmet.traverse(o=>{if(o.isMesh)o.castShadow=true;});
// Accessories must use the mesh's bind transform, not the exported posed bone
// transform. Otherwise the helmet shifts and tilts when animation begins.
const headBone=source.scene.getObjectByName('head');
let headBindInverse;
source.scene.traverse(m=>{if(m.isSkinnedMesh&&!headBindInverse){const i=m.skeleton.bones.indexOf(headBone);if(i>=0)headBindInverse=m.skeleton.boneInverses[i].clone().multiply(m.bindMatrix);}});
helmet.applyMatrix4(headBindInverse);headBone.add(helmet);

const clips=Object.fromEntries(source.animations.filter(c=>['idle','walk'].includes(c.name)).map(c=>[c.name,c]));
function poseSamplers(body,clip){return clip.tracks.map(track=>{
 const split=track.name.lastIndexOf('.'),node=body.getObjectByName(track.name.slice(0,split)),property=track.name.slice(split+1);
 return {node,property,sample:track.createInterpolant()};
});}
function samplePose(h,name,time){
 const clip=clips[name],t=((time%clip.duration)+clip.duration)%clip.duration;
 for(const {node,property,sample} of h.samples[name])if(node&&node[property]?.fromArray)node[property].fromArray(sample.evaluate(t));
}

export function createHumanWorker(o){
 const group=new T.Group(),body=clone(source.scene);group.add(body);
 const h={body,samples:{idle:poseSamplers(body,clips.idle),walk:poseSamplers(body,clips.walk)},travel:0,lastTime:null};
 samplePose(h,'idle',0);body.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(body),scale=1.8/(box.max.y-box.min.y);
 body.scale.setScalar(scale);body.position.y=-box.min.y*scale;
 // Exported glTF faces +Z. Each instance has independent bones and mixer,
 // while geometry and textures remain shared across the warehouse.
 group.scale.set(o.w/.65,o.h/1.8,o.d/.65);
 h.baseY=body.position.y;group.updateMatrixWorld(true);
 h.restFootY=Math.min(...['l','r'].map(side=>group.worldToLocal(body.getObjectByName('foot_'+side).getWorldPosition(new T.Vector3())).y));
 group.userData.human=h;
 animateHuman(group,0,0,0,false,true);
 return group;
}

export function animateHuman(group,time,pace,phase,packing,reset=false){
 const h=group.userData.human;if(!h)return;
 h.body.position.y=h.baseY;
 const dt=reset||h.lastTime===null?0:Math.max(0,Math.min(.1,time-h.lastTime));
 h.lastTime=time;if(reset)h.travel=0;else h.travel+=pace*.65*dt;
 // Sample every track explicitly. AnimationMixer may skip unchanged values;
 // applying additive rotations afterwards used to accumulate them each frame.
 samplePose(h,'idle',reset?0:time*.35+phase);
 h.body.updateMatrixWorld(true);
 const bodyRotation=h.body.getWorldQuaternion(new T.Quaternion());
 const aim=(bone,direction)=>{
  if(!bone)return;h.body.updateMatrixWorld(true);
  const target=direction.normalize().applyQuaternion(bodyRotation).applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert());
  const current=new T.Vector3(0,1,0).applyQuaternion(bone.quaternion);
  bone.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(current,target));
 };
 // The imported walk uses different limb axes. Drive the legs in the actor's
 // sagittal plane instead: no lateral crossing, knees bend backwards, and feet
 // retain their orientation rather than inheriting thigh/calf twist.
 const stride=h.travel/.85*Math.PI*2;
 if(pace>.08)for(const [side,offset] of [['l',0],['r',Math.PI]]){
  const thigh=h.body.getObjectByName('thigh_'+side),calf=h.body.getObjectByName('calf_'+side),foot=h.body.getObjectByName('foot_'+side);
  const footOrientation=foot.getWorldQuaternion(new T.Quaternion());
  const phase=stride+offset,angle=Math.cos(phase)*.3,knee=.08+Math.max(0,-Math.sin(phase))*.55;
  aim(thigh,new T.Vector3(0,-Math.cos(angle),Math.sin(angle)));
  aim(calf,new T.Vector3(0,-Math.cos(angle-knee),Math.sin(angle-knee)));
  h.body.updateMatrixWorld(true);foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(footOrientation));
 }
 if(pace>.08){group.updateMatrixWorld(true);const lowest=Math.min(...['l','r'].map(side=>group.worldToLocal(h.body.getObjectByName('foot_'+side).getWorldPosition(new T.Vector3())).y));h.body.position.y+=h.restFootY-lowest;}
 // Lower the source's presentation pose into a relaxed working stance while
 // retaining bone roll and the original continuous skin deformation.
 for(const [side,sign] of [['l',1],['r',-1]]){
  const arm=h.body.getObjectByName('upperarm_'+side);if(!arm)continue;
  const parentRotation=arm.parent.getWorldQuaternion(new T.Quaternion()).invert();
  const target=new T.Vector3(sign*.16,-1,packing?.32:-pace*Math.cos(stride+(sign>0?0:Math.PI))*.26).normalize().applyQuaternion(h.body.getWorldQuaternion(new T.Quaternion())).applyQuaternion(parentRotation);
  const current=new T.Vector3(0,1,0).applyQuaternion(arm.quaternion);
  arm.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(current,target));
 }
 // Relaxed task gestures are layered on top of the skinned idle, not rigid limbs.
 if(packing&&!reset){
  for(const side of ['l','r']){const arm=h.body.getObjectByName('upperarm_'+side),forearm=h.body.getObjectByName('lowerarm_'+side);
   if(forearm){h.body.updateMatrixWorld(true);const parentInverse=forearm.parent.getWorldQuaternion(new T.Quaternion()).invert();
    const target=new T.Vector3(side==='l'?.08:-.08,-.35,1).normalize().applyQuaternion(h.body.getWorldQuaternion(new T.Quaternion())).applyQuaternion(parentInverse);
    const current=new T.Vector3(0,1,0).applyQuaternion(forearm.quaternion);
    forearm.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(current,target));
    forearm.rotateY(Math.sin(time*1.3+phase+(side==='l'?0:1.4))*.035);
   }
  }
 }
}
