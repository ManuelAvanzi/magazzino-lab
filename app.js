import {warehouseTemplates} from './templates.js';
import {FlowLesson} from './flow-lesson.js';
import { WarehouseScene } from './warehouse-scene.js';
import {PlanEditor} from './plan-editor.js';
import {makeRow,findFreePlacement,placeInWarehouse} from './editor-model.js';
import { catalog, blankWarehouse, demo, warehouseDemo, isLegacyDemo, item, isZone, analyze, validate } from './model.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let project=warehouseDemo(),selected=null,tab='design',history=[],future=[],mode='3d';
const requestedSession=new URLSearchParams(location.search).get('session');
const session=['demo','exercise','plan'].includes(requestedSession)?requestedSession:'personal';
const storageKey=session==='personal'?'magazzino-lab-v1':`magazzino-lab-v1-${session}`;
if(session==='plan')project=blankWarehouse();
let restored=false;
try { const saved=localStorage.getItem(storageKey);if(saved){project=validate(JSON.parse(saved));restored=true;} } catch { toast('Salvataggio non disponibile: aperto il magazzino di esempio.'); }
if(session==='demo'&&restored&&isLegacyDemo(project)){project=warehouseDemo();try{localStorage.setItem(storageKey,JSON.stringify(project));}catch{}}
if(session==='exercise'&&!restored){project=demo();project.objects.push(item('pallet',-11,0),item('pallet',-11,11),item('pallet',-7,-6));}
if(session==='exercise')tab='safety';
if(session!=='personal')$('.project small').textContent=session==='plan'?'Progetto da pianta / Salvato sul dispositivo':session==='demo'?'Esempio / Salvataggio separato':'Esercitazione / Salvataggio separato';
function selectObject(id){if(tab==='flows')return;if(id)studio.setMotion(false,true);selected=id;if(id){tab='design';openInspector();}rebuild();}
const studio=new WarehouseScene($('#viewport'),selectObject);
studio.flowLesson=new FlowLesson(studio);
const plan=new PlanEditor($('#viewport'),{select:selectObject,move:(id,pos)=>{commit(()=>Object.assign(project.objects.find(o=>o.id===id),pos));toast('Posizione aggiornata.');},notice:toast});
function motionStatus(){const count=studio.movers.length,people=studio.people.length;$('#motion-toggle').textContent=studio.motionEnabled?'Ⅱ Pausa':'▶ Avvia';$('#motion-toggle').setAttribute('aria-pressed',String(studio.motionEnabled));$('#motion-toggle').disabled=!(count+people+Number(!!studio.yard))||mode==='2d';const parts=[];if(studio.yard)parts.push('1 camion');if(count)parts.push(count+' '+(count===1?'carrello':'carrelli'));if(people)parts.push(people+' '+(people===1?'operatore':'operatori'));$('#motion-status').textContent=!(count+people+Number(!!studio.yard))?'Nessuna animazione disponibile':studio.motionEnabled?parts.join(' · ')+' in attività':'Animazione in pausa · layout invariato';}
studio.onMotionChange=motionStatus;
const yardStatus=document.createElement('div');yardStatus.id='yard-status';yardStatus.hidden=true;yardStatus.innerHTML='<span><small>PIAZZALE ESTERNO</small><b></b></span><button>Inquadra camion ↗</button>';$('#viewport').append(yardStatus);yardStatus.querySelector('button').onclick=()=>{setView('3d');studio.focusTruck();};studio.onTruckChange=state=>{const b=yardStatus.querySelector('b');if(b.textContent!==state.phase)b.textContent=state.phase;};
$('#motion-toggle').onclick=()=>studio.setMotion(!studio.motionEnabled);
$('#lighting').onchange=e=>studio.setLighting(e.target.value);

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function openInspector(){document.body.classList.remove('mobile-library');document.body.classList.remove('inspector-closed');document.body.classList.add('inspector-open');}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(project));$('#save-status').textContent=session==='personal'?'✓ Salvato su questo dispositivo':'✓ Sessione salvata separatamente';}catch{$('#save-status').textContent='Salvataggio non disponibile: esporta il progetto';}}
function commit(action){plan.cancel();future=[];studio.setMotion(false,true);history.push(JSON.stringify(project));if(history.length>40)history.shift();action();save();rebuild();}
function rebuild(){studio.build(project,selected);plan.render(project,selected,analyze(project));updateUI();updateTools();}
function setView(view){plan.cancel();if(view==='2d'){if(tab==='flows'){tab='design';updateUI();}studio.setMotion(false,true);studio.flowLesson.playing=false;studio.flowLesson.onChange?.();}mode=view;studio.center(view);plan.setVisible(view==='2d');document.body.classList.toggle('plan-mode',view==='2d');for(const [id,value]of [['view3d','3d'],['view2d','2d'],['inside','inside']])$('#'+id).classList.toggle('active',mode===value);$('#camera-label').textContent={inside:'VISTA INTERNA','3d':'PROSPETTIVA','2d':'PIANTA ORTOGONALE'}[view];$('.hint').textContent=view==='2d'?'Trascina un elemento · Sfondo per spostare la vista · Rotella per zoom · Esc annulla':view==='inside'?'Trascina per esplorare · Rotella per avvicinarti':'Trascina per orbitare · Rotella per zoom · Seleziona e usa Sposta in pianta';updateTools();motionStatus();}
function focusObject(id){if(mode==='2d')plan.focus(id);else studio.focus(id);}
function duplicateSelected(){const o=project.objects.find(o=>o.id===selected);if(!o)return;if(project.objects.length>=300)return toast('Massimo 300 elementi.');try{const copy={...o,id:crypto.randomUUID()};Object.assign(copy,findFreePlacement(project,copy,{x:o.x+o.w+.3,z:o.z}));commit(()=>{project.objects.push(copy);selected=copy.id;});toast('Copia inserita. Ctrl+Z per annullare.');}catch(error){toast(error.message);}}
function deleteSelected(){if(!selected)return;commit(()=>{project.objects=project.objects.filter(o=>o.id!==selected);selected=null;});toast('Elemento eliminato. Ctrl+Z per annullare.');}
function updateTools(){
  $('#redo').disabled=!future.length;
  const choice=project.objects.find(o=>o.id===selected);
  $('#selection-info').textContent=choice?choice.name:'Nessuna selezione';$('#quick-rotate').disabled=!choice;$('#move-plan').disabled=!choice;
  $('#object-count').textContent=project.objects.length;
  $('#object-list').innerHTML=project.objects.map(o=>`<button data-object="${esc(o.id)}" aria-pressed="${o.id===selected}"><span>${esc(o.name)}</span><small>${o.x} / ${o.z} m</small></button>`).join('');
  $('#object-list').querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{selectObject(b.dataset.object);focusObject(selected);});
  document.querySelectorAll('[data-catalog-count]').forEach(el=>{const count=project.objects.filter(o=>o.type===el.dataset.catalogCount).length;el.textContent=count?`${count} nel progetto`:'Da aggiungere';});
  if($('#workflow-status')){$('#workflow-status').textContent=choice?`${choice.name} · ${choice.w} × ${choice.d} m`:`${project.objects.length} elementi · Seleziona o aggiungi dal catalogo`;$('#dock-focus').disabled=!choice;$('#dock-duplicate').disabled=!choice;$('#dock-delete').disabled=!choice;$('#capture-view').disabled=mode==='2d';}
}
function updateUI(){document.body.classList.toggle('flow-mode',tab==='flows');studio.flowLesson.activate(tab==='flows');$('#project-name').value=project.name||'Il mio magazzino';const issues=analyze(project),racks=project.objects.filter(o=>o.type==='rack');$('#width').value=project.width;$('#depth').value=project.depth;$('#area').textContent=project.width*project.depth+' m²';$('.scene-label h1').textContent=project.name||'Magazzino didattico';$('#yard-status').hidden=!studio.yard;$('#area-label').textContent=project.width+' × '+project.depth+' m · Altezza capannone 7,5 m';$('#capacity').textContent=racks.length*6;$('#occupancy').textContent=Math.round(racks.reduce((s,o)=>s+o.w*o.d,0)/(project.width*project.depth)*100)+'%';$('#issues').textContent=issues.length;$('#issue-count').textContent=issues.length;$('#undo').disabled=!history.length;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));renderPanel(issues);}
function renderPanel(issues){const panel=$('#panel'),o=project.objects.find(o=>o.id===selected);
if(tab==='flows'){studio.flowLesson.render(panel);return;}
if(tab==='safety'){
panel.innerHTML='<div class="eyebrow">ANALISI DEL LAYOUT</div><h2>Controlla i passaggi.</h2><div class="analysis-summary"><strong>'+issues.length+'</strong><span>interferenze geometriche<br>nel layout attuale</span></div><p class="muted">Ingombri e percorsi vengono verificati a ogni modifica.</p>'+(issues.length?issues.map((i,n)=>`<article class="issue"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><button data-issue="${n}">Correggi in pianta →</button></article>`).join(''):'<div class="good">✓ Nessuna interferenza rilevata dai controlli geometrici attivi.</div>')+'<p class="muted">Non verificati: portate, larghezze minime, distanze antincendio e continuità delle vie di esodo.</p>';
panel.querySelectorAll('[data-issue]').forEach(b=>b.onclick=()=>{selected=issues[+b.dataset.issue].id;tab='design';rebuild();setView('2d');focusObject(selected);});return;
}
if(tab==='learn'){
panel.innerHTML='<div class="eyebrow">ESERCITAZIONE / 01</div><h2>Progettare i flussi</h2><div class="step"><b>01 — Leggi lo spazio</b>Individua ricevimento, stoccaggio, imballaggio e spedizioni.</div><div class="step"><b>02 — Osserva i percorsi</b>Confronta i percorsi di pedoni e mezzi. Dove si incontrano?</div><div class="step"><b>03 — Risolvi le interferenze</b>Apri lo scenario e sposta gli ostacoli che occupano i passaggi.</div><div class="step"><b>04 — Motiva il progetto</b>Confronta le configurazioni e spiega quali scelte riducono le interferenze.</div><button id="learn-start" class="primary">Apri scenario didattico →</button><p class="muted">I posti pallet sono teorici: 2 per livello × 3 livelli per modulo. Non esprimono una portata certificata.</p>';$('#learn-start').onclick=exercise;return;
}
if(!o){panel.innerHTML='<div class="eyebrow">CENTRO LOGISTICO</div><h2>Organizza lo spazio.<br>Studia i flussi.</h2><p class="muted">Seleziona un elemento nella scena o nell’elenco. In Pianta 2D puoi trascinarlo con aggancio alla griglia.</p><div class="step"><b>Attrezzature in scala</b>Scaffalature, pallet, carrelli e postazioni di imballaggio.</div><div class="step"><b>Viste di lavoro</b>Usa la pianta per disporre gli elementi e il 3D per osservare il risultato.</div><div class="step"><b>Analisi del layout</b>Individua ingombri sovrapposti e interferenze sui percorsi.</div><button id="overview-inside">Esplora l’interno ↗</button>';$('#overview-inside').onclick=()=>setView('inside');return;}
panel.innerHTML=`<div class="eyebrow">ELEMENTO SELEZIONATO</div><h2>${esc(o.name)}</h2><span class="selected-badge">${o.type==='worker'?'Persona':o.type.endsWith('Sign')?'Segnaletica':o.type==='barrier'?'Protezione':isZone(o)?'Area funzionale':'Attrezzatura'} · ${o.rotation}°</span><div class="fields"><label class="wide">Nome<input id="name" maxlength="100" value="${esc(o.name)}"></label>${[['x','Posizione X · m',-100,100],['z','Posizione Z · m',-100,100],['w','Larghezza · m',.1,60],['d','Profondità · m',.1,60]].map(([k,n,min,max])=>`<label>${n}<input data-field="${k}" type="number" step="0.1" min="${min}" max="${max}" value="${o[k]}"></label>`).join('')}</div><div class="row-actions"><button id="apply" class="primary">Applica proprietà</button><button id="rotate">↻ Ruota 90°</button><button id="duplicate">Duplica</button><button id="focus">⌖ Inquadra</button><button id="delete">Elimina</button></div><p class="muted">Coordinate dal centro del magazzino. Le misure rappresentano l’ingombro dell’elemento.</p>`;
const rowSection=document.createElement('details');rowSection.className='row-builder';
rowSection.innerHTML='<h3>Crea una serie</h3><p class="muted">Copie allineate con distanza libera tra gli ingombri.</p><div class="fields"><label>Copie aggiuntive<input id="row-count" type="number" min="1" max="20" value="3"></label><label>Distanza · m<input id="row-gap" type="number" min="0" max="20" step="0.1" value="0.2"></label><label class="wide">Direzione<select id="row-direction"><option value="x">Destra · +X</option><option value="-x">Sinistra · −X</option><option value="z">In basso · +Z</option><option value="-z">In alto · −Z</option></select></label></div><button id="create-row">Crea serie</button><p id="row-error" role="status"></p>';
panel.append(rowSection);
const rowSummary=document.createElement('summary');rowSummary.textContent='Crea copie in serie';rowSection.prepend(rowSummary);rowSection.querySelector('h3').remove();
const related=issues.filter(issue=>issue.id===o.id||issue.ids?.includes(o.id));
const check=document.createElement('div');check.className=related.length?'selection-check warning':'selection-check';check.innerHTML=related.length?`<b>${related.length} ${related.length===1?'interferenza da controllare':'interferenze da controllare'}</b><p>${related.map(i=>esc(i.title)).join(' · ')}</p>`:'<b>Ingombro senza interferenze rilevate</b><p>Controllo geometrico sul layout attuale.</p>';panel.insertBefore(check,panel.querySelector('.fields'));
$('#create-row').onclick=()=>{try{const copies=makeRow(project,o,Number($('#row-count').value),Number($('#row-gap').value),$('#row-direction').value);commit(()=>project.objects.push(...copies));toast(`${copies.length} copie create.`);}catch(error){$('#row-error').textContent=error.message;}};
$('#apply').onclick=()=>{const inputs=[...panel.querySelectorAll('[data-field]')];if(inputs.some(i=>!i.value||!i.checkValidity()))return toast('Controlla le misure inserite.');const values=Object.fromEntries(inputs.map(i=>[i.dataset.field,Number(i.value)]));const name=$('#name').value.trim()||catalog.find(c=>c.type===o.type).name;commit(()=>Object.assign(o,values,{name}));toast('Proprietà aggiornate.');};
if(['rack','pallet'].includes(o.type)){const label=document.createElement('label');label.className='cargo-field';label.innerHTML='Tipologia merce<select id="cargo-type"><option value="">Mista</option><option value="cartons">Cartoni</option><option value="totes">Cassette riutilizzabili</option><option value="drums">Fusti</option><option value="crates">Casse in legno</option></select>';panel.querySelector('.fields').after(label);$('#cargo-type').value=o.cargoType||'';$('#cargo-type').onchange=e=>{const value=e.target.value;commit(()=>{if(value)o.cargoType=value;else delete o.cargoType;});};}
$('#rotate').onclick=()=>commit(()=>o.rotation=(o.rotation+90)%360);
$('#focus').onclick=()=>focusObject(o.id);
$('#delete').onclick=deleteSelected;
$('#duplicate').onclick=duplicateSelected;
}

