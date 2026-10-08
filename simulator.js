import {inspectSimulation} from './simulation-layout.js';
import {stages,newSimulation,advance,quantities} from './guided-simulation.js';
const $=s=>document.querySelector(s);let state=newSimulation(),view=null,review=null;
const welcome=$('#welcome');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('#hud-toggle').onclick=()=>{const hidden=document.querySelector('main').classList.toggle('hud-hidden');$('#hud-toggle').textContent=hidden?'Mostra pannelli':'Nascondi pannelli';$('#hud-toggle').setAttribute('aria-pressed',String(hidden));};
$('#start').onclick=()=>{welcome.close();if(state.mode==='intro')state.mode='playing';render();};
welcome.addEventListener('cancel',e=>{if(state.mode==='intro')e.preventDefault();});
$('#pause').onclick=()=>{state.mode=state.mode==='paused'?'playing':'paused';render();};
$('#help').onclick=()=>{$('#start').textContent=state.mode==='intro'?'Inizia la simulazione →':'Torna alla simulazione';welcome.showModal();};
$('#restart').onclick=()=>$('#reset-confirm').showModal();$('#cancel-reset').onclick=()=>$('#reset-confirm').close();
$('#confirm-reset').onclick=()=>{state=newSimulation();review=null;$('#reset-confirm').close();$('#start').textContent='Inizia la simulazione →';render();welcome.showModal();};
$('#next-action').onclick=()=>{if(review!==null){review=null;}else advance(state);render();};
$('#stages').onclick=e=>{const button=e.target.closest('[data-stage]');if(button&&!button.disabled){review=Number(button.dataset.stage);render();}};
function render(){
 const q=quantities(state),done=state.mode==='complete',index=review??state.step,stage=stages[index];
 $('#progress').textContent=state.step+' / 7';$('#received').textContent=q.receiving;$('#stored').textContent=q.stock;$('#outgoing').textContent=q.preparing+q.outgoing;$('#shipped').textContent=state.shipped;
 $('#game-message').textContent=state.message;$('#pause').disabled=!['playing','paused'].includes(state.mode);$('#pause').textContent=state.mode==='paused'?'Riprendi':'Pausa';$('#pause').setAttribute('aria-pressed',String(state.mode==='paused'));
 $('#scene-state').textContent=state.mode==='paused'?'Simulazione in pausa':done?'Percorso completato':stages[state.step].phase;
 $('#phase').textContent=stage?(review!==null?'RIPASSO · ':'')+stage.phase:'RIEPILOGO DELLA SIMULAZIONE';
 $('#stage-title').textContent=stage?`${index+1}. ${stage.title}`:'Dalla consegna alla spedizione';
 $('#stage-why').textContent=stage?stage.why:'Hai seguito tutte le operazioni: 6 unità iniziali + 4 ricevute − 3 spedite = 7 unità rimaste in magazzino.';
 $('#stage-check').textContent=stage?stage.check:'Ricevere non significa rendere subito disponibile. Prelevare non significa spedire. Ogni passaggio richiede una verifica e una registrazione.';
 $('#stage-effect').textContent=stage?(review!==null?'Esito della tappa: ':'Dopo questa azione: ')+stage.effect:'Rileggi le tappe qui sotto oppure ricomincia la simulazione.';
 const next=$('#next-action');next.textContent=review!==null?'Torna al percorso attuale →':stage?stage.action+' →':'Percorso completato ✓';next.disabled=review===null&&state.mode!=='playing';
 $('#stages').innerHTML=stages.map((s,i)=>`<li><button data-stage="${i}" ${i>=state.step?'disabled':''} ${i===index?'aria-current="step"':''}><span>${i<state.step?'✓':String(i+1).padStart(2,'0')}</span><span><small>${s.phase}</small>${esc(s.title)}</span></button></li>`).join('');
 $('#stock').innerHTML=[['Cartoni','cartons'],['Cassette','totes'],['Fusti','drums']].map(([name,key])=>`<article><div><strong>${name}</strong><b>${state.stock[key]}</b></div><small>Disponibili a scaffale</small></article>`).join('');
 $('#log').innerHTML=state.log.map(s=>`<li>${esc(s)}</li>`).join('');view?.update(state);
}
async function loadScene(){
 const loading=$('#sim-loading'),status=$('#sim-loading-status');
 try{
  let source=null;const params=new URLSearchParams(location.search);
  if(params.has('layout')){const raw=sessionStorage.getItem('warehouse-simulation-'+params.get('layout'));if(!raw)throw Error('La copia del layout non è disponibile in questa scheda. Torna all’editor e avvia nuovamente la simulazione.');const data=JSON.parse(raw);source=data.project;if(/^\/studio\.html(?:\?|$)/.test(data.returnTo))$('.back').href=data.returnTo;}
  else if(params.has('project')){const {loadProject}=await import('./cloud.js');source=(await loadProject(params.get('project'))).project;$('.back').href='studio.html?project='+encodeURIComponent(params.get('project'));}
  if(source){const check=inspectSimulation(source);if(!check.ready)throw Error('Prima completa il layout nell’editor: '+[...check.checks.filter(c=>!c.ok).map(c=>c.title),...check.problems].join(' · '));$('.page-heading h1').textContent=source.name||'Il mio magazzino';$('.scene-note').textContent='Simulazione di un lotto simbolico nel tuo layout. Le quantità riguardano due scaffali dedicati al percorso; il resto dell’allestimento resta invariato. Il progetto salvato non viene modificato.';$('#welcome-title').textContent='Simula nel tuo magazzino';}
  const T=await import('three');let pending=false,failed=false;
  T.DefaultLoadingManager.onStart=()=>{pending=true;};
  T.DefaultLoadingManager.onProgress=(_url,n,total)=>status.textContent=`Modelli e materiali · ${n} di ${total}`;
  T.DefaultLoadingManager.onLoad=()=>{pending=false;};
  T.DefaultLoadingManager.onError=()=>{failed=true;};
  const {SimulatorScene}=await import('./simulator-scene.js');
  view=new SimulatorScene($('#game'),source);view.update(state);view.scene.resize();view.frame();
  while(pending)await new Promise(r=>setTimeout(r,50));
  if(failed)throw Error('Risorse non disponibili');
  status.textContent='Preparazione delle luci…';
  await view.scene.renderer.compileAsync(view.scene.scene,view.scene.camera);
  view.scene.composer.render();loading.remove();$('#start').disabled=false;welcome.showModal();
 }catch(error){status.textContent=error.message||'Caricamento non riuscito. Controlla la connessione e riprova.';$('#sim-retry').hidden=false;console.error(error);}
}
$('#sim-retry').onclick=()=>location.reload();
$('#view-reset').onclick=()=>view?.frame();

render();loadScene();
