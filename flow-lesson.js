import * as T from 'three';
import {makeFlowLesson,alongFlow} from './flow-model.js';

const colors={in:'#63dbc5',out:'#f5b767'};
export class FlowLesson{
 constructor(studio){this.studio=studio;this.group=new T.Group();studio.scene.add(this.group);this.enabled=false;this.playing=false;this.filter='all';this.index=0;this.elapsed=0;this.speed=1;this.held=false;this.group.visible=false;}
 disposeVisuals(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.userData.fullMap?.dispose();o.userData.numberMap?.dispose();o.material.dispose();}});this.group.clear();}
 build(project){this.disposeVisuals();this.data=makeFlowLesson(project);this.index=this.filter==='out'?3:0;this.elapsed=0;this.playing=false;this.held=false;this.cargo=null;this.markers=[];this.routes=[];if(this.data.error)return;
  const material=color=>new T.MeshBasicMaterial({color,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:false});
  this.data.stages.forEach((stage,i)=>{
   if(stage.path.length>1){const points=stage.path.map(p=>new T.Vector3(p.x,.15,p.z));const curve=new T.CurvePath();for(let n=1;n<points.length;n++)curve.add(new T.LineCurve3(points[n-1],points[n]));const line=new T.Mesh(new T.TubeGeometry(curve,points.length*2,.23,6,false),material(colors[stage.kind]));line.renderOrder=6;line.userData.kind=stage.kind;this.group.add(line);this.routes.push(line);
    for(let n=2;n<points.length;n+=4){const direction=points[n].clone().sub(points[n-1]).normalize();const arrow=new T.Mesh(new T.ConeGeometry(.5,1.1,3),material(colors[stage.kind]));arrow.position.copy(points[n]);arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);arrow.renderOrder=7;arrow.userData.kind=stage.kind;this.group.add(arrow);this.routes.push(arrow);}
   }
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;const c=canvas.getContext('2d');c.fillStyle='#172b33';c.fillRect(0,0,256,80);c.fillStyle=colors[stage.kind];c.font='bold 25px Arial';c.textAlign='center';c.fillText(`${i+1} · ${stage.name}`,128,49,240);
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));label.position.set(stage.point.x,1.6+(i===3?1:0),stage.point.z);label.scale.set(4.5,1.4,1);label.renderOrder=10;const badge=document.createElement('canvas');badge.width=badge.height=80;const bc=badge.getContext('2d');bc.fillStyle='#172b33';bc.beginPath();bc.arc(40,40,36,0,Math.PI*2);bc.fill();bc.strokeStyle=colors[stage.kind];bc.lineWidth=3;bc.stroke();bc.fillStyle=colors[stage.kind];bc.font='bold 30px Arial';bc.textAlign='center';bc.fillText(i===2?'3/4':String(i+1),40,51);label.userData.fullMap=texture;label.userData.numberMap=new T.CanvasTexture(badge);label.userData.numberMap.colorSpace=T.SRGBColorSpace;this.group.add(label);this.markers.push(label);
  });
  this.cargo=new T.Group();const box=new T.Mesh(new T.BoxGeometry(.8,.65,.65),new T.MeshStandardMaterial({color:'#cfa571',roughness:.88}));box.position.y=.47;this.cargo.add(box);
  const tape=new T.Mesh(new T.BoxGeometry(.13,.66,.66),new T.MeshStandardMaterial({color:'#e9d7ad',roughness:.8}));tape.position.y=.47;this.cargo.add(tape);
  this.halo=new T.Mesh(new T.TorusGeometry(.7,.045,8,32),material(colors.in));this.halo.rotation.x=Math.PI/2;this.halo.position.y=.1;this.cargo.add(this.halo);this.group.add(this.cargo);this.sync();
 }
 get stages(){return this.data?.stages?.map((s,i)=>i).filter(i=>this.filter==='all'||this.data.stages[i].kind===this.filter)||[];}
 get current(){return this.data?.stages?.[this.index];}
 activate(value){this.enabled=value;this.group.visible=value&&this.studio.mode!=='2d';if(!value)this.playing=false;this.studio.needsRender=true;}
 choose(filter){this.filter=filter;this.go(this.stages[0]||0);}
 go(index){this.index=index;this.elapsed=0;this.playing=false;this.held=false;this.sync();this.onChange?.();}
 next(){const ids=this.stages,next=ids.indexOf(this.index)+1;this.go(ids[Math.min(ids.length-1,next)]??0);}
 get duration(){return Math.min(14,Math.max(5,(this.current?.path.length||1)*.18+3));}
 update(dt){this.group.visible=this.enabled&&this.studio.mode!=='2d';if(!this.group.visible||this.data?.error)return;this.sizeLabels();if(!this.playing)return;
  this.elapsed+=dt*this.speed;if(this.elapsed>=this.duration){const ids=this.stages,n=ids.indexOf(this.index)+1;if(n>=ids.length){this.elapsed=this.duration;this.playing=false;}else{this.index=ids[n];this.elapsed=0;}this.onChange?.();}
  this.sync();this.studio.needsRender=true;
 }
 sync(){if(!this.current||!this.cargo)return;const progress=Math.min(1,this.elapsed/Math.max(1,this.duration-2)),pos=alongFlow(this.current.path,progress);this.cargo.position.set(pos.x,0,pos.z);this.cargo.visible=!(this.index===6&&this.elapsed>=this.duration);this.halo.material.color.set(this.held?'#e36d68':colors[this.current.kind]);
  this.markers.forEach((m,i)=>{m.visible=this.stages.includes(i)&&!(i===3&&this.index!==3)&&!(i===2&&this.index===3);m.material.opacity=i===this.index?1:.85;m.material.map=i===this.index?m.userData.fullMap:m.userData.numberMap;});this.routes.forEach(r=>{r.visible=this.filter==='all'||r.userData.kind===this.filter;r.material.opacity=r.userData.kind===this.current.kind? 1:.62;});this.studio.needsRender=true;
 }
 sizeLabels(){const camera=this.studio.camera,height=this.studio.container.clientHeight||500;this.markers.forEach((m,i)=>{const unit=2*camera.position.distanceTo(m.position)*Math.tan(camera.fov*Math.PI/360)/height;const active=i===this.index;m.position.y=active?6:1.3;m.renderOrder=active?20:10;m.scale.set(unit*(active?150:30),unit*(active?47:30),1);});}
 render(panel){
  panel.innerHTML=`<div class="eyebrow">LEGGERE IL MAGAZZINO</div><h2>Il viaggio della merce</h2><p class="muted">Segui un lotto simbolico dall’arrivo alla partenza.</p><div class="flow-switch"><button data-flow="all">Ciclo completo</button><button data-flow="in">Entrata</button><button data-flow="out">Uscita</button></div><div class="flow-key"><span>● Entrata</span><span>● Uscita</span></div>`;
  panel.querySelectorAll('[data-flow]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.flow===this.filter));b.onclick=()=>{this.choose(b.dataset.flow);this.render(panel);};});
  if(this.data?.error){const warning=document.createElement('p');warning.className='issue';warning.textContent=this.data.error;panel.append(warning);return;}
  const body=document.createElement('div');body.innerHTML=`<div class="flow-controls"><button id="flow-play">Avvia ciclo</button><button id="flow-next">Passo successivo →</button><button id="flow-reset" title="Ricomincia il percorso">↺</button></div><label class="flow-speed">Velocità didattica <select id="flow-speed"><option value=".5">Lenta</option><option value="1">Normale</option><option value="2">Rapida</option></select></label><ol class="flow-steps">${this.stages.map(i=>`<li><button data-stage="${i}"><span>${i+1}</span>${this.data.stages[i].name}</button></li>`).join('')}</ol><article class="flow-detail" aria-live="polite"><b id="flow-title"></b><p id="flow-text"></p><p id="flow-question"></p></article><button id="flow-hold">Segnala collo da verificare</button><p class="flow-note">Collo simbolico e tempi accelerati. Le linee collegano le tappe negli spazi liberi. L’area di controllo e le baie sono illustrative.</p>`;panel.append(body);
  panel.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>this.go(Number(b.dataset.stage)));
  panel.querySelector('#flow-play').onclick=()=>{if(this.held){this.held=false;}if(this.elapsed>=this.duration&&this.index===this.stages.at(-1))this.go(this.stages[0]);this.playing=!this.playing;this.refresh(panel);this.sync();};
  panel.querySelector('#flow-next').onclick=()=>this.next();panel.querySelector('#flow-reset').onclick=()=>this.go(this.stages[0]);
  panel.querySelector('#flow-speed').value=String(this.speed);panel.querySelector('#flow-speed').onchange=e=>this.speed=Number(e.target.value);
  panel.querySelector('#flow-hold').onclick=()=>{this.playing=false;this.held=true;this.elapsed=this.duration;this.sync();this.refresh(panel);};
  this.onChange=()=>{if(panel.querySelector('#flow-title'))this.refresh(panel);};this.refresh(panel);
 }
 refresh(panel){const s=this.current;if(!s||!panel.querySelector('#flow-title'))return;
  const complete=this.elapsed>=this.duration&&this.index===this.stages.at(-1)&&!this.held;
  panel.querySelector('#flow-title').textContent=complete?(this.index===6?'Spedizione conclusa':'Lotto disponibile a stock'):this.held?'Lotto in attesa di verifica':`${this.index+1} / 7 · ${s.name}`;
  panel.querySelector('#flow-text').textContent=complete?(this.index===6?'Il lotto ha concluso il percorso di uscita. Il carico è confermato e la spedizione viene registrata.':'Il lotto è stato accettato e la sua ubicazione è registrata. Sarà disponibile per un ordine cliente.'):this.held?'Il lotto resta al controllo. Non viene trasferito a stock finché l’anomalia non è chiarita. Usa Riprendi dopo la verifica.':s.text;
  panel.querySelector('#flow-question').textContent=this.held?'Esempi: quantità diversa, imballo danneggiato, etichetta illeggibile.':s.question;
  panel.querySelector('#flow-play').textContent=this.held?'Riprendi dopo verifica':this.playing?'Pausa flusso':this.elapsed>=this.duration&&this.index===this.stages.at(-1)?'Ricomincia ciclo':'Avvia flusso';
  panel.querySelector('#flow-next').disabled=this.held||this.index===this.stages.at(-1);panel.querySelector('#flow-hold').hidden=this.index!==1||this.held;
  panel.querySelectorAll('[data-stage]').forEach(b=>{b.setAttribute('aria-current',String(Number(b.dataset.stage)===this.index));});
 }
}
