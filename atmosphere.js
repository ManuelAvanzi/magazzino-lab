import * as T from 'three';

export const lightingPresets={
 day:{name:'Luce diurna',sun:2.4,sunColor:'#fff0d4',ambient:.48,fill:.32,fixtures:65,exposure:1.02,window:16},
 golden:{name:'Tardo pomeriggio',sun:2.8,sunColor:'#ffc47c',ambient:.27,fill:.23,fixtures:100,exposure:1.03,window:25},
 night:{name:'Turno serale',sun:.04,sunColor:'#94b4ff',ambient:.13,fill:.09,fixtures:220,exposure:1.1,window:1.2}
};

export class WarehouseAtmosphere{
 constructor(scene){this.scene=scene;this.group=new T.Group();scene.add(this.group);this.mode='golden';this.ceilingLights=[];this.windowLights=[];this.glows=[];this.geometry=new T.PlaneGeometry(1,1);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(220,238,255,.75)');gradient.addColorStop(.18,'rgba(210,232,255,.20)');gradient.addColorStop(1,'rgba(210,232,255,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);this.glowTexture=new T.CanvasTexture(canvas);}
 clear(){this.group.traverse(o=>{if(o.isLight)o.dispose();if(o.material)o.material.dispose();});this.group.clear();this.ceilingLights=[];this.windowLights=[];this.glows=[];}
 build(project){this.clear();const w=project.width,d=project.depth;
 // Six broad ceiling pools: positions coincide with the modeled fixtures.
 const fixtureRows=[];for(let z=-d/2+2;z<d/2;z+=6)fixtureRows.push(z);
 const rows=[...new Set([fixtureRows[0],fixtureRows[Math.floor(fixtureRows.length/2)],fixtureRows.at(-1)])];
 for(const z of rows)for(const x of [-w*.28,w*.28]){
  const light=new T.SpotLight('#d9eaff',100,22,1.06,.78,2);light.position.set(x,6.76,z);light.target.position.set(x,0,z);this.group.add(light,light.target);this.ceilingLights.push(light);
  const glow=new T.Sprite(new T.SpriteMaterial({map:this.glowTexture,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.38}));glow.position.copy(light.position);glow.scale.set(1.3,.6,1);this.group.add(glow);this.glows.push(glow);
 }
 // Window projectors use a mullion mask. They illuminate geometry, rather than decals.
 const maskCanvas=document.createElement('canvas');maskCanvas.width=maskCanvas.height=256;const ctx=maskCanvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,256,256);ctx.fillStyle='#fff';ctx.fillRect(28,70,200,108);ctx.fillStyle='#000';for(const x of [75,124,173])ctx.fillRect(x,70,5,108);
 this.mask?.dispose();this.mask=new T.CanvasTexture(maskCanvas);
 const windowRows=[];for(let z=-d/2+3;z<d/2-1;z+=5)windowRows.push(z);const windowStep=Math.max(1,Math.ceil(windowRows.length/3));for(const z of windowRows.filter((_,i)=>i%windowStep===0)){const light=new T.SpotLight('#ffdca7',20,26,.68,.22,1);light.position.set(w/2-.38,5.9,z);light.target.position.set(w/2-8,.1,z+3);light.map=this.mask;light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-.0004;light.shadow.normalBias=.035;this.group.add(light,light.target);this.windowLights.push(light);}
 // Limit shadowed projectors on very large layouts.
 this.windowLights.forEach((l,i)=>l.castShadow=i%Math.max(1,Math.ceil(this.windowLights.length/3))===0);
 this.apply(this.mode);
 }
 apply(mode){this.mode=mode;const p=lightingPresets[mode];for(const l of this.ceilingLights)l.intensity=p.fixtures;for(const l of this.windowLights){l.intensity=p.window;l.color.set(p.sunColor);}for(const g of this.glows)g.material.opacity=mode==='night'?.55:.25;}
 setInterior(inside){for(const g of this.glows)g.visible=inside;}
}
