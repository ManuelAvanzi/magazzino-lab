import {bounds,isZone} from './model.js';
import {placeInWarehouse} from './editor-model.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={worker:['#fae29d','#9b7035'],warningSign:['#ffecaa','#96752c'],exitSign:['#cce5d0','#4c8057'],speedSign:['#f8e4de','#b56250'],barrier:['#f2d796','#8b723b'],rack:['#dce6d6','#66835c'],pallet:['#eed8b6','#977549'],forklift:['#f0cf7d','#9e7523'],bench:['#d3dce4','#697e91'],pedestrian:['#d2e9df','#4d9479'],vehicle:['#f1e5bb','#b39b42'],shipping:['#d4e5ed','#6d97aa'],exit:['#cce2c7','#588255']};

export class PlanEditor {
  constructor(container,{select,move,notice}) {
    Object.assign(this,{container,select,move,notice,step:.1,zoom:1,pan:{x:0,z:0}});
    this.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.svg.classList.add('plan-canvas');this.svg.setAttribute('aria-label','Pianta modificabile del magazzino');
    this.svg.setAttribute('tabindex','0');this.svg.setAttribute("hidden", "");container.append(this.svg);
    this.svg.addEventListener('pointerdown',e=>this.down(e));
    this.svg.addEventListener('pointermove',e=>this.pointerMove(e));
    this.svg.addEventListener('pointerup',e=>this.up(e));
    this.svg.addEventListener('pointercancel',()=>this.cancel());
    this.svg.addEventListener('lostpointercapture',()=>{if(this.drag)this.cancel();});
    this.svg.addEventListener('contextmenu',e=>e.preventDefault());
    this.svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.6,Math.min(6,this.zoom*Math.exp(-e.deltaY*.001)));this.view();},{passive:false});
    this.svg.addEventListener('keydown',e=>{if(e.key==='Escape'){this.cancel();e.preventDefault();}if(e.key==='Enter'&&e.target.dataset.id){this.select(e.target.dataset.id);e.preventDefault();}});
    new ResizeObserver(()=>this.view()).observe(container);
  }
  setVisible(value){this.cancel();this.svg.toggleAttribute("hidden",!value);if(value)this.view();}
  center(){this.zoom=1;this.pan={x:0,z:0};this.view();}
  zoomBy(factor){this.zoom=Math.max(.6,Math.min(6,this.zoom*factor));this.view();}
  focus(id){const o=this.project.objects.find(o=>o.id===id);if(o){this.zoom=2;this.pan={x:o.x,z:o.z};this.view();}}
  view(){if(!this.project||this.svg.hasAttribute("hidden"))return;const ratio=this.container.clientWidth/Math.max(1,this.container.clientHeight);let h=(this.project.depth+9)/this.zoom,w=h*ratio;if(w<(this.project.width+9)/this.zoom){w=(this.project.width+9)/this.zoom;h=w/ratio;}this.svg.setAttribute('viewBox',`${this.pan.x-w/2} ${this.pan.z-h/2} ${w} ${h}`);}
  render(project,selected,issues=[]){this.cancel();this.project=project;this.selected=selected;this.svg.setAttribute("aria-label","Pianta modificabile del magazzino");this.issues=new Set(issues.flatMap(i=>i.ids||[i.id]));this.draw();this.view();}
  draw(){if(!this.project)return;const p=this.project;
    const ordered=[...p.objects].sort((a,b)=>Number(isZone(b))-Number(isZone(a)));
    this.svg.innerHTML=`<defs><pattern id="plan-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#d7ddd0" stroke-width=".025"/></pattern></defs><rect x="${-p.width/2}" y="${-p.depth/2}" width="${p.width}" height="${p.depth}" fill="#fafbf6" stroke="#61765b" stroke-width=".16"/><rect x="${-p.width/2}" y="${-p.depth/2}" width="${p.width}" height="${p.depth}" fill="url(#plan-grid)" pointer-events="none"/><g class="plan-dimensions" fill="#62735a" font-size=".65" text-anchor="middle"><text x="0" y="${-p.depth/2-1}">${p.width} m</text><text transform="translate(${-p.width/2-1.2} 0) rotate(-90)">${p.depth} m</text></g>`+ordered.map(o=>{
      const [fill,stroke]=colors[o.type],warning=this.issues.has(o.id),active=o.id===this.selected;
      const label=o.type==='worker'?'OP':o.type==='warningSign'?'!':o.type==='exitSign'?'→':o.type==='speedSign'?'5':o.type==='barrier'?'':o.type==='rack'?'SC':o.type==='pallet'?'P':o.type==='forklift'?'MEZZO':o.type==='bench'?'BANCO':o.name.toUpperCase();
      return `<g data-id="${esc(o.id)}" transform="translate(${o.x} ${o.z}) rotate(${o.rotation})" role="button" tabindex="0" aria-label="${esc(o.name)} · X ${o.x}, Z ${o.z} metri${warning?' · interferenza':''}" class="plan-object${active?' selected':''}"><title>${esc(o.name)} · ${o.w} × ${o.d} m</title><rect x="${-o.w/2}" y="${-o.d/2}" width="${o.w}" height="${o.d}" rx=".06" fill="${fill}" fill-opacity="${isZone(o)?'.68':'1'}" stroke="${active?'#244d3b':warning?'#c06b39':stroke}" stroke-width="${active?.16:.07}" ${isZone(o)?'stroke-dasharray=".3 .15"':''}/>${o.type==='rack'?`<path d="M${-o.w/2} 0H${o.w/2}M0 ${-o.d/2}V${o.d/2}" stroke="${stroke}" stroke-width=".035"/>`:''}<text text-anchor="middle" dominant-baseline="middle" font-size="${Math.max(.16,Math.min(.45,o.w/(label.length*.7),o.d*.35))}" fill="#334739" pointer-events="none">${esc(label)}</text>${active?`<circle cx="${o.w/2}" cy="${-o.d/2}" r=".14" fill="#234a3e"/>`:''}</g>`;
    }).join('');
  }
  point(e){const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(this.svg.getScreenCTM().inverse());return {x:pt.x,z:pt.y};}
  down(e){if(this.drag||![0,1,2].includes(e.button))return;e.preventDefault();this.svg.focus({preventScroll:true});const point=this.point(e),target=e.target.closest('[data-id]'),o=target&&this.project.objects.find(o=>o.id===target.dataset.id);
    if(o&&e.button===0&&!e.altKey){this.select(o.id);this.drag={id:o.id,start:point,client:[e.clientX,e.clientY],matrix:this.svg.getScreenCTM().inverse(),origin:{x:o.x,z:o.z},pointer:e.pointerId,moved:false};}
    else this.drag={start:point,pan:{...this.pan},pointer:e.pointerId,moved:false,client:[e.clientX,e.clientY]};
    this.svg.setPointerCapture(e.pointerId);
  }
  pointerMove(e){const d=this.drag;if(!d||e.pointerId!==d.pointer)return;const pt=this.point(e);
    if(d.id){const o=this.project.objects.find(o=>o.id===d.id);if(!o)return;try{const pos=placeInWarehouse(this.project,o,d.origin.x+(e.clientX-d.client[0])*d.matrix.a+(e.clientY-d.client[1])*d.matrix.c,d.origin.z+(e.clientX-d.client[0])*d.matrix.b+(e.clientY-d.client[1])*d.matrix.d,this.step);d.position=pos;d.moved=pos.x!==d.origin.x||pos.z!==d.origin.z;const group=[...this.svg.querySelectorAll('[data-id]')].find(g=>g.dataset.id===d.id);group?.setAttribute('transform',`translate(${pos.x} ${pos.z}) rotate(${o.rotation})`);this.svg.setAttribute('aria-label',`Spostamento ${o.name}: X ${pos.x}, Z ${pos.z} metri`);}catch(error){d.error=error.message;}}
    else{d.moved=Math.hypot(e.clientX-d.client[0],e.clientY-d.client[1])>3;this.pan.x+=d.start.x-pt.x;this.pan.z+=d.start.z-pt.z;this.view();}
  }
  up(e){const d=this.drag;if(!d||e.pointerId!==d.pointer)return;this.drag=null;if(this.svg.hasPointerCapture(e.pointerId))this.svg.releasePointerCapture(e.pointerId);if(d.error)this.notice(d.error);else if(d.id&&d.moved)this.move(d.id,d.position);else if(!d.id&&!d.moved)this.select(null);this.draw();}
  cancel(){const d=this.drag;if(!d)return;this.drag=null;if(d.pan)this.pan=d.pan;if(this.svg.hasPointerCapture(d.pointer))this.svg.releasePointerCapture(d.pointer);this.draw();this.view();}
}

