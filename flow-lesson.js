import * as T from 'three';
import {makeFlowLesson,alongFlow} from './flow-model.js';

const colors={in:'#63dbc5',out:'#f5b767'};
export class FlowLesson{
 constructor(studio){this.studio=studio;this.group=new T.Group();studio.scene.add(this.group);this.enabled=false;this.playing=false;this.filter='all';this.index=0;this.elapsed=0;this.speed=1;this.held=false;this.group.visible=false;
  this.hud=document.createElement('div');this.hud.className='flow-hud';this.hud.hidden=true;
  this.hud.innerHTML='<div class="flow-hud-top"><span class="flow-hud-type"></span><span class="flow-hud-state"></span></div><div class="flow-hud-main"><span class="flow-hud-number"></span><strong></strong></div><div class="flow-hud-progress"><i></i></div>';
  studio.container.append(this.hud);this.hudFill=this.hud.querySelector('i');
 }
 disposeVisuals(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.userData.fullMap?.dispose();o.userData.numberMap?.dispose();o.material.dispose();}});this.group.clear();}
 build(project){this.disposeVisuals();this.data=makeFlowLesson(project);this.index=this.filter==='out'?3:0;this.elapsed=0;this.playing=false;this.held=false;this.cargo=null;this.markers=[];this.routes=[];this.particles=[];this.leaders=[];if(this.data.error)return;
  const material=color=>new T.MeshBasicMaterial({color,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:false});
  this.data.stages.forEach((stage,i)=>{
   if(stage.path.length>1){const points=stage.path.map(p=>new T.Vector3(p.x,.15,p.z));const curve=new T.CurvePath();for(let n=1;n<points.length;n++)curve.add(new T.LineCurve3(points[n-1],points[n]));const line=new T.Mesh(new T.TubeGeometry(curve,points.length*2,.15,6,false),material(colors[stage.kind]));line.renderOrder=6;line.userData.kind=stage.kind;line.userData.stage=i;this.group.add(line);this.routes.push(line);
    for(let n=3;n<points.length;n+=6){const direction=points[n].clone().sub(points[n-1]).normalize();const arrow=new T.Mesh(new T.ConeGeometry(.32,.75,3),material(colors[stage.kind]));arrow.position.copy(points[n]);arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);arrow.renderOrder=7;arrow.userData.kind=stage.kind;arrow.userData.stage=i;this.group.add(arrow);this.routes.push(arrow);}

   }
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
   c.shadowColor='#081d2866';c.shadowBlur=10;c.shadowOffsetY=4;c.fillStyle='#f8fcfa';c.beginPath();c.roundRect(14,14,100,100,34);c.fill();c.shadowColor='transparent';c.strokeStyle=colors[stage.kind];c.lineWidth=5;c.stroke();
   c.fillStyle='#23453e';c.font='600 43px "DM Sans", Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(i===2?'3·4':String(i+1).padStart(2,'0'),64,66);
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false}));label.position.set(stage.point.x,.65,stage.point.z);label.renderOrder=10;this.group.add(label);this.markers.push(label);
   const leader=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:colors[stage.kind],transparent:true,opacity:.5,depthTest:false,depthWrite:false,toneMapped:false}));leader.renderOrder=9;this.group.add(leader);this.leaders.push(leader);

  });
  for(let i=0;i<3;i++){const dot=new T.Mesh(new T.SphereGeometry(.22,10,8),material(colors.in));dot.renderOrder=8;this.group.add(dot);this.particles.push(dot);}
  this.cargo=new T.Group();const box=new T.Mesh(new T.BoxGeometry(.8,.65,.65),new T.MeshStandardMaterial({color:'#cfa571',roughness:.88}));box.position.y=.47;this.cargo.add(box);
  const tape=new T.Mesh(new T.BoxGeometry(.13,.66,.66),new T.MeshStandardMaterial({color:'#e9d7ad',roughness:.8}));tape.position.y=.47;this.cargo.add(tape);
  this.halo=new T.Mesh(new T.TorusGeometry(.7,.045,8,32),material(colors.in));this.halo.rotation.x=Math.PI/2;this.halo.position.y=.1;this.cargo.add(this.halo);this.group.add(this.cargo);this.sync();
 }
 get stages(){return this.data?.stages?.map((s,i)=>i).filter(i=>this.filter==='all'||this.data.stages[i].kind===this.filter)||[];}
 get current(){return this.data?.stages?.[this.index];}
 activate(value){this.enabled=value;this.hud.hidden=!value;this.group.visible=value&&this.studio.mode!=='2d';if(!value)this.playing=false;this.updateHud();this.studio.needsRender=true;}
 choose(filter){this.filter=filter;this.go(this.stages[0]||0);}
 go(index){this.index=index;this.elapsed=0;this.playing=false;this.held=false;this.sync();this.onChange?.();}
 next(){const ids=this.stages,next=ids.indexOf(this.index)+1;this.go(ids[Math.min(ids.length-1,next)]??0);}
 get duration(){return Math.min(14,Math.max(5,(this.current?.path.length||1)*.18+3));}
 update(dt){this.group.visible=this.enabled&&this.studio.mode!=='2d';if(!this.group.visible||this.data?.error)return;this.sizeLabels();if(!this.playing)return;
  this.elapsed+=dt*this.speed;if(this.elapsed>=this.duration){const ids=this.stages,n=ids.indexOf(this.index)+1;if(n>=ids.length){this.elapsed=this.duration;this.playing=false;}else{this.index=ids[n];this.elapsed=0;}this.onChange?.();}
  this.sync();this.studio.needsRender=true;
 }
 sync(){if(!this.current||!this.cargo)return;const progress=Math.min(1,this.elapsed/Math.max(1,this.duration-2)),pos=alongFlow(this.current.path,progress);this.cargo.position.set(pos.x,0,pos.z);this.cargo.visible=!(this.index===6&&this.elapsed>=this.duration);this.halo.material.color.set(this.held?'#e36d68':colors[this.current.kind]);
  this.markers.forEach((m,i)=>{m.visible=this.stages.includes(i)&&!(i===3&&this.index!==3)&&!(i===2&&this.index===3);m.material.opacity=i===this.index?1:.8;});this.routes.forEach(r=>{r.visible=this.filter==='all'||r.userData.kind===this.filter;r.material.opacity=r.userData.stage===this.index ? 1 : r.userData.kind===this.current.kind ? .55 : .3;});
  this.particles.forEach((dot,i)=>{dot.visible=this.current.path.length>1&&!this.held&&progress<1;const p=alongFlow(this.current.path,(progress+i/3)%1);dot.position.set(p.x,.23,p.z);dot.material.color.set(colors[this.current.kind]);dot.material.opacity=1-i*.22;});
  this.updateHud();this.studio.needsRender=true;
 }
 updateHud(){if(!this.current){this.hud.hidden=true;return;}const s=this.current,complete=this.elapsed>=this.duration&&this.index===this.stages.at(-1)&&!this.held;this.hud.dataset.kind=s.kind;this.hud.dataset.held=String(this.held);this.hud.querySelector('.flow-hud-type').textContent=s.kind==='in'?'FLUSSO IN ENTRATA':'FLUSSO IN USCITA';this.hud.querySelector('.flow-hud-state').textContent=this.held?'In verifica':complete?'Completato':this.playing?'In movimento':'In pausa';this.hud.querySelector('.flow-hud-number').textContent=String(this.index+1).padStart(2,'0');this.hud.querySelector('strong').textContent=s.name;this.hudFill.style.width=`${Math.min(100,this.elapsed/this.duration*100)}%`;
 }
 sizeLabels(){
  const camera=this.studio.camera,height=this.studio.container.clientHeight||500,width=this.studio.container.clientWidth||800,placed=[];
  const order=[this.index,...this.markers.map((_,i)=>i).filter(i=>i!==this.index)];
  for(const i of order){const m=this.markers[i],leader=this.leaders[i];leader.visible=false;if(!m.visible)continue;
   const p=this.data.stages[i].point,anchor=new T.Vector3(p.x,.65,p.z),screen=anchor.clone().project(camera);if(screen.z>1||screen.z< -1)continue;
   const originalX=(screen.x+1)*width/2,originalY=(1-screen.y)*height/2;let x=originalX,y=originalY;
   const candidates=[[0,0],[0,-36],[36,0],[-36,0],[0,36],[36,-36],[-36,-36],[36,36],[-36,36],[0,-72],[72,0],[-72,0]];
   for(const [dx,dy]of candidates){const tx=originalX+dx,ty=originalY+dy;if(tx<18||tx>width-18||ty<18||ty>height-18)continue;if(!placed.some(o=>Math.abs(o.x-tx)<35&&Math.abs(o.y-ty)<35)){x=tx;y=ty;break;}}
   placed.push({x,y});screen.x=x/width*2-1;screen.y=1-y/height*2;m.position.copy(screen.unproject(camera));
   const active=i===this.index,unit=2*camera.position.distanceTo(m.position)*Math.tan(camera.fov*Math.PI/360)/height;m.renderOrder=active?20:10;m.scale.setScalar(unit*(active?38:30));
   if(y!==originalY||x!==originalX){const pos=leader.geometry.attributes.position;pos.setXYZ(0,anchor.x,anchor.y,anchor.z);pos.setXYZ(1,m.position.x,m.position.y,m.position.z);pos.needsUpdate=true;leader.geometry.computeBoundingSphere();leader.visible=true;}
  }
 }

 render(panel){
  panel.innerHTML=`<div class="eyebrow">LOGISTICA IN MOVIMENTO</div><h2>Il viaggio della merce</h2><p class="muted">Segui un lotto simbolico dall’arrivo alla partenza.</p><div class="flow-switch"><button data-flow="all">Ciclo completo</button><button data-flow="in">Entrata</button><button data-flow="out">Uscita</button></div><div class="flow-key"><span>Entrata</span><span>Uscita</span></div>`;
  panel.querySelectorAll('[data-flow]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.flow===this.filter));b.onclick=()=>{this.choose(b.dataset.flow);this.render(panel);};});
  if(this.data?.error){const warning=document.createElement('p');warning.className='issue';warning.textContent=this.data.error;panel.append(warning);return;}
  const body=document.createElement('div');body.innerHTML=`<div class="flow-controls"><button id="flow-play">Avvia ciclo</button><button id="flow-next">Passo successivo →</button><button id="flow-reset" title="Ricomincia il percorso">↺</button></div><label class="flow-speed">Velocità didattica <select id="flow-speed"><option value=".5">Lenta</option><option value="1">Normale</option><option value="2">Rapida</option></select></label><ol class="flow-steps">${this.stages.map(i=>`<li><button data-stage="${i}" data-kind="${this.data.stages[i].kind}"><span>${String(i+1).padStart(2,'0')}</span>${this.data.stages[i].name}</button></li>`).join('')}</ol><article class="flow-detail" aria-live="polite"><div class="flow-detail-label">LA FASE ATTUALE</div><b id="flow-title"></b><p id="flow-text"></p><p id="flow-question"></p></article><button id="flow-hold">Segnala collo da verificare</button><p class="flow-note">Collo simbolico e tempi accelerati. Le linee collegano le tappe negli spazi liberi. L’area di controllo e le baie sono illustrative.</p>`;panel.append(body);body.insertBefore(body.querySelector('.flow-detail'),body.querySelector('.flow-steps'));
  panel.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>this.go(Number(b.dataset.stage)));
  panel.querySelector('#flow-play').onclick=()=>{if(this.held){this.held=false;}if(this.elapsed>=this.duration&&this.index===this.stages.at(-1))this.go(this.stages[0]);this.playing=!this.playing;this.refresh(panel);this.sync();};
  panel.querySelector('#flow-next').onclick=()=>this.next();panel.querySelector('#flow-reset').onclick=()=>this.go(this.stages[0]);
  panel.querySelector('#flow-speed').value=String(this.speed);panel.querySelector('#flow-speed').onchange=e=>this.speed=Number(e.target.value);
  panel.querySelector('#flow-hold').onclick=()=>{this.playing=false;this.held=true;this.elapsed=this.duration;this.sync();this.refresh(panel);};
  this.onChange=()=>{if(panel.querySelector('#flow-title'))this.refresh(panel);};this.refresh(panel);
 }
 refresh(panel){this.updateHud();const s=this.current;if(!s||!panel.querySelector('#flow-title'))return;
  const complete=this.elapsed>=this.duration&&this.index===this.stages.at(-1)&&!this.held;
  panel.querySelector('.flow-detail').dataset.kind=s.kind;panel.querySelector('.flow-detail').dataset.held=String(this.held);
  panel.querySelector('#flow-title').textContent=complete?(this.index===6?'Spedizione conclusa':'Lotto disponibile a stock'):this.held?'Lotto in attesa di verifica':s.name;
  panel.querySelector('#flow-text').textContent=complete?(this.index===6?'Il lotto ha concluso il percorso di uscita. Il carico è confermato e la spedizione viene registrata.':'Il lotto è stato accettato e la sua ubicazione è registrata. Sarà disponibile per un ordine cliente.'):this.held?'Il lotto resta al controllo. Non viene trasferito a stock finché l’anomalia non è chiarita. Usa Riprendi dopo la verifica.':s.text;
  panel.querySelector('#flow-question').textContent=this.held?'Esempi: quantità diversa, imballo danneggiato, etichetta illeggibile.':s.question;
  panel.querySelector('#flow-play').textContent=this.held?'Riprendi dopo verifica':this.playing?'Pausa flusso':this.elapsed>=this.duration&&this.index===this.stages.at(-1)?'Ricomincia ciclo':'Avvia flusso';
  panel.querySelector('#flow-next').disabled=this.held||this.index===this.stages.at(-1);panel.querySelector('#flow-hold').hidden=this.index!==1||this.held;
  panel.querySelectorAll('[data-stage]').forEach(b=>{b.setAttribute('aria-current',String(Number(b.dataset.stage)===this.index));b.dataset.done=String(Number(b.dataset.stage)<this.index);});
 }
}
