import {goods,newGame,act,occupied,reserved} from './simulator-model.js';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d');let state=newGame(),visualTime=0,lastTime=0,lastActionAt=-1000;
const welcome=$('#welcome'),result=$('#result');
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function action(type,payload){if(act(state,type,payload)){lastActionAt=visualTime;}render();}
function reset(){state=newGame();lastActionAt=-1000;result.close();$('#reset-confirm').close();$('#start').textContent='Inizia il turno →';render();welcome.showModal();}
$('#start').onclick=()=>{welcome.close();if(state.mode==='intro')action('start');};
$('#pause').onclick=()=>{if(state.mode==='playing')state.mode='paused';else if(state.mode==='paused')state.mode='playing';render();};
$('#help').onclick=()=>{$('#start').textContent=state.mode==='intro'?'Inizia il turno →':'Torna alla partita';welcome.showModal();};
$('#restart').onclick=()=>{if(['playing','paused'].includes(state.mode))$('#reset-confirm').showModal();else reset();};
$('#confirm-reset').onclick=reset;$('#cancel-reset').onclick=()=>$('#reset-confirm').close();$('#again').onclick=reset;$('#review').onclick=()=>result.close();
welcome.addEventListener('cancel',e=>{if(state.mode==='intro')e.preventDefault();});
$('#wait').onclick=()=>action('wait');$('#expand').onclick=()=>action('expand');$('#hire').onclick=()=>action('hire');
$('#stock').innerHTML=goods.map(g=>`<article style="--goods:${g.color}"><div><i></i><strong>${g.name}</strong><b data-stock="${g.id}"></b></div><small data-delivery="${g.id}"></small><button data-buy="${g.id}">Ordina 3 · ${g.cost*3} €</button></article>`).join('');
document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>action('buy',b.dataset.buy));
$('#orders').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action,Number(b.dataset.order));});
function render(){
 const active=state.mode==='playing';$('#score').textContent=`${state.shipped} / 5`;$('#money').textContent=`${state.budget} €`;$('#clock').textContent=`${state.time} / ${state.limit}`;$('#capacity').textContent=`${occupied(state)} / ${state.capacity}`;$('#incoming').textContent=state.deliveries.length?`+ ${reserved(state)-occupied(state)} in arrivo`:'';$('#missed').textContent=`${state.missed} / 4`;$('#game-message').textContent=state.message;
 $('#pause').disabled=!['playing','paused'].includes(state.mode);$('#pause').textContent=state.mode==='paused'?'Riprendi':'Pausa';$('#pause').setAttribute('aria-pressed',String(state.mode==='paused'));
 $('#scene-state').textContent=({intro:'Pronto al turno',playing:'Turno operativo',paused:'Partita in pausa',won:'Obiettivo raggiunto',lost:'Turno concluso'})[state.mode];
 for(const g of goods){$(`[data-stock="${g.id}"]`).textContent=state.stock[g.id];const ds=state.deliveries.filter(d=>d.type===g.id);$(`[data-delivery="${g.id}"]`).textContent=ds.length?`In arrivo: ${ds.reduce((n,d)=>n+d.qty,0)} · ${Math.min(...ds.map(d=>d.at-state.time))} tempo`:'Unità disponibili';const button=$(`[data-buy="${g.id}"]`);button.disabled=!active||reserved(state)+3>state.capacity||state.budget<g.cost*3;button.title=reserved(state)+3>state.capacity?'Prima libera spazio spedendo oppure aggiungi uno scaffale.':'';}
 $('#expand').disabled=!active||state.capacity>=18||state.budget<40;$('#expand').textContent=state.capacity>=18?'Scaffale aggiunto ✓':'+ 6 posti · 40 €';$('#hire').disabled=!active||state.fastPacking||state.budget<55;$('#hire').textContent=state.fastPacking?'Due operatori attivi ✓':'Secondo operatore · 55 €';$('#wait').disabled=!active;
 const open=state.orders.filter(o=>['waiting','ready'].includes(o.status));$('#order-count').textContent=`${open.length} aperti`;
 $('#orders').innerHTML=open.length?open.map(o=>{const g=goods.find(g=>g.id===o.type),ready=o.status==='ready',remaining=o.due-state.time;return `<article class="order ${remaining<=2?'urgent':''}"><div class="order-top"><b>ORDINE #${String(o.id).padStart(2,'0')}</b><span>${ready?'Pronto alla partenza':`Scade fra ${remaining} tempi`}</span></div><h3><i style="background:${g.color}"></i>${o.qty} ${g.name.toLowerCase()}</h3><p>${ready?`Spedisci entro il tempo ${o.due}.`:`${state.stock[o.type]} disponibili · preparazione ${state.fastPacking?1:2} tempi`}</p><div class="order-bottom"><strong>+${o.value} €</strong><button data-action="${ready?'ship':'pack'}" data-order="${o.id}" ${!active||!ready&&state.stock[o.type]<o.qty?'disabled':''}>${ready?'Spedisci →':'Prepara ordine'}</button></div></article>`;}).join(''):'<div class="empty-orders">Nessun ordine aperto.<br>Attendi o prepara le scorte per i prossimi arrivi.</div>';
 $('#log').innerHTML=state.log.map(s=>`<li>${escapeText(s)}</li>`).join('');
 if(['won','lost'].includes(state.mode)&&!result.open){$('#result-title').textContent=state.mode==='won'?'Un magazzino che funziona.':'Ogni turno insegna qualcosa.';$('#result-copy').textContent=state.message;$('#result-stats').textContent=`${state.shipped} spedizioni · ${state.budget} € residui · ${state.missed} ordini scaduti`;result.showModal();}
 draw();
}
// A small isometric warehouse: screen origin top-left, world X right/down, Z left/down.
function point(x,z,h=0){return [500+(x-z)*24,140+(x+z)*13-h*27];}
function polygon(points,color,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function box(x,z,w,d,h,color,base=0){const a=point(x,z,base+h),b=point(x+w,z,base+h),c=point(x+w,z+d,base+h),e=point(x,z+d,base+h);polygon([e,c,point(x+w,z+d,base),point(x,z+d,base)],color);ctx.save();ctx.globalAlpha=.18;polygon([e,c,point(x+w,z+d,base),point(x,z+d,base)],'#061b27');ctx.restore();polygon([b,c,point(x+w,z+d,base),point(x+w,z,base)],color);ctx.save();ctx.globalAlpha=.3;polygon([b,c,point(x+w,z+d,base),point(x+w,z,base)],'#061b27');ctx.restore();polygon([a,b,c,e],color);}
function line(a,b,color,width=2){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function label(text,x,z){const [px,py]=point(x,z);ctx.font='600 13px "DM Sans",sans-serif';const width=ctx.measureText(text).width+22;ctx.fillStyle='#f9fcf8ee';ctx.beginPath();ctx.roundRect(px-width/2,py-12,width,26,7);ctx.fill();ctx.fillStyle='#3d6352';ctx.textAlign='center';ctx.fillText(text,px,py+5);}
function draw(){
 ctx.clearRect(0,0,1100,700);ctx.fillStyle='#e7efea';ctx.fillRect(0,0,1100,700);
 ctx.save();ctx.shadowColor='#2b4f3e22';ctx.shadowBlur=35;ctx.shadowOffsetY=25;polygon([point(0,0),point(19,0),point(19,15),point(0,15)],'#d5ded7');ctx.restore();
 box(0,0,19,.15,4,'#c4d4cb');box(0,0,.15,15,4,'#b8cec0');
 for(let x=1;x<19;x++)line(point(x,0),point(x,15),'#c1cec533',1);for(let z=1;z<15;z++)line(point(0,z),point(19,z),'#c1cec533',1);
 for(let x=2;x<18;x+=4){box(x,.2,2,.04,1,'#8baba4',2);}
 polygon([point(.3,.3),point(2.2,.3),point(2.2,14.7),point(.3,14.7)],'#8dbca766');
 polygon([point(3,2),point(5,2),point(5,12),point(3,12)],'#d8c59466');
 for(let z=2;z<12;z+=2)line(point(4,z),point(4,z+1),'#faf5df',3);
 const slots=state.capacity/2,stock=goods.flatMap(g=>Array.from({length:state.stock[g.id]},()=>g));let n=0;
 for(let r=0;r<slots;r++){const x=6+(r%3)*3.4,z=2+Math.floor(r/3)*3.2;
  for(const xx of [x,x+2.5])for(const zz of [z,z+1.25])box(xx,zz,.12,.12,3.3,'#44696d');
  for(let level=0;level<2;level++){const y=.45+level*1.4;box(x,z,2.6,1.35,.12,'#d19a60',y);const g=stock[n++];if(g){box(x+.2,z+.12,2.1,1,.12,'#ad9875',y+.12);if(g.id==='drums'){for(const xx of [x+.65,x+1.65]){const [px,py]=point(xx,z+.7,y+.32);ctx.fillStyle=g.color;ctx.fillRect(px-10,py-21,20,22);ctx.beginPath();ctx.ellipse(px,py-21,10,5,0,0,Math.PI*2);ctx.fillStyle='#a6b48c';ctx.fill();}}else{box(x+.3,z+.15,1.9,.95,.8,g.color,y+.25);box(x+.9,z+.12,.12,1,.82,g.id==='cartons'?'#e6cf9e':'#8ab5bc',y+.25);}}}
 }
 // Receiving apron and delivery truck.
 box(0,16,7,3,.1,'#bdc8c3');const offset=state.deliveries.length?Math.sin(visualTime/500)*.08:0;box(.7+offset,16.4,4,1.7,1.7,'#d8e3dc',.4);box(4.7+offset,16.4,1.5,1.7,1.45,'#397367',.4);box(5.8+offset,16.5,.08,1.4,.6,'#9bb9bd',1.05);for(const xx of [1.4,4.9]){const [px,py]=point(xx,18.2,.25);ctx.fillStyle='#34514c';ctx.beginPath();ctx.ellipse(px,py,8,11,-.5,0,Math.PI*2);ctx.fill();}
 box(13,10.6,3.6,1.3,1,'#9d8768');box(13.3,10.8,.7,.5,.4,'#d3b580',1);box(15.3,10.8,.45,.25,.45,'#486766',1);
 const packed=state.orders.filter(o=>o.status==='ready');packed.forEach((o,i)=>{const g=goods.find(g=>g.id===o.type);box(16.7,11+i*.9,1.3,.7,.7,g.color,.1);});
 const people=state.fastPacking?2:1;for(let i=0;i<people;i++){const [px,py]=point(14+i*1.7,13,.3);line([px-3,py],[px-4,py-20],'#31555a',5);line([px+4,py],[px+3,py-20],'#31555a',5);ctx.fillStyle='#e1b84e';ctx.fillRect(px-7,py-33,15,18);ctx.beginPath();ctx.arc(px,py-39,7,0,Math.PI*2);ctx.fill();}
 label('RICEVIMENTO',3,19.5);label('SCORTE',10,1);label('IMBALLAGGIO',14,14.6);label('USCITA',19.4,10);
 if(state.mode==='playing'&&visualTime-lastActionAt<900){const t=Math.min(1,(visualTime-lastActionAt)/900),[x,y]=point(4+t*11,10,.4);ctx.fillStyle='#2e9b7b';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
 if(state.mode==='paused'){ctx.fillStyle='#e7efead9';ctx.fillRect(0,0,1100,700);ctx.fillStyle='#315b46';ctx.font='500 32px "DM Sans"';ctx.textAlign='center';ctx.fillText('Partita in pausa',550,340);}
}
function frame(now){const dt=lastTime?Math.min(now-lastTime,100):0;lastTime=now;if(state.mode==='playing'&&!document.hidden)visualTime+=dt;draw();requestAnimationFrame(frame);}
window.render_game_to_text=()=>JSON.stringify({...state,occupied:occupied(state),reserved:reserved(state),coordinates:'Canvas 1100×700; origine in alto a sinistra. X mondo verso destra e basso; Z verso sinistra e basso.'});
window.advanceTime=ms=>{if(state.mode==='playing')visualTime+=Math.max(0,ms);draw();};
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f'&&!document.querySelector('dialog[open]')){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}if(e.code==='Space'&&e.target===document.body){e.preventDefault();$('#pause').click();}});
render();welcome.showModal();requestAnimationFrame(frame);
