import {suggestedFlow,makeAuthoredFlow} from './flow-model.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderFlowEditor(panel,{project,commit,lesson,launch}){
 const flows=project.flows||[],flow=flows.find(f=>f.id===lesson.flowId)||flows[0];lesson.flowId=flow?.id;
 const change=fn=>commit(fn);
 panel.innerHTML='<p class="eyebrow">03 / PROGETTA LE OPERAZIONI</p><h2>I flussi del magazzino</h2><p>Collega le postazioni nell’ordine in cui passa la merce. Per ogni tappa spiega cosa fare e cosa verificare.</p>';
 const button=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;return b;};
 const addFlow=()=>change(()=>{const f=suggestedFlow(project);(project.flows??=[]).push(f);lesson.flowId=f.id;});
 if(!flow){panel.append(button('Crea il primo flusso →',addFlow));return;}
 const select=document.createElement('select');select.setAttribute('aria-label','Flusso da modificare');for(const f of flows){const o=new Option(f.name,f.id);select.add(o);}select.value=flow.id;select.onchange=()=>{lesson.flowId=select.value;lesson.build(project);renderFlowEditor(panel,{project,commit,lesson,launch});};panel.append(select);
 const field=(label,value,apply,multiline=false)=>{const l=document.createElement('label');l.className='flow-field';l.textContent=label;const input=document.createElement(multiline?'textarea':'input');input.value=value;input.maxLength=multiline?800:100;input.onblur=()=>{if(input.value!==value)change(()=>apply(input.value));};l.append(input);return l;};
 panel.append(field('Nome del flusso',flow.name,v=>flow.name=v));
 const controls=document.createElement('div');controls.className='flow-author-actions';
 const play=button('▶ Anteprima del percorso',()=>{lesson.go(0);lesson.playing=true;lesson.sync();});const result=makeAuthoredFlow(project,flow.id);play.disabled=!!result.error;controls.append(play,button('Ⅱ Pausa',()=>{lesson.playing=false;lesson.sync();}));panel.append(controls);
 const status=document.createElement('p');status.className=result.error?'issue':'flow-ready';status.textContent=result.error||'✓ Postazioni collegate. Il percorso evita gli ingombri.';panel.append(status);
 const list=document.createElement('ol');list.className='flow-author-list';panel.append(list);
 const destinations=project.objects.filter(o=>['receiving','returns','rack','bench','shipping','rollerConveyor','parcelScale','pallet'].includes(o.type));
 flow.steps.forEach((step,i)=>{
  const li=document.createElement('li'),details=document.createElement('details');details.open=i===Math.min(lesson.editIndex||0,flow.steps.length-1);details.innerHTML=`<summary><span>${String(i+1).padStart(2,'0')}</span> ${escape(step.title||'Nuova tappa')}</summary>`;details.ontoggle=()=>{if(details.open)lesson.editIndex=i;};
  const img=document.createElement('img');img.src=`assets/phases/${step.image}.png`;img.alt='Illustrazione didattica generata con AI';img.className='phase-image';details.append(img);
  details.append(field('Titolo della tappa',step.title,v=>step.title=v));
  const dest=document.createElement('label');dest.className='flow-field';dest.textContent='Postazione nel tuo magazzino';const sel=document.createElement('select');sel.setAttribute('aria-label','Postazione nel tuo magazzino');sel.add(new Option('Scegli una postazione…',''));destinations.forEach(o=>sel.add(new Option(`${o.name} · x ${o.x}, z ${o.z}`,o.id)));sel.value=step.objectId;sel.onchange=()=>change(()=>step.objectId=sel.value);dest.append(sel);details.append(dest);
  const kind=document.createElement('select');kind.setAttribute('aria-label','Direzione della merce');kind.add(new Option('Merce in entrata','in'));kind.add(new Option('Merce in uscita','out'));kind.value=step.kind;kind.onchange=()=>change(()=>step.kind=kind.value);details.append(kind);
  details.append(field('Operazione e perché è necessaria',step.why,v=>step.why=v,true),field('Cosa deve verificare l’utente',step.check,v=>step.check=v,true));
  const image=document.createElement('select');image.setAttribute('aria-label','Immagine della tappa');[['inbound','Ricevimento e controllo'],['packing','Preparazione e imballaggio'],['outbound','Spedizione']].forEach(([id,name])=>image.add(new Option(name,id)));image.value=step.image;image.onchange=()=>change(()=>step.image=image.value);details.append(image);
  const actions=document.createElement('div');actions.className='flow-author-actions';const up=button('↑ Sposta prima',()=>change(()=>{[flow.steps[i-1],flow.steps[i]]=[flow.steps[i],flow.steps[i-1]];lesson.editIndex=i-1;}));up.disabled=i===0;const down=button('↓ Sposta dopo',()=>change(()=>{[flow.steps[i+1],flow.steps[i]]=[flow.steps[i],flow.steps[i+1]];lesson.editIndex=i+1;}));down.disabled=i===flow.steps.length-1;actions.append(up,down,button('Rimuovi tappa',()=>change(()=>flow.steps.splice(i,1))));details.append(actions);li.append(details);list.append(li);
 });
 const add=button('+ Aggiungi tappa',()=>change(()=>{flow.steps.push({id:crypto.randomUUID(),title:'Nuova tappa',objectId:'',kind:'out',image:'packing',why:'',check:''});lesson.editIndex=flow.steps.length-1;}));add.disabled=flow.steps.length>=30;
 const run=button('Simula questo flusso →',()=>launch(flow.id));run.className='primary';run.disabled=!!result.error;
 const another=button('+ Nuovo flusso',addFlow);another.disabled=flows.length>=12;
 panel.append(add,run,another,button('Elimina questo flusso',()=>{if(confirm('Eliminare il flusso e le sue tappe?'))change(()=>project.flows=flows.filter(f=>f.id!==flow.id));}));
 const note=document.createElement('p');note.className='muted';note.textContent='I flussi sono inclusi nel progetto: usa Progetto → Salva online per ritrovarli nel tuo account. Le linee rappresentano colli simbolici, non le manovre di un carrello.';panel.append(note);
}
