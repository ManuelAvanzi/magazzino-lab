// Reorganize the existing controls; their original handlers and IDs stay intact.
export function simplifyStudio({view,design}){
 const $=s=>document.querySelector(s),body=document.body;
 body.classList.add('simple-studio');
 const menu=(label,cls='')=>{const el=document.createElement('details');el.className='studio-menu '+cls;const summary=document.createElement('summary');summary.textContent=label+' ▾';const content=document.createElement('div');content.className='studio-menu-content';el.append(summary,content);return {el,content};};
 const header=$('#studio-app>header'),actions=$('.actions');
 const heading=document.createElement('div');heading.className='project-heading';
 const name=$('#project-name');name.setAttribute('aria-label','Nome del progetto');heading.append(name,$('#save-status'));header.querySelector('.brand').after(heading);
 const projectMenu=menu('Progetto');actions.append(projectMenu.el);
 for(const id of ['new-project','import','save-project','export','capture-view','templates-open'])projectMenu.content.append($('#'+id));
 $('#save-project').textContent='Salva sul dispositivo';$('#export').classList.remove('primary');$('#export').textContent='Esporta file progetto';$('#import').textContent='Apri file progetto';$('#templates-open').textContent='Scegli un template';
 const explore=$('#inside');explore.textContent='Esplora il magazzino';explore.classList.add('primary');actions.append(projectMenu.el,explore);explore.onclick=()=>{design();view('inside');body.classList.add('inspector-closed');body.classList.remove('inspector-open','mobile-library');};
 const nav=$('#studio-app>nav'),workflow=document.createElement('div');workflow.className='simple-workflow';
 const plan=$('#view2d'),scene=$('#view3d');plan.textContent='01  Pianta 2D';scene.textContent='02  Allestimento 3D';workflow.append(plan,scene);
 const lab=menu('Laboratorio');for(const selector of ['[data-tab="safety"]','[data-tab="flows"]','[data-tab="learn"]','nav button[onclick]'])lab.content.append($(selector));
 const oldDesign=$('[data-tab="design"]');oldDesign.hidden=true;lab.content.append(oldDesign);
 const panels=menu('Pannelli'),library=$('#library-toggle'),properties=$('#inspector-toggle');library.textContent='Catalogo / Elementi';properties.textContent='Proprietà';panels.content.append(library,properties);
 library.removeAttribute('aria-label');properties.removeAttribute('aria-label');
 const switches=document.createElement('div');switches.className='simple-switches';switches.append(lab.el,panels.el);nav.replaceChildren(workflow,switches);nav.setAttribute('aria-label','Fasi di progettazione');
 const left=$('.left'),space=$('.space-section'),catalog=$('#catalog-section'),objects=$('.object-details');
 left.id='library-panel';$('.right').id='properties-panel';library.setAttribute('aria-controls','library-panel');properties.setAttribute('aria-controls','properties-panel');
 $('.project-name-label').remove();space.querySelector('h2').textContent='Dimensioni dello spazio';
 const tabs=document.createElement('div');tabs.className='library-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Contenuti del pannello');
 const elements=document.createElement('section');elements.className='elements-section';elements.innerHTML='<h2>Elementi nel progetto</h2><p class="muted">Seleziona un oggetto per inquadrarlo e modificarlo.</p>';objects.open=true;elements.append(objects);
 const sections={space,catalog,elements};
 function showLibrary(key){for(const [id,section]of Object.entries(sections))section.hidden=id!==key;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.section===key)));left.scrollTop=0;}
 for(const [id,label]of [['space','Spazio'],['catalog','Catalogo'],['elements','Elementi']]){const b=document.createElement('button');b.textContent=label;b.dataset.section=id;b.onclick=()=>showLibrary(id);tabs.append(b);}
 left.prepend(tabs);left.append(elements);$('.lesson-teaser').hidden=true;$('.library-footer').hidden=true;showLibrary(body.classList.contains('plan-mode')?'space':'catalog');
 library.onclick=()=>{const narrow=matchMedia('(max-width:760px)').matches;if(narrow){body.classList.toggle('mobile-library');body.classList.remove('inspector-open');body.classList.add('inspector-closed');}else body.classList.toggle('library-closed');syncPanels();};
 function syncPanels(){library.setAttribute('aria-expanded',String(matchMedia('(max-width:760px)').matches?body.classList.contains('mobile-library'):!body.classList.contains('library-closed')));properties.setAttribute('aria-expanded',String(!body.classList.contains('inspector-closed')));}
 window.addEventListener('resize',syncPanels);
 new MutationObserver(syncPanels).observe(body,{attributes:true,attributeFilter:['class']});syncPanels();
 plan.onclick=()=>{design();view('2d');showLibrary('space');};scene.onclick=()=>{design();view('3d');};
 const viewbar=$('.viewbar'),tools=$('.viewport-tools'),settings=menu('Scena');
 settings.content.append($('.atmosphere-bar'));viewbar.replaceChildren(tools,settings.el);tools.prepend($('#undo'),$('#redo'));tools.append($('#expand'));
 // Summary numbers are secondary; retain them in a thin status strip.
 $('.metrics').setAttribute('aria-label','Riepilogo del progetto');
 const projectStatus=$('#workflow-status');if(projectStatus)projectStatus.textContent='';
 const closeMenus=()=>document.querySelectorAll('.studio-menu[open]').forEach(el=>el.open=false);
 document.addEventListener('click',e=>{document.querySelectorAll('.studio-menu[open]').forEach(el=>{if(!el.contains(e.target)||e.target.closest('.studio-menu-content button'))el.open=false;});});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus();});
 document.querySelectorAll('.studio-menu').forEach(el=>el.addEventListener('toggle',()=>{if(el.open)document.querySelectorAll('.studio-menu[open]').forEach(other=>{if(other!==el)other.open=false;});}));
}