$('#catalog-section .tiny-tag').textContent=String(catalog.length).padStart(2,'0');$('#showcase').innerHTML='Scegli un template <span>↗</span>';

$('#catalog').innerHTML=catalog.map(c=>`<button class="catalog-card" data-add="${c.type}" title="Aggiungi ${esc(c.name.toLowerCase())}"><span class="thumb"><img alt="" width="128" height="84" hidden></span><span class="plus">+</span><span class="catalog-name">${esc(c.name)}</span><span class="catalog-size">${c.w} × ${c.d} m</span><span class="catalog-count" data-catalog-count="${c.type}"></span></button>`).join('');
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(project.objects.length>=300)return toast('Massimo 300 elementi.');try{const o=item(b.dataset.add);Object.assign(o,findFreePlacement(project,o));openInspector();commit(()=>{project.objects.push(o);selected=o.id;tab='design';});document.body.classList.remove('mobile-library');toast(`${o.name} aggiunto. Trascinalo nella pianta per posizionarlo.`);}catch(error){toast(error.message);}});
for(const k of ['width','depth'])$('#'+k).onchange=e=>{const value=Number(e.target.value);if(!Number.isFinite(value)||value<16||value>60){toast('Dimensioni ammesse: da 16 a 60 metri.');updateUI();return;}commit(()=>project[k]=value);studio.center(mode);};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;if(tab==='flows'){document.body.classList.remove('expanded');setView('3d');requestAnimationFrame(()=>{studio.resize();studio.center('3d');});}if(tab!=='design'){studio.setMotion(false,true);openInspector();}updateUI();});
function undo(){if(!history.length)return;plan.cancel();studio.setMotion(false,true);future.push(JSON.stringify(project));project=JSON.parse(history.pop());selected=null;save();rebuild();}
function redo(){if(!future.length)return;plan.cancel();studio.setMotion(false,true);history.push(JSON.stringify(project));project=JSON.parse(future.pop());selected=null;save();rebuild();}
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#center').onclick=()=>mode==='2d'?plan.center():studio.center(mode);
$('#move-plan').onclick=()=>setView('2d');$('#snap').onchange=e=>plan.step=Number(e.target.value);
$('#quick-rotate').onclick=()=>{const o=project.objects.find(o=>o.id===selected);if(o)commit(()=>o.rotation=(o.rotation+90)%360);};
for(const [key,label] of [['people','Persone'],['safety','Sicurezza']]){const b=document.createElement('button');b.dataset.category=key;b.setAttribute('aria-pressed','false');b.textContent=label;$('.catalog-filters').append(b);}
let category='all';
function filterCatalog(){const query=$('#catalog-search').value.toLocaleLowerCase('it');let count=0;document.querySelectorAll('[data-add]').forEach(b=>{const c=catalog.find(c=>c.type===b.dataset.add),show=c.name.toLocaleLowerCase('it').includes(query)&&(category==='all'||category==='zones'&&isZone(c)||category==='people'&&c.type==='worker'||category==='safety'&&(c.type.endsWith('Sign')||c.type==='barrier')||category==='equipment'&&!isZone(c)&&c.type!=='worker'&&!c.type.endsWith('Sign')&&c.type!=='barrier');b.hidden=!show;if(show)count++;});$('#catalog-empty').hidden=!!count;}
$('#catalog-search').oninput=filterCatalog;
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));filterCatalog();});
document.addEventListener('keydown',e=>{if(e.target.closest('dialog,input,textarea,select,[contenteditable]'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}else if(e.key==='Escape'){plan.cancel();}});
$('#view3d').onclick=()=>setView('3d');$('#view2d').onclick=()=>setView('2d');$('#inside').onclick=()=>setView('inside');
function expandView(value){document.body.classList.toggle('expanded',value);$('#expand').textContent=value?'↙ Torna all’editor':'⛶ Vista ampia';$('#expand').setAttribute('aria-pressed',String(value));$('#expand').title=value?'Ripristina pannelli e intestazione':'Usa tutta la finestra per il magazzino';}$('#expand').onclick=()=>expandView(!document.body.classList.contains('expanded'));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('expanded'))expandView(false);});
$('#library-toggle').onclick=()=>document.body.classList.toggle('mobile-library');
$('#inspector-toggle').onclick=()=>{document.body.classList.remove('mobile-library');const closed=document.body.classList.contains('inspector-closed')||(innerWidth<=1250&&!document.body.classList.contains('inspector-open'));if(closed)openInspector();else{document.body.classList.add('inspector-closed');document.body.classList.remove('inspector-open');}};
$('#close-inspector').onclick=()=>{document.body.classList.add('inspector-closed');document.body.classList.remove('inspector-open');};
const templateDialog=document.createElement('dialog');templateDialog.className='template-dialog';templateDialog.setAttribute('aria-labelledby','templates-title');
templateDialog.innerHTML=`<form method="dialog"><button aria-label="Chiudi template">×</button></form><div class="eyebrow">SCENARI DI PARTENZA</div><h2 id="templates-title">Scegli il tuo magazzino.</h2><p>Due template modificabili. Puoi annullare il caricamento e tornare al progetto precedente.</p><div class="template-grid">${warehouseTemplates.map((t,i)=>`<button data-template="${t.id}"><span class="template-number">0${i+1}</span><strong>${t.name}</strong><span class="template-size">${t.size}</span><span>${t.description}</span><b>Carica template ↗</b></button>`).join('')}</div><p id="template-feedback" role="status"></p>`;document.body.append(templateDialog);
$('#showcase').onclick=$('#templates-open').onclick=()=>templateDialog.showModal();
templateDialog.querySelectorAll('[data-template]').forEach(button=>button.onclick=async()=>{templateDialog.querySelectorAll('[data-template]').forEach(b=>b.disabled=true);$('#template-feedback').textContent='Preparazione dello scenario…';await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));try{const t=warehouseTemplates.find(t=>t.id===button.dataset.template);commit(()=>{project={...t.create(),name:t.name,templateId:t.id};selected=null;tab='design';});setView('3d');studio.setMotion(!matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.remove('mobile-library','inspector-open');templateDialog.close();toast(t.name+' caricato. Annulla ripristina il progetto precedente.');}finally{templateDialog.querySelectorAll('[data-template]').forEach(b=>b.disabled=false);$('#template-feedback').textContent='';}});

