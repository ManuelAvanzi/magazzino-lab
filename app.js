import { WarehouseScene } from './warehouse-scene.js';
import { catalog, demo, warehouseDemo, item, isZone, analyze, validate } from './model.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let project=warehouseDemo(),selected=null,tab='design',history=[],mode='3d';
try { const saved=localStorage.getItem('magazzino-lab-v1');if(saved)project=validate(JSON.parse(saved)); } catch { toast('Salvataggio non disponibile: aperto il magazzino di esempio.'); }
const studio=new WarehouseScene($('#viewport'),id=>{selected=id;if(id){tab='design';openInspector();}rebuild();});
function motionStatus(){const count=studio.movers.length;$('#motion-toggle').textContent=studio.motionEnabled?'Ⅱ Pausa':'▶ Avvia';$('#motion-toggle').setAttribute('aria-pressed',String(studio.motionEnabled));$('#motion-toggle').disabled=!count;$('#motion-status').textContent=!count?'Nessun carrello su corsia libera':studio.motionEnabled?`${count} ${count===1?'carrello in movimento':'carrelli in movimento'}`:'Animazione in pausa · layout invariato';}
studio.onMotionChange=motionStatus;
$('#motion-toggle').onclick=()=>studio.setMotion(!studio.motionEnabled);
$('#lighting').onchange=e=>studio.setLighting(e.target.value);

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function openInspector(){document.body.classList.remove('inspector-closed');document.body.classList.add('inspector-open');}
function save(){try{localStorage.setItem('magazzino-lab-v1',JSON.stringify(project));$('#save-status').textContent='✓ Salvato su questo dispositivo';}catch{$('#save-status').textContent='Salvataggio non disponibile: esporta il progetto';}}
function commit(action){studio.setMotion(false,true);history.push(JSON.stringify(project));if(history.length>40)history.shift();action();save();rebuild();}
function rebuild(){studio.build(project,selected);updateUI();}
function setView(view){if(view==='2d')studio.setMotion(false,true);mode=view;studio.center(view);for(const [id,value]of [['view3d','3d'],['view2d','2d'],['inside','inside']])$('#'+id).classList.toggle('active',mode===value);$('#camera-label').textContent={inside:'VISTA INTERNA', '3d':'PROSPETTIVA','2d':'DALL’ALTO'}[view];$('.hint').innerHTML=view==='inside'?'Trascina per esplorare · Rotella per avvicinarti · Panoramica per tornare all’editor':'↔ Trascina per orbitare <i>·</i> Rotella per zoom <i>·</i> Clic per selezionare';}
function updateUI(){const issues=analyze(project),racks=project.objects.filter(o=>o.type==='rack');$('#width').value=project.width;$('#depth').value=project.depth;$('#area').textContent=project.width*project.depth+' m²';$('#area-label').textContent=project.width+' × '+project.depth+' m · Altezza capannone 7,5 m';$('#capacity').textContent=racks.length*6;$('#occupancy').textContent=Math.round(racks.reduce((s,o)=>s+o.w*o.d,0)/(project.width*project.depth)*100)+'%';$('#issues').textContent=issues.length;$('#issue-count').textContent=issues.length;$('#undo').disabled=!history.length;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));renderPanel(issues);}
function renderPanel(issues){const panel=$('#panel'),o=project.objects.find(o=>o.id===selected);
if(tab==='safety'){
panel.innerHTML='<div class="eyebrow">ANALISI DEL LAYOUT</div><h2>Interferenze operative</h2><p class="muted">Ingombri e percorsi vengono verificati a ogni modifica.</p>'+(issues.length?issues.map((i,n)=>`<article class="issue"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p><button data-issue="${n}">Individua nel magazzino →</button></article>`).join(''):'<div class="good">✓ Nessuna interferenza rilevata dai controlli geometrici attivi.</div>')+'<p class="muted">Non verificati: portate, larghezze minime, distanze antincendio e continuità delle vie di esodo.</p>';
panel.querySelectorAll('[data-issue]').forEach(b=>b.onclick=()=>{selected=issues[+b.dataset.issue].id;tab='design';rebuild();studio.focus(selected);});return;
}
if(tab==='learn'){
panel.innerHTML='<div class="eyebrow">ESERCITAZIONE / 01</div><h2>Progettare i flussi</h2><div class="step"><b>01 — Leggi lo spazio</b>Individua ricevimento, stoccaggio, imballaggio e spedizioni.</div><div class="step"><b>02 — Osserva i percorsi</b>Confronta i percorsi di pedoni e mezzi. Dove si incontrano?</div><div class="step"><b>03 — Risolvi le interferenze</b>Apri lo scenario e sposta gli ostacoli che occupano i passaggi.</div><div class="step"><b>04 — Motiva il progetto</b>Confronta le configurazioni e spiega quali scelte riducono le interferenze.</div><button id="learn-start" class="primary">Apri scenario didattico →</button><p class="muted">I posti pallet sono teorici: 2 per livello × 3 livelli per modulo. Non esprimono una portata certificata.</p>';$('#learn-start').onclick=exercise;return;
}
if(!o){panel.innerHTML='<div class="eyebrow">CENTRO LOGISTICO</div><h2>Organizza lo spazio.<br>Studia i flussi.</h2><p class="muted">Seleziona un’attrezzatura nella scena per modificarne le proprietà.</p><div class="step"><b>Attrezzature in scala</b>Scaffalature, pallet, carrelli e postazioni di imballaggio.</div><div class="step"><b>Viste di lavoro</b>Passa dalla panoramica alla vista interna per leggere il magazzino a scala umana.</div><div class="step"><b>Analisi del layout</b>Individua ingombri sovrapposti e interferenze sui percorsi.</div><button id="overview-inside">Esplora l’interno ↗</button>';$('#overview-inside').onclick=()=>setView('inside');return;}
panel.innerHTML=`<div class="eyebrow">ELEMENTO SELEZIONATO</div><h2>${esc(o.name)}</h2><span class="selected-badge">${isZone(o)?'Area funzionale':'Attrezzatura'} · ${o.rotation}°</span><div class="fields"><label class="wide">Nome<input id="name" maxlength="100" value="${esc(o.name)}"></label>${[['x','Posizione X · m',-100,100],['z','Posizione Z · m',-100,100],['w','Larghezza · m',.1,60],['d','Profondità · m',.1,60]].map(([k,n,min,max])=>`<label>${n}<input data-field="${k}" type="number" step="0.1" min="${min}" max="${max}" value="${o[k]}"></label>`).join('')}</div><div class="row-actions"><button id="apply" class="primary">Applica proprietà</button><button id="rotate">↻ Ruota 90°</button><button id="duplicate">Duplica</button><button id="focus">⌖ Inquadra</button><button id="delete">Elimina</button></div><p class="muted">Coordinate dal centro del magazzino. Le misure rappresentano l’ingombro dell’elemento.</p>`;
$('#apply').onclick=()=>{const inputs=[...panel.querySelectorAll('[data-field]')];if(inputs.some(i=>!i.value||!i.checkValidity()))return toast('Controlla le misure inserite.');const values=Object.fromEntries(inputs.map(i=>[i.dataset.field,Number(i.value)]));const name=$('#name').value.trim()||catalog.find(c=>c.type===o.type).name;commit(()=>Object.assign(o,values,{name}));toast('Proprietà aggiornate.');};
$('#rotate').onclick=()=>commit(()=>o.rotation=(o.rotation+90)%360);
$('#focus').onclick=()=>studio.focus(o.id);
$('#delete').onclick=()=>commit(()=>{project.objects=project.objects.filter(a=>a.id!==o.id);selected=null;});
$('#duplicate').onclick=()=>{if(project.objects.length>=300)return toast('Massimo 300 elementi.');commit(()=>{const copy={...o,id:crypto.randomUUID(),x:Math.min(100,o.x+1),z:Math.min(100,o.z+1)};project.objects.push(copy);selected=copy.id;});};
}

