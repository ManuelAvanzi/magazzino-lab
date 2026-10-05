import {goods,newGame,act,occupied,reserved,nextMove} from './simulator-model.js';
const $=s=>document.querySelector(s);let state=newGame(),visualTime=0,lastActionAt=-1000,view=null;
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
$('#next-action').onclick=()=>{const n=nextMove(state);if(n)action(n.action,n.payload);};
$('#wait').onclick=()=>action('wait');$('#expand').onclick=()=>action('expand');$('#hire').onclick=()=>action('hire');
$('#stock').innerHTML=goods.map(g=>`<article style="--goods:${g.color}"><div><i></i><strong>${g.name}</strong><b data-stock="${g.id}"></b></div><small data-delivery="${g.id}"></small><button data-buy="${g.id}">Richiedi 3 unità · 1 tempo</button></article>`).join('');
document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>action('replenish',b.dataset.buy));
$('#orders').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)action(b.dataset.action,Number(b.dataset.order));});
function render(){
 const active=state.mode==='playing';$('#score').textContent=`${state.shipped} / 5`;$('#goods-shipped').textContent=state.unitsShipped;$('#clock').textContent=`${state.time} / ${state.limit}`;$('#capacity').textContent=`${occupied(state)} / ${state.capacity}`;$('#incoming').textContent=state.deliveries.length?`+ ${reserved(state)-occupied(state)} in arrivo`:'';$('#missed').textContent=`${state.missed} / 4`;$('#game-message').textContent=state.message;
 $('#pause').disabled=!['playing','paused'].includes(state.mode);$('#pause').textContent=state.mode==='paused'?'Riprendi':'Pausa';$('#pause').setAttribute('aria-pressed',String(state.mode==='paused'));
 $('#scene-state').textContent=({intro:'Pronto al turno',playing:'Turno operativo',paused:'Partita in pausa',won:'Obiettivo raggiunto',lost:'Turno concluso'})[state.mode];
 for(const g of goods){$(`[data-stock="${g.id}"]`).textContent=state.stock[g.id];const ds=state.deliveries.filter(d=>d.type===g.id);$(`[data-delivery="${g.id}"]`).textContent=ds.length?`In arrivo: ${ds.reduce((n,d)=>n+d.qty,0)} · ${Math.min(...ds.map(d=>d.at-state.time))} tempo`:'Unità disponibili';const button=$(`[data-buy="${g.id}"]`);button.disabled=!active||reserved(state)+3>state.capacity;button.title=reserved(state)+3>state.capacity?'Prima libera spazio spedendo oppure aggiungi uno scaffale.':'';}
 $('#expand').disabled=!active||state.capacity>=18;$('#expand').textContent=state.capacity>=18?'Scaffale aggiunto ✓':'Attiva 6 posti · 1 tempo';$('#hire').disabled=!active||state.fastPacking;$('#hire').textContent=state.fastPacking?'Due operatori attivi ✓':'Assegna un operatore · 1 tempo';$('#wait').disabled=!active;
 const open=state.orders.filter(o=>['waiting','ready'].includes(o.status));$('#order-count').textContent=`${open.length} aperti`;
 $('#orders').innerHTML=open.length?open.map(o=>{const g=goods.find(g=>g.id===o.type),ready=o.status==='ready',remaining=o.due-state.time;return `<article class="order ${remaining<=2?'urgent':''}"><div class="order-top"><b>ORDINE #${String(o.id).padStart(2,'0')}</b><span>${ready?'Pronto alla partenza':`Scade fra ${remaining} tempi`}</span></div><h3><i style="background:${g.color}"></i>${o.qty} ${o.qty===1?({cartons:"cartone",totes:"cassetta",drums:"fusto"})[g.id]:g.name.toLowerCase()}</h3><p>${ready?`Spedisci entro il tempo ${o.due}.`:`${state.stock[o.type]} disponibili · preparazione ${state.fastPacking?1:2} tempi`}</p><p class="action-why">${ready?`La merce esce dal magazzino: liberi ${o.qty} posti e completi l’ordine.`:state.stock[o.type]<o.qty?`Mancano ${o.qty-state.stock[o.type]} unità: richiedi un rifornimento nella scheda ${g.name}.`:`Sposti ${o.qty} unità dagli scaffali all’area spedizioni; lo spazio resta occupato.`}</p><div class="order-bottom"><strong>${ready||state.fastPacking?"1 tempo":"2 tempi"}</strong><button data-action="${ready?'ship':'pack'}" data-order="${o.id}" ${!active||!ready&&state.stock[o.type]<o.qty?'disabled':''}>${ready?'2. Spedisci':'1. Prepara merce'}</button></div></article>`;}).join(''):'<div class="empty-orders">Nessun ordine aperto.<br>Attendi o prepara le scorte per i prossimi arrivi.</div>';
 $('#log').innerHTML=state.log.map(s=>`<li>${escapeText(s)}</li>`).join('');
 if(['won','lost'].includes(state.mode)&&!result.open){$('#result-title').textContent=state.mode==='won'?'Un magazzino che funziona.':'Ogni turno insegna qualcosa.';$('#result-copy').textContent=state.message;$('#result-stats').textContent=`${state.shipped} spedizioni · ${state.unitsShipped} unità consegnate · ${state.missed} ordini scaduti`;result.showModal();}
 const next=nextMove(state);$('#next-step').textContent=next?.why||(state.mode==='intro'?'Inizia il turno per ricevere i primi ordini.':'Riprendi il turno oppure avvia una nuova partita.');$('#next-action').textContent=next?`${next.label} →`:'Turno fermo';$('#next-action').disabled=!next;$('#next-duration').textContent=next?`Questa azione richiede ${next.time} ${next.time===1?'tempo':'tempi'}.`:'';
 document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('suggested',!!next&&b.dataset.action===next.action&&Number(b.dataset.order)===next.payload));
 draw();
}
function draw(){view?.update(state);}
async function loadScene(){
 const loading=$('#sim-loading'),status=$('#sim-loading-status');
 try{
  const T=await import('three');let pending=false,failed=false;
  T.DefaultLoadingManager.onStart=()=>{pending=true;};
  T.DefaultLoadingManager.onProgress=(_url,n,total)=>status.textContent=`Modelli e materiali · ${n} di ${total}`;
  T.DefaultLoadingManager.onLoad=()=>{pending=false;};
  T.DefaultLoadingManager.onError=()=>{failed=true;};
  const {SimulatorScene}=await import('./simulator-scene.js');
  view=new SimulatorScene($('#game'));view.update(state);view.scene.resize();view.scene.center();
  while(pending)await new Promise(r=>setTimeout(r,50));
  if(failed)throw Error('Risorse non disponibili');
  status.textContent='Preparazione delle luci…';
  await view.scene.renderer.compileAsync(view.scene.scene,view.scene.camera);
  view.scene.composer.render();loading.remove();$('#start').disabled=false;welcome.showModal();
 }catch(error){status.textContent='Caricamento non riuscito. Controlla la connessione e riprova.';$('#sim-retry').hidden=false;console.error(error);}
}
$('#sim-retry').onclick=()=>location.reload();
$('#view-reset').onclick=()=>view?.scene.center();
window.render_game_to_text=()=>JSON.stringify({...state,occupied:occupied(state),reserved:reserved(state),coordinates:'Scena 3D: X orizzontale, Y altezza, Z profondità; ogni pallet rappresenta una unità di gioco.'});
window.advanceTime=ms=>{if(state.mode==='playing')visualTime+=Math.max(0,ms);draw();};
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f'&&!document.querySelector('dialog[open]')){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}if(e.code==='Space'&&e.target===document.body){e.preventDefault();$('#pause').click();}});
render();loadScene();