function exercise(){commit(()=>{project=demo();project.objects.push(item('pallet',-11,0),item('pallet',-11,11),item('pallet',-7,-6));selected=null;tab='safety';});setView('3d');openInspector();toast('Tre interferenze da risolvere. Annulla ripristina il progetto precedente.');}
$('#exercise').onclick=exercise;
const newDialog=document.createElement('dialog');newDialog.className='editor-help';newDialog.setAttribute('aria-labelledby','new-title');
newDialog.innerHTML=`<form id="new-form"><div class="eyebrow">01 / PARTI DALLA PIANTA</div><h2 id="new-title">Crea il tuo magazzino.</h2><p>Imposta una pianta rettangolare vuota. Poi aggiungi scaffali, postazioni e percorsi dal catalogo, disponili in 2D e osserva il risultato in 3D.</p><label>Nome<input name="name" maxlength="100" value="Il mio magazzino" required></label><div class="dimensions"><label>Larghezza · m<input name="width" type="number" min="16" max="60" value="30" required></label><label>Profondità · m<input name="depth" type="number" min="16" max="60" value="24" required></label></div><p>Da 16 a 60 metri per lato. Il nuovo progetto sostituisce la bozza di questa sessione: esportala prima se vuoi conservarne una copia. Puoi annullare la creazione dall’editor.</p><p id="new-error" role="status"></p><button type="submit" class="primary">Crea pianta vuota →</button><button type="button" id="new-cancel">Torna al progetto</button></form>`;
document.body.append(newDialog);$('#new-project').onclick=()=>newDialog.showModal();$('#new-cancel').onclick=()=>newDialog.close();
$('#new-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);try{const empty=blankWarehouse(data.get('name'),data.get('width'),data.get('depth'));commit(()=>{project=empty;selected=null;tab='design';});setView('2d');document.body.classList.remove('expanded','inspector-open');newDialog.close();toast('Pianta creata e salvata sul dispositivo. Aggiungi gli elementi dal catalogo.');}catch(error){$('#new-error').textContent=error.message;}};
$('#project-name').onchange=e=>{const name=e.target.value.trim();if(!name){updateUI();return;}commit(()=>project.name=name.slice(0,100));};
$('#save-project').onclick=()=>{save();toast($('#save-status').textContent);};
$('#export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));a.href=url;a.download=(project.name||'warehouse-lab').replace(/[<>:"/\\|?*]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progetto esportato.');};
$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('File troppo grande. Massimo 2 MB.');const p=validate(JSON.parse(await file.text()));commit(()=>{project=p;selected=null;});studio.center(mode);toast('Progetto aperto.');}catch(err){toast(err.message);}e.target.value='';};
// Persistent, discoverable tools shared by the floor plan and the 3D scene.
const navigationDock=document.createElement('div');navigationDock.className='navigation-dock';
navigationDock.innerHTML='<div class="zoom-controls" role="group" aria-label="Navigazione vista"><button id="zoom-out" aria-label="Allontana vista" title="Allontana">−</button><button id="zoom-fit" title="Mostra tutto il magazzino">Adatta</button><button id="zoom-in" aria-label="Avvicina vista" title="Avvicina">+</button></div><button id="help-editor" title="Guida e scorciatoie" aria-label="Guida e scorciatoie">?</button>';
$('#viewport').append(navigationDock);
const workflow=document.createElement('div');workflow.className='workflow-strip';
workflow.innerHTML='<span id="workflow-status" aria-live="polite"></span><div><button id="dock-focus" title="Inquadra elemento (F)">Inquadra</button><button id="dock-duplicate" title="Duplica (Ctrl+D)">Duplica</button><button id="dock-delete" title="Elimina (Canc)">Elimina</button></div>';
$('.metrics').before(workflow);
$('#dock-focus').onclick=()=>focusObject(selected);$('#dock-duplicate').onclick=duplicateSelected;$('#dock-delete').onclick=deleteSelected;
function zoomBy(factor){if(mode==='2d')plan.zoomBy(factor);else{const offset=studio.camera.position.clone().sub(studio.controls.target);const distance=Math.max(studio.controls.minDistance,Math.min(studio.controls.maxDistance,offset.length()/factor));studio.camera.position.copy(studio.controls.target).add(offset.setLength(distance));studio.controls.update();studio.needsRender=true;}}
$('#zoom-in').onclick=()=>zoomBy(1.2);$('#zoom-out').onclick=()=>zoomBy(1/1.2);$('#zoom-fit').onclick=()=>$('#center').click();
const help=document.createElement('dialog');help.className='editor-help';help.setAttribute('aria-labelledby','help-title');
help.innerHTML='<form method="dialog"><button aria-label="Chiudi guida">×</button></form><div class="eyebrow">LAVORARE NEL MAGAZZINO</div><h2 id="help-title">Dallo spazio al progetto.</h2><p>Aggiungi dal catalogo, disponi in pianta e controlla il risultato in 3D. Le nuove attrezzature cercano uno spazio libero; le aree funzionali si possono sovrapporre.</p><dl><div><dt>1 / 2 / 3</dt><dd>Vista 3D / Pianta / Vista interna</dd></div><div><dt>F</dt><dd>Inquadra la selezione</dd></div><div><dt>R</dt><dd>Ruota di 90°</dd></div><div><dt>Frecce</dt><dd>Sposta in pianta secondo l’aggancio</dd></div><div><dt>Maiusc + frecce</dt><dd>Sposta di un metro</dd></div><div><dt>Ctrl + D</dt><dd>Duplica in uno spazio libero</dd></div><div><dt>Canc</dt><dd>Elimina la selezione</dd></div><div><dt>Ctrl + Z / Ctrl + Y</dt><dd>Annulla / Ripristina</dd></div></dl><p>Gli oggetti spostati manualmente possono creare interferenze: apri Analisi layout per individuarle. Le modifiche si salvano sul dispositivo; Esporta progetto crea una copia trasferibile.</p>';
document.body.append(help);$('#help-editor').onclick=()=>help.showModal();
const capture=document.createElement('button');capture.id='capture-view';capture.textContent='Salva vista';capture.title='Scarica la vista 3D come immagine PNG';$('.actions').prepend(capture);
const viewPreview=document.createElement('dialog');viewPreview.className='editor-help view-preview';viewPreview.setAttribute('aria-labelledby','view-preview-title');viewPreview.innerHTML='<form method="dialog"><button aria-label="Chiudi anteprima">×</button></form><h2 id="view-preview-title">La tua vista del magazzino.</h2><img alt="Vista 3D pronta per il download"><a class="download-view" download="magazzino-vista.png">Scarica PNG ↗</a>';document.body.append(viewPreview);
capture.onclick=()=>{if(mode==='2d')return;studio.composer.render();const src=studio.renderer.domElement.toDataURL('image/png');viewPreview.querySelector('img').src=src;viewPreview.querySelector('a').href=src;viewPreview.showModal();};
document.addEventListener('keydown',e=>{
 if(help.open||viewPreview.open||e.target.closest('input,textarea,select,[contenteditable]')||e.altKey)return;
 const key=e.key.toLowerCase(),o=project.objects.find(o=>o.id===selected);
 if((e.ctrlKey||e.metaKey)&&key==='d'){e.preventDefault();duplicateSelected();return;}
 if(e.ctrlKey||e.metaKey)return;
 if(key==='?'){$('#help-editor').click();return;}
 if(['1','2','3'].includes(key)){e.preventDefault();setView({'1':'3d','2':'2d','3':'inside'}[key]);return;}
 if(key==='f'&&o){e.preventDefault();focusObject(o.id);}
 if(key==='r'&&o){e.preventDefault();$('#quick-rotate').click();}
 if(key==='delete'&&o){e.preventDefault();deleteSelected();}
 if(mode==='2d'&&o&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();const step=e.shiftKey?1:(plan.step||.1),dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dz=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
  try{const pos=placeInWarehouse(project,o,o.x+dx,o.z+dz,0);if(pos.x!==o.x||pos.z!==o.z)commit(()=>Object.assign(o,pos));}catch(error){toast(error.message);}
 }
});
rebuild();setView(session==='plan'?'2d':'3d');
if(session==='exercise'){studio.setMotion(false,true);openInspector();}
if(session!=='personal')$('#save-status').textContent='Salvataggio separato dal progetto personale';

if(new URLSearchParams(location.search).get('wide')==='1')expandView(true);

export async function finishLoading(){
 await studio.renderer.compileAsync(studio.scene,studio.camera);
 studio.composer.render();studio.needsRender=true;
 if(new URLSearchParams(location.search).get('templates')==='1'){templateDialog.showModal();const url=new URL(location.href);url.searchParams.delete('templates');window.history.replaceState(null,'',url);}
 else if(new URLSearchParams(location.search).get('new')==='1'){newDialog.showModal();const url=new URL(location.href);url.searchParams.delete('new');window.history.replaceState(null,'',url);}
}
export function loadCatalogPreviews(){
 return studio.previews(catalog,(type,url)=>{const img=document.querySelector(`[data-add="${type}"] .thumb img`);if(img){img.src=url;img.hidden=false;}});
}