const previews=studio.previews(catalog);
$('#catalog').innerHTML=catalog.map(c=>`<button class="catalog-card" data-add="${c.type}" title="Aggiungi ${esc(c.name.toLowerCase())}"><span class="thumb"><img src="${previews[c.type]}" alt="" width="128" height="84"></span><span class="plus">+</span><span class="catalog-name">${esc(c.name)}</span></button>`).join('');
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(project.objects.length>=300)return toast('Massimo 300 elementi.');commit(()=>{const o=item(b.dataset.add);project.objects.push(o);selected=o.id;tab='design';});openInspector();});
for(const k of ['width','depth'])$('#'+k).onchange=e=>{const value=Number(e.target.value);if(!Number.isFinite(value)||value<16||value>60){toast('Dimensioni ammesse: da 16 a 60 metri.');updateUI();return;}commit(()=>project[k]=value);studio.center(mode);};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;if(tab!=='design'){studio.setMotion(false,true);openInspector();}updateUI();});
$('#undo').onclick=()=>{if(!history.length)return;studio.setMotion(false,true);project=JSON.parse(history.pop());selected=null;save();rebuild();};
$('#center').onclick=()=>studio.center(mode);
$('#view3d').onclick=()=>setView('3d');$('#view2d').onclick=()=>setView('2d');$('#inside').onclick=()=>setView('inside');
$('#expand').onclick=()=>{document.body.classList.toggle('expanded');$('#expand').title=document.body.classList.contains('expanded')?'Ripristina pannelli':'Espandi vista 3D';};
$('#library-toggle').onclick=()=>document.body.classList.toggle('mobile-library');
$('#inspector-toggle').onclick=()=>{document.body.classList.remove('mobile-library');const closed=document.body.classList.contains('inspector-closed')||(innerWidth<=1250&&!document.body.classList.contains('inspector-open'));if(closed)openInspector();else{document.body.classList.add('inspector-closed');document.body.classList.remove('inspector-open');}};
$('#close-inspector').onclick=()=>{document.body.classList.add('inspector-closed');document.body.classList.remove('inspector-open');};
$('#showcase').onclick=()=>{commit(()=>{project=warehouseDemo();selected=null;tab='design';});setView('3d');document.body.classList.remove('inspector-open');toast('Magazzino completo caricato. Annulla ripristina il progetto precedente.');};
function exercise(){commit(()=>{project=demo();project.objects.push(item('pallet',-11,0),item('pallet',-11,11),item('pallet',-7,-6));selected=null;tab='safety';});setView('3d');openInspector();toast('Tre interferenze da risolvere. Annulla ripristina il progetto precedente.');}
$('#exercise').onclick=exercise;
$('#export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));a.href=url;a.download='magazzino-lab.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progetto esportato.');};
$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('File troppo grande. Massimo 2 MB.');const p=validate(JSON.parse(await file.text()));commit(()=>{project=p;selected=null;});studio.center(mode);toast('Progetto aperto.');}catch(err){toast(err.message);}e.target.value='';};
rebuild();setView('3d');
